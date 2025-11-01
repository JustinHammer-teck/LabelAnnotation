"""Simple PDF to Image conversion service for Label Studio OCR workflows"""

import fitz
import logging
import io
import numpy as np

from PIL import Image
from typing import Dict, List
from core.redis import start_job_async_or_sync
from django.conf import settings
from django.core.files.base import ContentFile
from django.db import transaction
from django.utils.timezone import now

from .models import FileUpload, PDFImageRelationship
from projects.models import ProjectReimport
from tasks.models import Task, OCRCharacterExtraction

try:
    import easyocr
    EASYOCR_AVAILABLE = True
except ImportError:
    EASYOCR_AVAILABLE = False
    logger = logging.getLogger(__name__)
    logger.warning("EasyOCR not available")

try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False
    logger = logging.getLogger(__name__)
    logger.warning("OpenCV (cv2) not available, binarization disabled")

logger = logging.getLogger(__name__)

SUPPORTED_IMAGE_EXTENSIONS = ('.png', '.jpg', '.jpeg', '.tiff', '.bmp')
DEFAULT_OCR_DPI = 300

_easyocr_reader = None

def get_easyocr_reader():
    """
    Get or create cached EasyOCR reader instance.
    Singleton pattern to avoid reloading language models for each image.
    """
    global _easyocr_reader
    if _easyocr_reader is None:
        if not EASYOCR_AVAILABLE:
            logger.warning("EasyOCR not available, cannot create reader")
            return None
        logger.info("Initializing EasyOCR reader (this may take 30-60 seconds)...")
        _easyocr_reader = easyocr.Reader(['ch_sim', 'en'], gpu=False)
        logger.info("EasyOCR reader initialized and cached for reuse")
    return _easyocr_reader

def is_support_document(task):
    return task.file_upload and (
        task.file_upload.file_name.lower().endswith('.pdf')
        or task.file_upload.file_name.lower().endswith(SUPPORTED_IMAGE_EXTENSIONS)
    )


def async_reimport_with_ocr_success_handler(reimport_id, organization_id, user, **kwargs):
    """
    Success callback for async reimport that triggers OCR processing
    """
    if not settings.OCR_ENABLED:
        return

    try:
        reimport = ProjectReimport.objects.get(id=reimport_id)
        if reimport.status != ProjectReimport.Status.COMPLETED:
            return

        tasks = Task.objects.filter(
            project=reimport.project,
            file_upload_id__in=reimport.file_upload_ids
        )

        ocr_tasks = []
        for task in tasks:
            if is_support_document(task):
                if not task.meta:
                    task.meta = {}

                task.meta['ocr_status'] = 'processing'
                task.meta['ocr_started_at'] = now().isoformat()
                ocr_tasks.append(task)

        if ocr_tasks:
            for task in ocr_tasks:
                task.save(update_fields=['meta'])

            ocr_task_ids = [task.id for task in ocr_tasks]
            logger.info(f'Queuing OCR background job for {len(ocr_task_ids)} tasks after async reimport')

            start_job_async_or_sync(
                process_ocr_for_tasks_background,
                ocr_task_ids,
                queue_name='high'
            )

            logger.info('OCR background job queued successfully after async reimport')
        else:
            logger.info('No tasks require OCR processing after async reimport')

    except Exception as e:
        logger.error(f'Failed to queue OCR after async reimport: {e}', exc_info=True)

def convert_pdf_to_images_simple(pdf_file_upload: FileUpload) -> List[Dict]:
    """
    Simple PDF to image conversion
    
    Args:
        pdf_file_upload: FileUpload instance containing the PDF
        
    Returns:
        List of conversion results with file_upload_id for each page
    """
    logger.info(f"Starting PDF conversion for: {pdf_file_upload.file_name}")
    
    results = []
    
    try:
        if hasattr(settings, 'AWS_S3_ENDPOINT_URL') and settings.AWS_S3_ENDPOINT_URL:
            pdf_file_upload.file.seek(0)
            pdf_content = pdf_file_upload.file.read()
            pdf_document = fitz.open(stream=pdf_content, filetype="pdf")
            logger.debug("Opened PDF from MinIO storage")
        else:
            pdf_path = pdf_file_upload.file.path
            pdf_document = fitz.open(pdf_path)
            logger.debug(f"Opened PDF from local path: {pdf_path}")
        
        total_pages = pdf_document.page_count
        logger.info(f"PDF has {total_pages} pages")
        
        with transaction.atomic():
            for page_num in range(total_pages):
                page_number = page_num + 1
                logger.debug(f"Processing page {page_number}/{total_pages}")
                
                page = pdf_document[page_num]

                mat = fitz.Matrix(300/72.0, 300/72.0)
                pix = page.get_pixmap(matrix=mat, alpha=False, colorspace=fitz.csGRAY)

                img = Image.frombytes("L", (pix.width, pix.height), pix.samples)

                if settings.OCR_BINARIZE and CV2_AVAILABLE:
                    img_array = np.array(img)
                    binary = cv2.adaptiveThreshold(
                        img_array, 255,
                        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                        cv2.THRESH_BINARY, 11, 2
                    )
                    img = Image.fromarray(binary)
                    logger.debug(f"Page {page_number} binarized for text optimization")

                output = io.BytesIO()
                img.save(output, format='PNG', optimize=True, compress_level=settings.OCR_PNG_COMPRESSION)
                img_bytes = output.getvalue()

                logger.debug(f"Page {page_number} converted: {len(img_bytes)} bytes, {pix.width}x{pix.height}px")

                pdf_name = pdf_file_upload.file_name.replace('.pdf', '').replace('.PDF', '')
                image_filename = f"{pdf_name}_page_{page_number:03d}.png"
                
                image_file = ContentFile(img_bytes, name=image_filename)
                image_file_upload = FileUpload(
                    user=pdf_file_upload.user,
                    project=pdf_file_upload.project
                )
                image_file_upload.file.save(image_filename, image_file, save=True)
                logger.info(f"Uploaded page {page_number} to MinIO: {image_file_upload.file.name}")
                
                relationship = PDFImageRelationship.objects.create(
                    pdf_file=pdf_file_upload,
                    image_file=image_file_upload,
                    page_number=page_number,
                    image_format='png',
                    resolution_dpi=300,
                    extraction_params={
                        'width': pix.width,
                        'height': pix.height,
                        'binarized': settings.OCR_BINARIZE and CV2_AVAILABLE
                    }
                )
                logger.debug(f"Created PDFImageRelationship id={relationship.id}")
                
                results.append({
                    'page_number': page_number,
                    'file_upload_id': image_file_upload.id,
                    'relationship_id': relationship.id,
                    'image_filename': image_filename,
                    'image_url': image_file_upload.url
                })
                
                pix = None
        
        pdf_document.close()
        logger.info(f"Successfully converted {len(results)} pages")
        
    except Exception as e:
        logger.error(f"Error converting PDF: {str(e)}", exc_info=True)
        raise
    
    return results


def render_pdf_page_job(pdf_file_upload_id, page_num, total_pages, **kwargs):
    """
    Background job to render a single PDF page.
    Called by RQ workers in parallel.

    Args:
        pdf_file_upload_id: FileUpload ID
        page_num: 0-indexed page number
        total_pages: Total pages in PDF
        **kwargs: Extra metadata (coordination_key, etc.)
    """
    try:
        pdf_file_upload = FileUpload.objects.get(id=pdf_file_upload_id)

        if hasattr(settings, 'AWS_S3_ENDPOINT_URL') and settings.AWS_S3_ENDPOINT_URL:
            pdf_file_upload.file.seek(0)
            pdf_content = pdf_file_upload.file.read()
        else:
            with open(pdf_file_upload.file.path, 'rb') as f:
                pdf_content = f.read()

        doc = fitz.open(stream=pdf_content, filetype="pdf")
        page = doc[page_num]

        mat = fitz.Matrix(300/72.0, 300/72.0)
        pix = page.get_pixmap(matrix=mat, alpha=False, colorspace=fitz.csGRAY)

        img = Image.frombytes("L", (pix.width, pix.height), pix.samples)

        if settings.OCR_BINARIZE and CV2_AVAILABLE:
            img_array = np.array(img)
            binary = cv2.adaptiveThreshold(
                img_array, 255,
                cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                cv2.THRESH_BINARY, 11, 2
            )
            img = Image.fromarray(binary)

        output = io.BytesIO()
        img.save(output, format='PNG', optimize=True, compress_level=settings.OCR_PNG_COMPRESSION)
        img_bytes = output.getvalue()

        doc.close()

        page_number = page_num + 1
        pdf_name = pdf_file_upload.file_name.replace('.pdf', '').replace('.PDF', '')
        image_filename = f"{pdf_name}_page_{page_number:03d}.png"

        image_file = ContentFile(img_bytes, name=image_filename)
        image_file_upload = FileUpload(
            user=pdf_file_upload.user,
            project=pdf_file_upload.project
        )
        image_file_upload.file.save(image_filename, image_file, save=True)

        relationship = PDFImageRelationship.objects.create(
            pdf_file=pdf_file_upload,
            image_file=image_file_upload,
            page_number=page_number,
            image_format='png',
            resolution_dpi=300,
            extraction_params={
                'width': pix.width,
                'height': pix.height,
                'binarized': settings.OCR_BINARIZE and CV2_AVAILABLE
            }
        )

        logger.info(f"Rendered page {page_number}/{total_pages} for PDF {pdf_file_upload_id}")

        return {
            'page_number': page_number,
            'file_upload_id': image_file_upload.id,
            'relationship_id': relationship.id,
            'success': True
        }

    except Exception as e:
        logger.error(f"Failed to render page {page_num + 1}: {e}", exc_info=True)
        return {'success': False, 'error': str(e), 'page_num': page_num}


def convert_pdf_to_images_parallel(pdf_file_upload: FileUpload) -> List[Dict]:
    """
    Coordinate parallel PDF conversion by enqueueing per-page jobs to RQ workers.
    Returns immediately after enqueueing jobs.
    """
    logger.info(f"Starting parallel PDF conversion: {pdf_file_upload.file_name}")

    if hasattr(settings, 'AWS_S3_ENDPOINT_URL') and settings.AWS_S3_ENDPOINT_URL:
        pdf_file_upload.file.seek(0)
        pdf_content = pdf_file_upload.file.read()
        pdf_document = fitz.open(stream=pdf_content, filetype="pdf")
    else:
        pdf_document = fitz.open(pdf_file_upload.file.path)

    total_pages = pdf_document.page_count
    pdf_document.close()

    logger.info(f"PDF has {total_pages} pages, splitting across RQ workers")

    jobs = []
    for page_num in range(total_pages):
        job = start_job_async_or_sync(
            render_pdf_page_job,
            pdf_file_upload.id,
            page_num,
            total_pages,
            queue_name='high',
            job_timeout=300,
            coordination_key=f"pdf:{pdf_file_upload.id}"
        )
        jobs.append(job)

    logger.info(f"Enqueued {len(jobs)} page rendering jobs to high queue")

    return []


def extract_characters_from_image_content(image_content: bytes, page_number: int = 1) -> List[Dict]:
    """Extract characters from image content using EasyOCR"""
    if not EASYOCR_AVAILABLE:
        logger.warning("EasyOCR not available, skipping character extraction")
        return []
    
    logger.info(f"Extracting characters from image content, page {page_number}")

    try:

        image = Image.open(io.BytesIO(image_content))
        image_width, image_height = image.size

        reader = get_easyocr_reader()
        if reader is None:
            logger.error("Failed to get EasyOCR reader")
            return []

        image_array = np.array(image)
        results = reader.readtext(image_array)

        logger.info(f"Found {len(results)} text regions")
        
        characters = []
        for bbox, text, confidence in results:
            x_coords = [point[0] for point in bbox]
            y_coords = [point[1] for point in bbox]
            
            x_min = min(x_coords)
            x_max = max(x_coords)
            y_min = min(y_coords)
            y_max = max(y_coords)
            
            region_width = x_max - x_min
            region_height = y_max - y_min
            
            if len(text) > 0:
                char_width = region_width / len(text)
                
                for i, char in enumerate(text):
                    if char.strip():
                        char_x = x_min + (i * char_width)
                        
                        norm_x = char_x / image_width
                        norm_y = y_min / image_height
                        norm_width = char_width / image_width
                        norm_height = region_height / image_height
                        
                        characters.append({
                            'character': char,
                            'confidence': confidence,
                            'x': norm_x,
                            'y': norm_y,
                            'width': norm_width,
                            'height': norm_height,
                            'image_width': image_width,
                            'image_height': image_height,
                            'page_number': page_number
                        })
        
        logger.info(f"Extracted {len(characters)} characters")
        return characters
        
    except Exception as e:
        logger.error(f"Error extracting characters: {e}")
        return []

def save_ocr_extractions_for_task(task, file_upload: FileUpload, characters: List[Dict]):
    """Save OCR character extractions to database"""

    if not characters:
        return
    
    logger.info(f"Saving {len(characters)} characters for task {task.id}")
    
    with transaction.atomic():
        OCRCharacterExtraction.objects.filter(
            task=task,
            page_number=characters[0]['page_number'] if characters else 1
        ).delete()
        
        extractions = []
        for char_data in characters:
            extraction = OCRCharacterExtraction(
                task=task,
                character=char_data['character'],
                confidence=char_data['confidence'],
                x=char_data['x'],
                y=char_data['y'],
                width=char_data['width'],
                height=char_data['height'],
                image_width=char_data['image_width'],
                image_height=char_data['image_height'],
                page_number=char_data['page_number']
            )
            extractions.append(extraction)
        
        OCRCharacterExtraction.objects.bulk_create(extractions)
        
        if not task.meta:
            task.meta = {}
        
        total_chars = OCRCharacterExtraction.objects.filter(task=task).count()
        chinese_chars = sum(1 for c in characters if '\u4e00' <= c['character'] <= '\u9fff')
        
        task.meta['ocr_summary'] = {
            'total_characters': total_chars,
            'chinese_characters': chinese_chars,
            'pages_processed': char_data['page_number'] if characters else 0,
            'has_extractions': True
        }
        
        task.meta['ocr_status'] = 'completed'
        task.meta['ocr_completed_at'] = now().isoformat()
        task.save(update_fields=['meta'])
        
        logger.info(f"Saved OCR summary to task meta: {task.meta['ocr_summary']}")


def _ensure_image_relationship_exists(file_upload: FileUpload) -> bool:
    """
    Ensure PDFImageRelationship exists for standalone images

    Args:
        file_upload: FileUpload instance

    Returns:
        True if relationship was created/exists for standalone image, False otherwise
    """
    if not file_upload.file_name.lower().endswith(SUPPORTED_IMAGE_EXTENSIONS):
        return False

    PDFImageRelationship.objects.get_or_create(
        pdf_file=file_upload,
        image_file=file_upload,
        page_number=1,
        defaults={
            'image_format': file_upload.format.lstrip('.'),
            'resolution_dpi': DEFAULT_OCR_DPI
        }
    )
    logger.info(f"Ensured relationship exists for standalone image: {file_upload.file_name}")
    return True


def _set_task_pages(task: Task, relationships) -> None:
    """
    Set task.data['pages'] from PDFImageRelationship queryset

    Args:
        task: Task instance
        relationships: QuerySet of PDFImageRelationship
    """
    page_urls = [rel.image_file.url for rel in relationships]

    if not task.data:
        task.data = {}
    task.data['pages'] = page_urls
    task.save(update_fields=['data'])
    logger.info(f"Task {task.id}: Set pages field with {len(page_urls)} URLs")


def _extract_ocr_for_page(task: Task, image_upload: FileUpload, page_number: int) -> bool:
    """
    Extract and save OCR characters for a single page/image

    Args:
        task: Task instance
        image_upload: FileUpload instance for the image
        page_number: Page number (1-indexed)

    Returns:
        True if characters were extracted and saved, False otherwise
    """
    try:
        image_upload.file.seek(0)
        image_content = image_upload.file.read()
        characters = extract_characters_from_image_content(image_content, page_number)
    except Exception as e:
        logger.error(f"Failed to read image from storage for page {page_number}: {e}")
        return False

    if characters:
        save_ocr_extractions_for_task(task, image_upload, characters)
        logger.info(f"Task {task.id}: Extracted {len(characters)} chars from page {page_number}")
        return True

    return False


def extract_ocr_for_page_job(task_id, image_file_id, page_number, **kwargs):
    """
    Background job to extract OCR for a single page.
    Called by RQ workers in parallel.

    Args:
        task_id: Task ID
        image_file_id: FileUpload ID for the image
        page_number: Page number (1-indexed)

    Returns:
        Dict with success status and metadata
    """
    from tasks.models import Task

    try:
        task = Task.objects.get(id=task_id)
        image_upload = FileUpload.objects.get(id=image_file_id)

        logger.info(f"OCR job for task {task_id}, page {page_number}")

        success = _extract_ocr_for_page(task, image_upload, page_number)

        return {
            'task_id': task_id,
            'page_number': page_number,
            'image_file_id': image_file_id,
            'success': success
        }
    except Exception as e:
        logger.error(f"Failed to extract OCR for task {task_id} page {page_number}: {e}", exc_info=True)
        return {
            'task_id': task_id,
            'page_number': page_number,
            'success': False,
            'error': str(e)
        }


def process_ocr_for_task_parallel(task: Task, relationships) -> None:
    """
    Coordinate parallel OCR extraction by enqueueing per-page jobs to RQ workers.

    Args:
        task: Task instance
        relationships: QuerySet of PDFImageRelationship
    """
    from core.redis import start_job_async_or_sync

    page_count = relationships.count()
    logger.info(f"Task {task.id}: Enqueueing {page_count} parallel OCR jobs")

    for relationship in relationships:
        start_job_async_or_sync(
            extract_ocr_for_page_job,
            task.id,
            relationship.image_file.id,
            relationship.page_number,
            queue_name='high',
            job_timeout=300
        )

    logger.info(f"Task {task.id}: Enqueued {page_count} OCR extraction jobs")


def _process_task_relationships(task: Task, relationships) -> None:
    """
    Process all page relationships for a task and extract OCR

    Args:
        task: Task instance
        relationships: QuerySet of PDFImageRelationship
    """
    logger.info(f"Task {task.id} processing {relationships.count()} pages")

    for relationship in relationships:
        _extract_ocr_for_page(task, relationship.image_file, relationship.page_number)


def process_ocr_for_tasks_background(task_ids):
    """
    Background job to process OCR for tasks by their IDs
    """
    if not task_ids:
        return 0
    
    logger.info(f"Background OCR processing for {len(task_ids)} task IDs")
    
    tasks = Task.objects.filter(id__in=task_ids)
    return process_ocr_for_tasks_after_import(tasks)


def process_ocr_for_tasks_after_import(tasks) -> int:
    """
    Process OCR extraction for tasks that have converted PDF images
    Called AFTER tasks are created during import
    
    Args:
        tasks: List of Task instances that were just created
        
    Returns:
        Number of tasks processed for OCR
    """
    if not tasks:
        return 0
    
    logger.info(f"Processing OCR for {len(tasks)} newly created tasks")
    
    ocr_processed_count = 0

    for task in tasks:
        try:
            if not task.file_upload:
                continue
            
            file_upload = task.file_upload

            _ensure_image_relationship_exists(file_upload)

            relationships = PDFImageRelationship.objects.filter(
                pdf_file=file_upload
            ).order_by('page_number')

            if relationships.exists():
                _set_task_pages(task, relationships)
                process_ocr_for_task_parallel(task, relationships)
                ocr_processed_count += 1
            
        except Exception as e:
            logger.error(f"OCR processing failed for task {task.id}: {e}")
            
            try:
                task.refresh_from_db()
                if not task.meta:
                    task.meta = {}
                task.meta['ocr_status'] = 'failed'
                task.meta['ocr_failed_at'] = now().isoformat()
                task.meta['ocr_error'] = str(e)
                task.save(update_fields=['meta'])
            except Exception as save_error:
                logger.error(f"Failed to update task {task.id} OCR status to failed: {save_error}")
    
    logger.info(f"OCR processing completed: {ocr_processed_count}/{len(tasks)} tasks processed")
    return ocr_processed_count


def process_pdf_if_needed(file_upload: FileUpload) -> bool:
    """
    Check if file is PDF and process it
    
    Args:
        file_upload: FileUpload instance that was just created
        
    Returns:
        True if PDF was processed, False otherwise
    """
    if not file_upload.file_name.lower().endswith('.pdf'):
        logger.debug(f"File {file_upload.file_name} is not a PDF, skipping conversion")
        return False
    
    logger.info(f"Detected PDF file: {file_upload.file_name}, starting parallel conversion")

    try:
        convert_pdf_to_images_parallel(file_upload)
        logger.info(f"PDF conversion jobs enqueued successfully")
        return True
    except Exception as e:
        logger.error(f"Failed to convert PDF: {str(e)}")
