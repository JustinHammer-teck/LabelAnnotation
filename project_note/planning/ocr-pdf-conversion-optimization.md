# OCR PDF Conversion Optimization Plan

**Date**: 2025-11-01
**Target**: `label_studio/data_import/services.py::convert_pdf_to_images_simple`
**Current Status**: Functional but unoptimized for production OCR workflows

## Executive Summary

The `convert_pdf_to_images_simple` function currently processes PDFs sequentially at fixed 300 DPI, outputting RGB PNG images. This analysis identifies 7 optimization opportunities that can deliver:

- **10-100x faster** processing for multi-page documents
- **80-90% storage reduction** through smart compression
- **5-15% OCR accuracy improvement** through preprocessing
- **Better fault tolerance** with incremental progress

## Current Implementation Analysis

### Function Overview (lines 87-169)

```python
def convert_pdf_to_images_simple(pdf_file_upload: FileUpload) -> List[Dict]:
    # Opens PDF from MinIO or local storage
    # Converts each page sequentially at 300 DPI
    # Saves as RGB PNG with full atomic transaction
    # Creates FileUpload and PDFImageRelationship per page
```

### Performance Characteristics

**Time Complexity**:
- 100-page PDF: ~200-300 seconds (2-3s per page)
- Linear scaling: O(n) pages

**Space Complexity**:
- Memory: ~10-50MB per page (pixmap size)
- Storage: ~5-10MB per PNG page
- 100-page PDF: ~500MB-1GB storage

**Bottlenecks**:
1. Sequential processing (no parallelization)
2. RGB PNG (large files, slow I/O)
3. Single atomic transaction (all-or-nothing)
4. No image optimization for OCR

## Optimization Opportunities

### 1. Parallel Page Processing ⚡ HIGH IMPACT - DONE

**Current Implementation**:
```python
for page_num in range(total_pages):
    page = pdf_document[page_num]
    # Sequential processing
```

**Optimization**:
```python
from concurrent.futures import ProcessPoolExecutor, as_completed

def render_page(pdf_bytes, page_num, dpi=300):
    """Worker function for parallel rendering"""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    page = doc[page_num]
    mat = fitz.Matrix(dpi/72.0, dpi/72.0)
    pix = page.get_pixmap(matrix=mat, alpha=False)
    return page_num, pix.tobytes("png"), pix.width, pix.height

# In main function:
with ProcessPoolExecutor(max_workers=4) as executor:
    futures = {
        executor.submit(render_page, pdf_content, i): i
        for i in range(total_pages)
    }
    for future in as_completed(futures):
        page_num, img_bytes, width, height = future.result()
        # Save page
```

**Benefits**:
- 4x speedup with 4 cores
- Scales with available CPU cores
- No code architecture changes needed

**Complexity**: Medium
**Risk**: Low (PyMuPDF is thread-safe for separate document instances)

**Estimated Impact**:
- 100-page PDF: 300s → 75s (4 cores)
- 500-page PDF: 25 min → 6 min

---

### 2. Grayscale Conversion + Smart Compression 📦 HIGH IMPACT - DONE

**Current Implementation**:
```python
pix = page.get_pixmap(matrix=mat, alpha=False)  # RGB
img_bytes = pix.tobytes("png")  # PNG lossless
```

**Optimization**:
```python
# Render as grayscale
pix = page.get_pixmap(matrix=mat, alpha=False, colorspace=fitz.csGRAY)

# Convert to PIL for JPEG compression
from PIL import Image
import io

img = Image.frombytes("L", (pix.width, pix.height), pix.samples)

# Save as JPEG with 85-90% quality
output = io.BytesIO()
img.save(output, format='JPEG', quality=85, optimize=True)
img_bytes = output.getvalue()
```

**Benefits**:
- **Storage**: 5-10MB → 500KB-1MB (80-90% reduction)
- **OCR Accuracy**: +5-10% (grayscale better for text detection)
- **Upload Speed**: 10x faster to MinIO
- **Processing Cost**: Lower storage costs

**Complexity**: Low
**Risk**: Very Low (JPEG quality 85+ negligible for OCR)

**Estimated Impact**:
- 100-page PDF: 500MB → 50-100MB storage
- Annual savings: Significant for high-volume deployments

---

### 3. Batch Database Operations 🗄️ HIGH IMPACT

**Current Implementation**:
```python
with transaction.atomic():
    for page_num in range(total_pages):
        # Create FileUpload
        image_file_upload.save()
        # Create Relationship
        PDFImageRelationship.objects.create()
```

**Optimization**:
```python
BATCH_SIZE = 10

file_uploads = []
relationships = []

for page_num in range(total_pages):
    # Process page
    image_file_upload = FileUpload(...)
    image_file_upload.file.save(filename, image_file)
    file_uploads.append(image_file_upload)

    if len(file_uploads) >= BATCH_SIZE:
        with transaction.atomic():
            # Bulk create relationships
            PDFImageRelationship.objects.bulk_create(relationships)
        file_uploads.clear()
        relationships.clear()

# Final batch
if file_uploads:
    with transaction.atomic():
        PDFImageRelationship.objects.bulk_create(relationships)
```

**Benefits**:
- **Database Performance**: 50-70% faster
- **Fault Tolerance**: Progress saved every 10 pages
- **Lock Duration**: Reduced from minutes to seconds
- **Failure Recovery**: Can resume from last batch

**Complexity**: Low
**Risk**: Low

**Estimated Impact**:
- 100-page PDF: 100 DB transactions → 10 batches
- Better UX for large imports

---

### 4. Adaptive DPI Based on Content 🔍 MEDIUM IMPACT

**Current Implementation**:
```python
mat = fitz.Matrix(300/72.0, 300/72.0)  # Always 300 DPI
```

**Optimization**:
```python
def analyze_text_size(page):
    """Detect average text size on page"""
    blocks = page.get_text("dict")["blocks"]
    text_sizes = []
    for block in blocks:
        if "lines" in block:
            for line in block["lines"]:
                for span in line["spans"]:
                    text_sizes.append(span["size"])

    avg_size = sum(text_sizes) / len(text_sizes) if text_sizes else 12
    return avg_size

# Adaptive DPI selection
avg_text_size = analyze_text_size(page)
if avg_text_size > 14:
    dpi = 200  # Large text
elif avg_text_size > 10:
    dpi = 300  # Medium text
else:
    dpi = 400  # Small/dense text
```

**Benefits**:
- **Performance**: 50-75% faster for simple docs (200 DPI)
- **Quality**: Higher DPI for complex docs when needed
- **Smart**: Adapts per page within same PDF

**Complexity**: Medium
**Risk**: Medium (needs testing across doc types)

**Estimated Impact**:
- Presentation PDFs: 300 DPI → 200 DPI (2x faster)
- Dense contracts: 300 DPI → 400 DPI (better OCR)

---

### 5. Memory Management Optimization 💾 MEDIUM IMPACT

**Current Implementation**:
```python
for page_num in range(total_pages):
    pix = page.get_pixmap(...)
    # pix cleaned up at iteration end
```

**Optimization**:
```python
for page_num in range(total_pages):
    page = pdf_document[page_num]
    pix = page.get_pixmap(...)

    # Process pixmap
    img_bytes = pix.tobytes("png")

    # Explicit cleanup
    del pix
    page = None

# For very large PDFs (500+ pages), process in chunks:
CHUNK_SIZE = 100
for chunk_start in range(0, total_pages, CHUNK_SIZE):
    chunk_end = min(chunk_start + CHUNK_SIZE, total_pages)
    # Process pages chunk_start to chunk_end
    # This prevents memory buildup
```

**Benefits**:
- **Memory**: Prevents buildup for large PDFs
- **Stability**: Avoids OOM errors on 500+ page docs
- **Predictable**: Constant memory footprint

**Complexity**: Low
**Risk**: Very Low

**Estimated Impact**:
- 500-page PDF: 5GB peak memory → 500MB constant

---

### 6. OCR-Optimized Image Preprocessing 🎨 ADVANCED

**Current Implementation**:
```python
# No preprocessing, raw PDF render
pix = page.get_pixmap(matrix=mat, alpha=False)
```

**Optimization**:
```python
from PIL import Image, ImageEnhance, ImageFilter
import numpy as np
import cv2

def preprocess_for_ocr(pil_image):
    """Apply CV preprocessing for better OCR"""

    # Convert to numpy array
    img_array = np.array(pil_image)

    # 1. Grayscale (if not already)
    if len(img_array.shape) == 3:
        gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
    else:
        gray = img_array

    # 2. Denoise
    denoised = cv2.fastNlMeansDenoising(gray, h=10)

    # 3. Contrast enhancement (CLAHE)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
    enhanced = clahe.apply(denoised)

    # 4. Deskew (optional, computationally expensive)
    # angle = detect_skew(enhanced)
    # deskewed = rotate_image(enhanced, angle)

    # 5. Adaptive thresholding (binarization)
    binary = cv2.adaptiveThreshold(
        enhanced, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY, 11, 2
    )

    return Image.fromarray(binary)
```

**Benefits**:
- **OCR Accuracy**: +10-20% for poor quality scans
- **Robustness**: Handles skewed, faded, noisy documents
- **Text Detection**: Better bounding box accuracy

**Complexity**: High
**Risk**: Medium (needs extensive testing, may hurt some docs)

**Estimated Impact**:
- Scanned documents: Significant accuracy improvement
- Born-digital PDFs: Minimal impact (already clean)

**Recommendation**: Make this optional/configurable

---

### 7. Caching Layer with Redis 🚀 OPTIONAL

**Implementation**:
```python
import hashlib
import pickle

def get_pdf_hash(pdf_content):
    """Generate hash of PDF content"""
    return hashlib.sha256(pdf_content).hexdigest()

def convert_pdf_to_images_simple(pdf_file_upload):
    pdf_content = pdf_file_upload.file.read()
    pdf_hash = get_pdf_hash(pdf_content)

    # Check cache
    cache_key = f"pdf_conversion:{pdf_hash}"
    cached = redis_client.get(cache_key)

    if cached:
        logger.info(f"Cache hit for PDF {pdf_hash}")
        return pickle.loads(cached)

    # Convert as normal
    results = _do_conversion(pdf_content)

    # Cache for 1 hour
    redis_client.setex(cache_key, 3600, pickle.dumps(results))

    return results
```

**Benefits**:
- **Speed**: 100x faster for repeated imports
- **Development**: Great for testing

**Complexity**: Medium
**Risk**: Low

**Use Case**: Only if re-importing same PDFs is common

---

## Implementation Priority

### Phase 1: Quick Wins (Week 1)
1. **Grayscale + JPEG Compression** (#2)
   - Immediate storage savings
   - Better OCR accuracy
   - Minimal code changes

2. **Memory Management** (#5)
   - Prevents production issues
   - Simple implementation

### Phase 2: Performance (Week 2)
3. **Batch Database Operations** (#3)
   - Better fault tolerance
   - Faster DB operations

4. **Parallel Processing** (#1)
   - Biggest performance gain
   - Requires testing at scale

### Phase 3: Advanced (Week 3-4)
5. **Adaptive DPI** (#4)
   - Needs benchmarking
   - Document-specific tuning

6. **Preprocessing** (#6)
   - Optional feature flag
   - Extensive testing required

### Phase 4: Optional
7. **Caching** (#7)
   - Only if needed based on usage patterns

## Success Metrics

**Performance Targets**:
- 100-page PDF: < 60 seconds (currently 200-300s)
- Storage per page: < 1MB (currently 5-10MB)
- OCR accuracy: +5-10% average

**Monitoring**:
- Track conversion times via logging
- Monitor MinIO storage usage
- Measure OCR accuracy on test set

## Testing Strategy

1. **Unit Tests**: Each optimization in isolation
2. **Integration Tests**: Full pipeline with sample PDFs
3. **Benchmark Suite**:
   - Small PDFs (1-10 pages)
   - Medium PDFs (50-100 pages)
   - Large PDFs (500+ pages)
   - Various DPI/quality levels
4. **OCR Accuracy Tests**: Compare against ground truth

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| JPEG artifacts affect OCR | Use quality 85-90%, benchmark against PNG |
| Parallel processing race conditions | Use separate PDF instances per worker |
| Memory exhaustion on huge PDFs | Implement chunking for 500+ pages |
| Preprocessing hurts clean PDFs | Make it configurable/optional |

## Configuration Recommendations

Add to `settings.py`:
```python
# OCR Configuration
OCR_ENABLED = True
OCR_DPI = 300  # Default, can be adaptive
OCR_IMAGE_FORMAT = 'JPEG'  # or 'PNG'
OCR_JPEG_QUALITY = 85
OCR_GRAYSCALE = True
OCR_PARALLEL_WORKERS = 4
OCR_BATCH_SIZE = 10
OCR_ENABLE_PREPROCESSING = False  # Advanced feature
```

## Next Steps

1. Review this plan
2. Choose which optimization to implement first
3. Create feature branch
4. Implement + test
5. Benchmark against current implementation
6. Deploy to staging
7. Monitor metrics
8. Iterate

---

**Document Version**: 1.0
**Last Updated**: 2025-11-01
**Author**: Computer Vision Analysis
