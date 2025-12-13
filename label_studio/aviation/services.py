import logging
import zipfile
from datetime import datetime
from contextlib import contextmanager
from django.db import transaction
from openpyxl import load_workbook
from openpyxl.utils.exceptions import InvalidFileException
from rest_framework.exceptions import ValidationError
from core.redis import start_job_async_or_sync

logger = logging.getLogger(__name__)


class ExcelParserService:
    """Parse aviation incident Excel files"""

    REQUIRED_COLUMNS = ['Event Number', 'Event Description', 'Date']
    OPTIONAL_COLUMNS = ['Time', 'Location', 'Airport', 'Flight Phase', 'Aircraft Type', 'Event Labels']
    ASYNC_THRESHOLD = 100
    MAX_FILE_SIZE = 50 * 1024 * 1024
    MAX_UNCOMPRESSED_SIZE = 200 * 1024 * 1024

    COLUMN_ALIASES = {
        '编号 ID': 'Event Number',
        '事件描述 description': 'Event Description',
        '日期 Date': 'Date',
        '时间 time': 'Time',
        '地点 location': 'Location',
        '机场 airport': 'Airport',
        '飞行阶段 phase': 'Flight Phase',
        '机型 aircraft': 'Aircraft Type',
        '事件标签 labels': 'Event Labels',
    }

    def parse_incidents_async(self, file_upload_id, project_id):
        """Enqueue async job for large Excel files"""
        start_job_async_or_sync(
            parse_excel_background,
            file_upload_id,
            project_id,
            queue_name='default',
            job_timeout=3600,
            use_on_commit=True,
            on_failure=excel_parse_failure_handler
        )

    @contextmanager
    def _open_workbook(self, file, **kwargs):
        """Context manager for safe workbook handling"""
        wb = None
        try:
            wb = load_workbook(file, **kwargs)
            yield wb
        finally:
            if wb:
                try:
                    wb.close()
                except Exception as e:
                    logger.warning(f'Failed to close workbook: {e}')

    def _validate_file_safety(self, file):
        """Validate file size and check for zip bombs"""
        if hasattr(file, 'size'):
            if file.size == 0:
                raise ValidationError('File is empty')
            if file.size > self.MAX_FILE_SIZE:
                raise ValidationError(f'File size exceeds {self.MAX_FILE_SIZE / (1024*1024):.0f}MB limit')

        try:
            file.seek(0)
            with zipfile.ZipFile(file, 'r') as zf:
                compressed_size = sum(info.compress_size for info in zf.infolist())
                uncompressed_size = sum(info.file_size for info in zf.infolist())

                if uncompressed_size > self.MAX_UNCOMPRESSED_SIZE:
                    raise ValidationError('Excel file too large when decompressed')

                if compressed_size > 0 and uncompressed_size / compressed_size > 100:
                    raise ValidationError('Suspicious compression ratio detected')

            file.seek(0)
        except zipfile.BadZipFile:
            raise ValidationError('Invalid Excel file format')

    def _check_duplicate_event_number(self, event_number, project):
        """Check if event number already exists in project"""
        from .models import AviationIncident

        return AviationIncident.objects.filter(
            event_number=event_number,
            task__project=project
        ).exists()

    def parse_incidents(self, file, project, check_size=True):
        """Parse Excel synchronously and create tasks with partial success support"""
        from tasks.models import Task
        from .models import AviationIncident

        if check_size:
            self._validate_file_safety(file)

        created = 0
        skipped = 0
        errors = []
        total_rows = 0

        try:
            with self._open_workbook(file, read_only=True, data_only=True) as wb:
                ws = wb.active

                if ws.max_row < 2:
                    raise ValidationError('Excel file contains no data rows')

                header_row = [cell.value for cell in ws[1]]
                if not header_row or all(cell is None for cell in header_row):
                    raise ValidationError('Excel file has no valid headers')

                normalized_headers = self._normalize_headers(header_row)
                self._validate_headers(normalized_headers)

                column_map = {col: idx for idx, col in enumerate(normalized_headers) if col}

                with transaction.atomic():
                    for row_idx, row in enumerate(ws.iter_rows(min_row=2, values_only=True), start=2):
                        if not row or all(cell is None or cell == '' for cell in row):
                            continue

                        total_rows += 1

                        try:
                            incident_data = self._extract_row_data(row, column_map, row_idx)

                            if self._check_duplicate_event_number(
                                incident_data['event_number'],
                                project
                            ):
                                skipped += 1
                                continue

                            task = Task.objects.create(
                                project=project,
                                data={
                                    'text': incident_data['event_description'],
                                    'event_number': incident_data['event_number'],
                                    'event_date': str(incident_data['date']),
                                    'event_location': incident_data.get('location', ''),
                                    'airport_name': incident_data.get('airport', ''),
                                    'flight_phase': incident_data.get('flight_phase', ''),
                                    'aircraft_type': incident_data.get('aircraft_type', ''),
                                    'event_labels': incident_data.get('event_labels', ''),
                                    'event_description': incident_data['event_description'],
                                }
                            )

                            AviationIncident.objects.create(
                                task=task,
                                event_number=incident_data['event_number'],
                                event_description=incident_data['event_description'],
                                date=incident_data['date'],
                                time=incident_data.get('time'),
                                location=incident_data.get('location', ''),
                                airport=incident_data.get('airport', ''),
                                flight_phase=incident_data.get('flight_phase', '')
                            )

                            created += 1

                        except ValidationError as e:
                            error_message = str(e.detail[0]) if hasattr(e, 'detail') and e.detail else str(e)
                            errors.append({'row': row_idx, 'error': error_message})
                        except Exception as e:
                            logger.error(f"Error parsing row {row_idx}: {str(e)}", exc_info=True)
                            errors.append({'row': row_idx, 'error': str(e)})

            logger.info(f"Parsed Excel: created={created}, skipped={skipped}, errors={len(errors)}, total={total_rows}")

            return {
                'created': created,
                'skipped': skipped,
                'errors': errors,
                'total_rows': total_rows,
                'project_id': project.id
            }

        except ValidationError:
            raise
        except InvalidFileException as e:
            logger.error(f"Invalid Excel file format: {str(e)}")
            raise ValidationError('Invalid Excel file format')
        except PermissionError as e:
            logger.error(f"Permission denied accessing file: {str(e)}")
            raise ValidationError('Unable to read file')
        except Exception as e:
            logger.exception(f"Unexpected error parsing Excel file")
            raise ValidationError('Failed to parse Excel file')

    def validate_structure(self, file):
        """Validate Excel format compliance"""
        try:
            self._validate_file_safety(file)

            with self._open_workbook(file, read_only=True, data_only=True) as wb:
                ws = wb.active

                if ws.max_row < 2:
                    return {
                        'valid': False,
                        'error': 'NO_DATA',
                        'message': 'Excel file contains no data rows'
                    }

                header_row = [cell.value for cell in ws[1]]
                if not header_row or all(cell is None for cell in header_row):
                    return {
                        'valid': False,
                        'error': 'NO_HEADERS',
                        'message': 'Excel file has no valid headers'
                    }

                normalized_headers = self._normalize_headers(header_row)
                self._validate_headers(normalized_headers)

                row_count = ws.max_row - 1

                return {
                    'valid': True,
                    'headers': normalized_headers,
                    'row_count': row_count,
                    'message': f'Excel file is valid with approximately {row_count} data rows'
                }

        except ValidationError as e:
            logger.warning(f"Excel validation failed: {str(e)}")
            return {
                'valid': False,
                'error': 'VALIDATION_ERROR',
                'message': str(e)
            }
        except InvalidFileException as e:
            logger.warning(f"Invalid Excel file format: {str(e)}")
            return {
                'valid': False,
                'error': 'INVALID_FORMAT',
                'message': 'File is not a valid Excel format'
            }
        except Exception as e:
            logger.exception("Unexpected error during Excel validation")
            return {
                'valid': False,
                'error': 'SYSTEM_ERROR',
                'message': 'Failed to read Excel file'
            }

    def _normalize_headers(self, header_row):
        """Normalize bilingual headers to internal English names"""
        normalized = []
        for header in header_row:
            if header is None:
                normalized.append(None)
            elif header in self.COLUMN_ALIASES:
                normalized.append(self.COLUMN_ALIASES[header])
            else:
                normalized.append(header)
        return normalized

    def _validate_headers(self, header_row):
        """Validate required columns exist"""
        missing_columns = [col for col in self.REQUIRED_COLUMNS if col not in header_row]
        if missing_columns:
            raise ValidationError(
                f"Missing required columns: {', '.join(missing_columns)}"
            )

    def _extract_row_data(self, row, column_map, row_idx=None):
        """Extract data from row based on column mapping"""
        data = {}

        for col_name, col_idx in column_map.items():
            value = row[col_idx] if col_idx < len(row) else None

            if col_name == 'Event Number':
                data['event_number'] = str(value).strip() if value else ''
            elif col_name == 'Event Description':
                data['event_description'] = str(value).strip() if value else ''
            elif col_name == 'Date':
                data['date'] = self._parse_date(value)
            elif col_name == 'Time':
                data['time'] = self._parse_time(value)
            elif col_name == 'Location':
                data['location'] = str(value).strip() if value else ''
            elif col_name == 'Airport':
                data['airport'] = str(value).strip() if value else ''
            elif col_name == 'Flight Phase':
                data['flight_phase'] = str(value).strip() if value else ''
            elif col_name == 'Aircraft Type':
                data['aircraft_type'] = str(value).strip() if value else ''
            elif col_name == 'Event Labels':
                data['event_labels'] = str(value).strip() if value else ''

        if not data.get('event_number'):
            raise ValidationError("Event Number is required")
        if len(data['event_number']) > 50:
            raise ValidationError("Event Number exceeds 50 character limit")
        if not data.get('event_description'):
            raise ValidationError("Event Description is required")
        if not data.get('date'):
            raise ValidationError("Date is required")

        return data

    def _parse_date(self, value):
        """Parse date from various formats"""
        if value is None or value == '':
            return None
        if isinstance(value, datetime):
            return value.date()
        if isinstance(value, (int, float)):
            try:
                from openpyxl.utils.datetime import from_excel
                return from_excel(value).date()
            except (ValueError, OverflowError):
                raise ValidationError(f"Invalid date serial: {value}")
        if isinstance(value, str):
            value = value.strip()
            for fmt in ['%Y-%m-%d', '%m/%d/%Y', '%d/%m/%Y', '%Y/%m/%d']:
                try:
                    return datetime.strptime(value, fmt).date()
                except ValueError:
                    continue
            raise ValidationError(f"Invalid date format: {value}")
        raise ValidationError("Date must be a date, number, or string")

    def _parse_time(self, value):
        """Parse time from various formats"""
        if value is None or value == '':
            return None
        if isinstance(value, datetime):
            return value.time()
        if isinstance(value, str):
            value = value.strip()
            for fmt in ['%H:%M:%S', '%H:%M', '%I:%M %p']:
                try:
                    return datetime.strptime(value, fmt).time()
                except ValueError:
                    continue
            logger.warning(f"Could not parse time value: {value}")
        return None


class TrainingCalculationService:
    """Calculate training recommendations based on selections"""

    def calculate_and_update(self, instance):
        """Auto-calculate training topics and update instance"""
        from .models import AviationAnnotation

        if not instance or not instance.pk:
            logger.warning('Cannot calculate training for unsaved instance')
            return

        if not AviationAnnotation.objects.filter(pk=instance.pk).exists():
            logger.error(f'AviationAnnotation {instance.pk} does not exist')
            return

        topics = self.calculate_training_topics(instance)

        AviationAnnotation.objects.filter(pk=instance.pk).update(
            threat_training_topics=topics['threat_training_topics'],
            error_training_topics=topics['error_training_topics'],
            uas_training_topics=topics['uas_training_topics']
        )

    def calculate_training_topics(self, instance):
        """Calculate training topics for an annotation instance"""
        return {
            'threat_training_topics': self._get_training_for_selection(
                instance.threat_type_l3, 'threat'
            ) if instance.threat_type_l3 else [],
            'error_training_topics': self._get_training_for_selection(
                instance.error_type_l3, 'error'
            ) if instance.error_type_l3 else [],
            'uas_training_topics': self._get_training_for_selection(
                instance.uas_type_l3, 'uas'
            ) if instance.uas_type_l3 else [],
        }

    def _get_training_for_selection(self, label, category):
        """Get training topics for a specific selection"""
        from .models import AviationDropdownOption

        if not label or not isinstance(label, str):
            return []

        if len(label) > 200:
            logger.warning(f'Label exceeds max length: {label[:50]}...')
            return []

        valid_categories = ['threat', 'error', 'uas']
        if category not in valid_categories:
            logger.error(f'Invalid category: {category}')
            return []

        option = AviationDropdownOption.objects.filter(
            category=category,
            label=label,
            level=3,
            is_active=True
        ).first()

        if option and option.training_topics:
            return option.training_topics
        return []


def parse_excel_background(file_upload_id, project_id):
    """Background job to parse Excel file and create incidents"""
    from data_import.models import FileUpload
    from projects.models import Project

    try:
        file_upload = FileUpload.objects.get(id=file_upload_id)
        project = Project.objects.get(id=project_id)

        parser = ExcelParserService()
        with file_upload.file.open('rb') as f:
            result = parser.parse_incidents(f, project, check_size=False)

        logger.info(f"Background job completed: created={result['created']}, skipped={result['skipped']}, errors={len(result['errors'])} for project {project_id}")
        return result

    except FileUpload.DoesNotExist:
        logger.error(f"FileUpload {file_upload_id} not found")
        raise
    except Project.DoesNotExist:
        logger.error(f"Project {project_id} not found")
        raise
    except Exception as e:
        logger.exception(f"Background Excel parsing failed: {str(e)}")
        raise


def excel_parse_failure_handler(job, connection, exc_type, exc_value, traceback):
    """Handler for failed Excel parse jobs"""
    logger.error(f"Excel parse job {job.id} failed: {exc_type.__name__}: {exc_value}")

    if len(job.args) >= 2:
        file_upload_id = job.args[0]
        project_id = job.args[1]
        logger.error(f"Failed job was for file_upload={file_upload_id}, project={project_id}")


class TaskLockService:
    """Manage task locks for concurrent editing prevention"""

    LOCK_TIMEOUT = 300

    def __init__(self):
        from django.core.cache import cache
        self.cache = cache

    def _get_lock_key(self, task_id):
        return f"aviation_task_lock:{task_id}"

    def acquire_lock(self, task_id, user):
        """Acquire lock for a task using atomic cache operations"""
        from django.utils import timezone

        lock_key = self._get_lock_key(task_id)
        lock_data = {
            'user_id': user.id,
            'username': user.username,
            'acquired_at': timezone.now().isoformat()
        }

        success = self.cache.add(lock_key, lock_data, timeout=self.LOCK_TIMEOUT)
        if success:
            return {'success': True, 'lock': lock_data}

        current_lock = self.cache.get(lock_key)
        if current_lock and current_lock.get('user_id') == user.id:
            self.cache.set(lock_key, lock_data, timeout=self.LOCK_TIMEOUT)
            return {'success': True, 'lock': lock_data}

        if current_lock:
            return {
                'success': False,
                'error': 'LOCKED_BY_OTHER',
                'locked_by': current_lock['username'],
                'acquired_at': current_lock['acquired_at']
            }

        return {'success': False, 'error': 'LOCK_ACQUISITION_FAILED'}

    def release_lock(self, task_id, user):
        """Release lock for a task"""
        lock_key = self._get_lock_key(task_id)
        current_lock = self.cache.get(lock_key)

        if not current_lock:
            return {'success': True, 'message': 'No lock exists'}

        if current_lock['user_id'] != user.id:
            return {
                'success': False,
                'error': 'NOT_LOCK_OWNER',
                'message': 'Cannot release lock owned by another user'
            }

        self.cache.delete(lock_key)
        return {'success': True, 'message': 'Lock released'}

    def get_lock_status(self, task_id):
        """Get current lock status for a task"""
        lock_key = self._get_lock_key(task_id)
        current_lock = self.cache.get(lock_key)

        if current_lock:
            return {'locked': True, 'lock': current_lock}
        return {'locked': False}

    def force_release_lock(self, task_id):
        """Force release lock (admin only)"""
        lock_key = self._get_lock_key(task_id)
        self.cache.delete(lock_key)
        return {'success': True, 'message': 'Lock force released'}


class JsonExportService:
    """Generate JSON exports with annotations"""

    def export_annotations(self, project):
        """Export project annotations to JSON file, return temp file path."""
        import json
        import uuid
        import tempfile
        from django.utils import timezone
        from .models import AviationIncident, AviationAnnotation
        from .serializers import AviationIncidentSerializer, AviationAnnotationSerializer

        if not project:
            raise ValidationError('Project is required for export')

        if not hasattr(project, 'id'):
            raise ValidationError('Invalid project object')

        incidents = AviationIncident.objects.filter(
            task__project=project
        ).select_related('task').order_by('-date', '-created_at')

        annotations = AviationAnnotation.objects.filter(
            annotation__task__project=project
        ).select_related(
            'annotation__task__aviation_incident',
            'annotation__task'
        ).order_by('-created_at')

        incidents_data = AviationIncidentSerializer(incidents, many=True).data
        annotations_data = AviationAnnotationSerializer(annotations, many=True).data

        export_data = {
            'metadata': {
                'export_date': timezone.now().isoformat(),
                'project_id': project.id,
                'project_title': project.title,
                'total_incidents': len(incidents_data),
                'total_annotations': len(annotations_data),
            },
            'incidents': incidents_data,
            'annotations': annotations_data,
        }

        temp_file = tempfile.NamedTemporaryFile(
            delete=False,
            suffix='.json',
            mode='w',
            encoding='utf-8'
        )
        json.dump(export_data, temp_file, ensure_ascii=False, indent=2)
        temp_file.close()

        return temp_file.name

    def export_task(self, task):
        """Export single task's incident and annotation data to JSON file."""
        import json
        import tempfile
        from django.utils import timezone
        from .models import AviationIncident, AviationAnnotation
        from .serializers import AviationIncidentSerializer, AviationAnnotationSerializer

        if not task:
            raise ValidationError('Task is required for export')

        if not hasattr(task, 'id'):
            raise ValidationError('Invalid task object')

        incident = AviationIncident.objects.filter(task=task).first()
        annotations = AviationAnnotation.objects.filter(
            annotation__task=task
        ).select_related('annotation')

        incident_data = AviationIncidentSerializer(incident).data if incident else None
        annotations_data = AviationAnnotationSerializer(annotations, many=True).data

        export_data = {
            'metadata': {
                'export_date': timezone.now().isoformat(),
                'task_id': task.id,
            },
            'incident': incident_data,
            'annotations': annotations_data,
        }

        temp_file = tempfile.NamedTemporaryFile(
            delete=False,
            suffix='.json',
            mode='w',
            encoding='utf-8'
        )
        json.dump(export_data, temp_file, ensure_ascii=False, indent=2)
        temp_file.close()

        return temp_file.name

    def generate_template(self):
        """Generate empty JSON template."""
        import json
        import tempfile
        from django.utils import timezone

        template_data = {
            'metadata': {
                'export_date': timezone.now().isoformat(),
                'project_id': None,
                'project_title': None,
                'total_incidents': 0,
                'total_annotations': 0,
            },
            'incidents': [],
            'annotations': [],
        }

        temp_file = tempfile.NamedTemporaryFile(
            delete=False,
            suffix='.json',
            mode='w',
            encoding='utf-8'
        )
        json.dump(template_data, temp_file, ensure_ascii=False, indent=2)
        temp_file.close()

        return temp_file.name
