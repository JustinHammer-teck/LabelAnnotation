"""This file and its contents are licensed under the Apache License 2.0. Please see the included NOTICE for copyright information and LICENSE for a copy of the license.
"""
import json
import logging
import mimetypes
import time
from typing import TYPE_CHECKING
from urllib.parse import unquote, urlparse

import drf_yasg.openapi as openapi
from core.decorators import override_report_only_csp
from core.feature_flags import flag_set
from core.permissions import ViewClassPermission, all_permissions
from core.redis import start_job_async_or_sync
from core.utils.common import retry_database_locked, timeit
from core.utils.params import bool_from_request, list_of_strings_from_request
from csp.decorators import csp
from data_import.services import process_ocr_for_tasks_background, is_support_document
from django.conf import settings
from django.db import transaction
from django.db.models import QuerySet
from django.http import HttpResponse
from django.utils.decorators import method_decorator
from django.utils.timezone import now
from drf_yasg.utils import swagger_auto_schema
from projects.models import Project, ProjectImport, ProjectReimport
from ranged_fileresponse import RangedFileResponse
from rest_framework import generics, status
from rest_framework.exceptions import ValidationError
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.settings import api_settings
from rest_framework.views import APIView
from tasks.functions import update_tasks_counters
from tasks.models import Prediction, Task
from users.models import User
from webhooks.models import WebhookAction
from webhooks.utils import emit_webhooks_for_instance

from label_studio.core.utils.common import load_func

from .constants import ALLOWED_FILE_EXTENSIONS, VALID_ORDERINGS
from .functions import (
    async_import_background,
    async_reimport_background,
    reformat_predictions,
    set_import_background_failure,
    set_reimport_background_failure,
)
from .models import FileUpload, PDFImageRelationship
from .serializers import FileUploadSerializer, FileUploadListSerializer, ImportApiSerializer, PredictionSerializer
from .uploader import create_file_uploads, load_tasks

logger = logging.getLogger(__name__)

ProjectImportPermission = load_func(settings.PROJECT_IMPORT_PERMISSION)

task_create_response_scheme = {
    201: openapi.Response(
        description='Tasks successfully imported',
        schema=openapi.Schema(
            title='Task creation response',
            description='Task creation response',
            type=openapi.TYPE_OBJECT,
            properties={
                'task_count': openapi.Schema(
                    title='task_count', description='Number of tasks added', type=openapi.TYPE_INTEGER
                ),
                'annotation_count': openapi.Schema(
                    title='annotation_count', description='Number of annotations added', type=openapi.TYPE_INTEGER
                ),
                'predictions_count': openapi.Schema(
                    title='predictions_count', description='Number of predictions added', type=openapi.TYPE_INTEGER
                ),
                'duration': openapi.Schema(
                    title='duration', description='Time in seconds to create', type=openapi.TYPE_NUMBER
                ),
                'file_upload_ids': openapi.Schema(
                    title='file_upload_ids',
                    description='Database IDs of uploaded files',
                    type=openapi.TYPE_ARRAY,
                    items=openapi.Schema(title='File Upload IDs', type=openapi.TYPE_INTEGER),
                ),
                'could_be_tasks_list': openapi.Schema(
                    title='could_be_tasks_list',
                    description='Whether uploaded files can contain lists of tasks, like CSV/TSV files',
                    type=openapi.TYPE_BOOLEAN,
                ),
                'found_formats': openapi.Schema(
                    title='found_formats',
                    description='The list of found file formats',
                    type=openapi.TYPE_ARRAY,
                    items=openapi.Schema(title='File format', type=openapi.TYPE_STRING),
                ),
                'data_columns': openapi.Schema(
                    title='data_columns',
                    description='The list of found data columns',
                    type=openapi.TYPE_ARRAY,
                    items=openapi.Schema(title='Data column name', type=openapi.TYPE_STRING),
                ),
            },
        ),
    ),
    400: openapi.Schema(
        title='Incorrect task data', description='String with error description', type=openapi.TYPE_STRING
    ),
}


class FileUploadPagination(PageNumberPagination):
    """Pagination for file upload list with 30 items per page"""
    page_size = 30
    page_size_query_param = 'page_size'
    max_page_size = 100


@method_decorator(
    name='post',
    decorator=swagger_auto_schema(
        tags=['Import'],
        x_fern_sdk_group_name='projects',
        x_fern_sdk_method_name='import_tasks',
        x_fern_audiences=['public'],
        responses=task_create_response_scheme,
        manual_parameters=[
            openapi.Parameter(
                name='id',
                type=openapi.TYPE_INTEGER,
                in_=openapi.IN_PATH,
                description='A unique integer value identifying this project.',
            ),
            openapi.Parameter(
                name='commit_to_project',
                type=openapi.TYPE_BOOLEAN,
                in_=openapi.IN_QUERY,
                description='Set to "true" to immediately commit tasks to the project.',
                default=True,
                required=False,
            ),
            openapi.Parameter(
                name='return_task_ids',
                type=openapi.TYPE_BOOLEAN,
                in_=openapi.IN_QUERY,
                description='Set to "true" to return task IDs in the response.',
                default=False,
                required=False,
            ),
            openapi.Parameter(
                name='preannotated_from_fields',
                type=openapi.TYPE_ARRAY,
                items=openapi.Schema(type=openapi.TYPE_STRING),
                in_=openapi.IN_QUERY,
                description='List of fields to preannotate from the task data. For example, if you provide a list of'
                ' `{"text": "text", "prediction": "label"}` items in the request, the system will create '
                'a task with the `text` field and a prediction with the `label` field when '
                '`preannoted_from_fields=["prediction"]`.',
                default=None,
                required=False,
            ),
        ],
        operation_summary='Import tasks',
        operation_description="""
            Import data as labeling tasks in bulk using this API endpoint. You can use this API endpoint to import multiple tasks.
            One POST request is limited at 250K tasks and 200 MB.

            **Note:** Imported data is verified against a project *label_config* and must
            include all variables that were used in the *label_config*. For example,
            if the label configuration has a *$text* variable, then each item in a data object
            must include a "text" field.
            <br>

            ## POST requests
            <hr style="opacity:0.3">

            There are three possible ways to import tasks with this endpoint:

            ### 1\. **POST with data**
            Send JSON tasks as POST data. Only JSON is supported for POSTing files directly.
            Update this example to specify your authorization token and Label Studio instance host, then run the following from
            the command line.

            ```bash
            curl -H 'Content-Type: application/json' -H 'Authorization: Token abc123' \\
            -X POST '{host}/api/projects/1/import' --data '[{{"text": "Some text 1"}}, {{"text": "Some text 2"}}]'
            ```

            ### 2\. **POST with files**
            Send tasks as files. You can attach multiple files with different names.

            - **JSON**: text files in JavaScript object notation format
            - **CSV**: text files with tables in Comma Separated Values format
            - **TSV**: text files with tables in Tab Separated Value format
            - **TXT**: simple text files are similar to CSV with one column and no header, supported for projects with one source only

            Update this example to specify your authorization token, Label Studio instance host, and file name and path,
            then run the following from the command line:

            ```bash
            curl -H 'Authorization: Token abc123' \\
            -X POST '{host}/api/projects/1/import' -F 'file=@path/to/my_file.csv'
            ```

            ### 3\. **POST with URL**
            You can also provide a URL to a file with labeling tasks. Supported file formats are the same as in option 2.

            ```bash
            curl -H 'Content-Type: application/json' -H 'Authorization: Token abc123' \\
            -X POST '{host}/api/projects/1/import' \\
            --data '[{{"url": "http://example.com/test1.csv"}}, {{"url": "http://example.com/test2.csv"}}]'
            ```

            <br>
        """.format(
            host=(settings.HOSTNAME or 'https://localhost:8080')
        ),
        request_body=openapi.Schema(
            title='tasks',
            description='List of tasks to import',
            type=openapi.TYPE_ARRAY,
            items=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                # TODO: this example doesn't work - perhaps we need to migrate to drf-spectacular for "anyOf" support
                # also fern will change to at least provide a list of examples FER-1969
                # right now we can only rely on documenation examples
                # properties={
                #     'data': openapi.Schema(type=openapi.TYPE_OBJECT, description='Data of the task'),
                #     'annotations': openapi.Schema(
                #         type=openapi.TYPE_ARRAY,
                #         items=annotation_request_schema,
                #         description='Annotations for this task',
                #     ),
                #     'predictions': openapi.Schema(
                #         type=openapi.TYPE_ARRAY,
                #         items=prediction_request_schema,
                #         description='Predictions for this task',
                #     )
                # },
                # example={
                #     'data': {'image': 'http://example.com/image.jpg'},
                #     'annotations': [annotation_response_example],
                #     'predictions': [prediction_response_example]
                # }
            ),
        ),
    ),
)
# Import
class ImportAPI(generics.CreateAPIView):
    permission_required = all_permissions.projects_change
    permission_classes = api_settings.DEFAULT_PERMISSION_CLASSES + [ProjectImportPermission]
    parser_classes = (JSONParser, MultiPartParser, FormParser)
    serializer_class = ImportApiSerializer
    queryset = Task.objects.all()

    def get_serializer_context(self):
        project_id = self.kwargs.get('pk')
        if project_id:
            project = generics.get_object_or_404(Project.objects.for_user(self.request.user), pk=project_id)
        else:
            project = None
        return {'project': project, 'user': self.request.user}

    def post(self, *args, **kwargs):
        return super(ImportAPI, self).post(*args, **kwargs)

    def _save(self, tasks):
        serializer = self.get_serializer(data=tasks, many=True)
        serializer.is_valid(raise_exception=True)
        task_instances = serializer.save(project_id=self.kwargs['pk'])
        project = generics.get_object_or_404(Project.objects.for_user(self.request.user), pk=self.kwargs['pk'])
        emit_webhooks_for_instance(
            self.request.user.active_organization, project, WebhookAction.TASKS_CREATED, task_instances
        )
        return task_instances, serializer

    def sync_import(self, request, project, preannotated_from_fields, commit_to_project, return_task_ids):
        start = time.time()
        tasks = None
        # upload files from request, and parse all tasks
        # TODO: Stop passing request to load_tasks function, make all validation before
        parsed_data, file_upload_ids, could_be_tasks_list, found_formats, data_columns = load_tasks(request, project)

        if preannotated_from_fields:
            # turn flat task JSONs {"column1": value, "column2": value} into {"data": {"column1"..}, "predictions": [{..."column2"}]
            parsed_data = reformat_predictions(parsed_data, preannotated_from_fields)

        if commit_to_project:
            # Immediately create project tasks and update project states and counters
            tasks, serializer = self._save(parsed_data)
            task_count = len(tasks)
            annotation_count = len(serializer.db_annotations)
            prediction_count = len(serializer.db_predictions)

            recalculate_stats_counts = {
                'task_count': task_count,
                'annotation_count': annotation_count,
                'prediction_count': prediction_count,
            }

            # Update counters (like total_annotations) for new tasks and after bulk update tasks stats. It should be a
            # single operation as counters affect bulk is_labeled update
            project.update_tasks_counters_and_task_states(
                tasks_queryset=tasks,
                maximum_annotations_changed=False,
                overlap_cohort_percentage_changed=False,
                tasks_number_changed=True,
                recalculate_stats_counts=recalculate_stats_counts,
            )
            logger.info('Tasks bulk_update finished (sync import)')

            project.summary.update_data_columns(parsed_data)
            # TODO: project.summary.update_created_annotations_and_labels
        else:
            # Do nothing - just output file upload ids for further use
            task_count = len(parsed_data)
            annotation_count = None
            prediction_count = None

        duration = time.time() - start

        response = {
            'task_count': task_count,
            'annotation_count': annotation_count,
            'prediction_count': prediction_count,
            'duration': duration,
            'file_upload_ids': file_upload_ids,
            'could_be_tasks_list': could_be_tasks_list,
            'found_formats': found_formats,
            'data_columns': data_columns,
        }
        if tasks and return_task_ids:
            response['task_ids'] = [task.id for task in tasks]

        return Response(response, status=status.HTTP_201_CREATED)

    @timeit
    def async_import(self, request, project, preannotated_from_fields, commit_to_project, return_task_ids):

        with transaction.atomic():
            project_import = ProjectImport.objects.create(
                project=project,
                preannotated_from_fields=preannotated_from_fields,
                commit_to_project=commit_to_project,
                return_task_ids=return_task_ids,
            )

            if len(request.FILES):
                logger.debug(f'Import from files: {request.FILES}')
                file_upload_ids, could_be_tasks_list = create_file_uploads(request.user, project, request.FILES)
                project_import.file_upload_ids = file_upload_ids
                project_import.could_be_tasks_list = could_be_tasks_list
                project_import.save(update_fields=['file_upload_ids', 'could_be_tasks_list'])
            elif 'application/x-www-form-urlencoded' in request.content_type:
                logger.debug(f'Import from url: {request.data.get("url")}')
                url = request.data.get('url')
                if not url:
                    raise ValidationError('"url" is not found in request data')
                project_import.url = url
                project_import.save(update_fields=['url'])
            elif 'application/json' in request.content_type and isinstance(request.data, dict):
                project_import.tasks = [request.data]
                project_import.save(update_fields=['tasks'])
            elif 'application/json' in request.content_type and isinstance(request.data, list):
                project_import.tasks = request.data
                project_import.save(update_fields=['tasks'])
            else:
                raise ValidationError('load_tasks: No data found in DATA or in FILES')

        transaction.on_commit(
            lambda: start_job_async_or_sync(
                async_import_background,
                project_import.id,
                request.user.id,
                queue_name='high',
                on_failure=set_import_background_failure,
                project_id=project.id,
                organization_id=request.user.active_organization.id,
            )
        )

        response = {'import': project_import.id}
        return Response(response, status=status.HTTP_201_CREATED)

    def create(self, request, *args, **kwargs):
        commit_to_project = bool_from_request(request.query_params, 'commit_to_project', True)
        return_task_ids = bool_from_request(request.query_params, 'return_task_ids', False)
        preannotated_from_fields = list_of_strings_from_request(request.query_params, 'preannotated_from_fields', None)

        # check project permissions
        project = generics.get_object_or_404(Project.objects.for_user(self.request.user), pk=self.kwargs['pk'])

        if settings.VERSION_EDITION != 'Community':
            return self.async_import(request, project, preannotated_from_fields, commit_to_project, return_task_ids)
        else:
            return self.sync_import(request, project, preannotated_from_fields, commit_to_project, return_task_ids)


# Import
class ImportPredictionsAPI(generics.CreateAPIView):
    permission_required = all_permissions.projects_change
    parser_classes = (JSONParser, MultiPartParser, FormParser)
    serializer_class = PredictionSerializer
    queryset = Project.objects.all()
    swagger_schema = None  # TODO: create API schema

    def create(self, request, *args, **kwargs):
        # check project permissions
        project = self.get_object()

        tasks_ids = set(Task.objects.filter(project=project).values_list('id', flat=True))

        logger.debug(
            f'Importing {len(self.request.data)} predictions to project {project} with {len(tasks_ids)} tasks'
        )
        predictions = []
        for item in self.request.data:
            if item.get('task') not in tasks_ids:
                raise ValidationError(
                    f'{item} contains invalid "task" field: corresponding task ID couldn\'t be retrieved '
                    f'from project {project} tasks'
                )
            predictions.append(
                Prediction(
                    task_id=item['task'],
                    project_id=project.id,
                    result=Prediction.prepare_prediction_result(item.get('result'), project),
                    score=item.get('score'),
                    model_version=item.get('model_version', 'undefined'),
                )
            )
        predictions_obj = Prediction.objects.bulk_create(predictions, batch_size=settings.BATCH_SIZE)
        start_job_async_or_sync(update_tasks_counters, Task.objects.filter(id__in=tasks_ids))
        return Response({'created': len(predictions_obj)}, status=status.HTTP_201_CREATED)


class TasksBulkCreateAPI(ImportAPI):
    # just for compatibility - can be safely removed
    swagger_schema = None


class ReImportAPI(ImportAPI):
    permission_required = all_permissions.projects_change

    def sync_reimport(self, project, file_upload_ids, files_as_tasks_list):
        start = time.time()
        tasks, found_formats, data_columns = FileUpload.load_tasks_from_uploaded_files(
            project, file_upload_ids, files_as_tasks_list=files_as_tasks_list
        )

        with transaction.atomic():
            project.remove_tasks_by_file_uploads(file_upload_ids)
            tasks, serializer = self._save(tasks)

            if settings.OCR_ENABLED and tasks:
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
                    logger.info(f'Marked {len(ocr_tasks)} tasks for OCR processing')
                        
        if settings.OCR_ENABLED and tasks:
            try:

                ocr_task_ids = [task.id for task in tasks if is_support_document(task)]

                if ocr_task_ids:
                    logger.info(f'Queuing OCR background job for {len(ocr_task_ids)} tasks')

                    start_job_async_or_sync(
                        process_ocr_for_tasks_background,
                        ocr_task_ids,
                        queue_name='high',
                    )

                    logger.info('OCR background job queued successfully')
                else:
                    logger.info('No tasks require OCR processing')
            except Exception as e:
                logger.error(f'Failed to queue OCR background job: {e}', exc_info=True)
        duration = time.time() - start

        task_count = len(tasks)
        annotation_count = len(serializer.db_annotations)
        prediction_count = len(serializer.db_predictions)

        # Update counters (like total_annotations) for new tasks and after bulk update tasks stats. It should be a
        # single operation as counters affect bulk is_labeled update
        project.update_tasks_counters_and_task_states(
            tasks_queryset=tasks,
            maximum_annotations_changed=False,
            overlap_cohort_percentage_changed=False,
            tasks_number_changed=True,
            recalculate_stats_counts={
                'task_count': task_count,
                'annotation_count': annotation_count,
                'prediction_count': prediction_count,
            },
        )
        logger.info('Tasks bulk_update finished (sync reimport)')

        project.summary.update_data_columns(tasks)
        # TODO: project.summary.update_created_annotations_and_labels

        return Response(
            {
                'task_count': task_count,
                'annotation_count': annotation_count,
                'prediction_count': prediction_count,
                'duration': duration,
                'file_upload_ids': file_upload_ids,
                'found_formats': found_formats,
                'data_columns': data_columns,
            },
            status=status.HTTP_201_CREATED,
        )

    def async_reimport(self, project, file_upload_ids, files_as_tasks_list, organization_id):

        project_reimport = ProjectReimport.objects.create(
            project=project, file_upload_ids=file_upload_ids, files_as_tasks_list=files_as_tasks_list
        )

        start_job_async_or_sync(
            async_reimport_background,
            project_reimport.id,
            organization_id,
            self.request.user,
            queue_name='high',
            on_failure=set_reimport_background_failure,
            project_id=project.id,
        )

        response = {'reimport': project_reimport.id}
        return Response(response, status=status.HTTP_201_CREATED)

    @retry_database_locked()
    def create(self, request, *args, **kwargs):
        files_as_tasks_list = bool_from_request(request.data, 'files_as_tasks_list', True)
        file_upload_ids = self.request.data.get('file_upload_ids')

        # check project permissions
        project = generics.get_object_or_404(Project.objects.for_user(self.request.user), pk=self.kwargs['pk'])

        if not file_upload_ids:
            return Response(
                {
                    'task_count': 0,
                    'annotation_count': 0,
                    'prediction_count': 0,
                    'duration': 0,
                    'file_upload_ids': [],
                    'found_formats': {},
                    'data_columns': [],
                },
                status=status.HTTP_200_OK,
            )

        if (
            flag_set('fflag_fix_all_lsdv_4971_async_reimport_09052023_short', request.user)
            and settings.VERSION_EDITION != 'Community'
        ):
            return self.async_reimport(
                project, file_upload_ids, files_as_tasks_list, request.user.active_organization_id
            )
        else:
            return self.sync_reimport(project, file_upload_ids, files_as_tasks_list)

    @swagger_auto_schema(
        auto_schema=None,
        operation_summary='Re-import tasks',
        operation_description="""
        Re-import tasks using the specified file upload IDs for a specific project.
        """,
    )
    def post(self, *args, **kwargs):
        return super(ReImportAPI, self).post(*args, **kwargs)


@method_decorator(
    name='get',
    decorator=swagger_auto_schema(
        tags=['Import'],
        x_fern_sdk_group_name=['files'],
        x_fern_sdk_method_name='list',
        x_fern_audiences=['public'],
        operation_summary='Get project file uploads',
        operation_description='Retrieve paginated list of file uploads for a project, with filtering options.',
        manual_parameters=[
            openapi.Parameter(
                name='page',
                type=openapi.TYPE_INTEGER,
                in_=openapi.IN_QUERY,
                description='Page number for pagination',
            ),
            openapi.Parameter(
                name='page_size',
                type=openapi.TYPE_INTEGER,
                in_=openapi.IN_QUERY,
                description='Number of items per page (max 100)',
            ),
            openapi.Parameter(
                name='is_parent',
                type=openapi.TYPE_BOOLEAN,
                in_=openapi.IN_QUERY,
                description='Filter for parent documents only (default: true)',
                default=True,
            ),
            openapi.Parameter(
                name='file_type',
                type=openapi.TYPE_STRING,
                in_=openapi.IN_QUERY,
                description='Filter by file extension (e.g., ".pdf", ".png")',
            ),
            openapi.Parameter(
                name='ordering',
                type=openapi.TYPE_STRING,
                in_=openapi.IN_QUERY,
                description='Sort order (e.g., "-created_at", "created_at")',
            ),
        ],
    ),
)
class FileUploadListAPI(generics.ListAPIView):
    """
    List file uploads for a project with filtering and pagination.

    Supports:
    - Parent document filtering (excludes PDF-extracted images)
    - File type filtering
    - Ordering by various fields
    - Pagination with customizable page size
    """
    parser_classes = (JSONParser, MultiPartParser, FormParser)
    serializer_class = FileUploadListSerializer
    permission_required = ViewClassPermission(
        GET=all_permissions.projects_view,
    )
    pagination_class = FileUploadPagination

    def get_queryset(self) -> QuerySet[FileUpload]:
        """
        Get filtered and ordered queryset of FileUpload objects for the project.

        Query Parameters:
            is_parent (bool): Filter for parent documents only (default: True)
            file_type (str): Filter by file extension (e.g., ".pdf", ".png")
            ordering (str): Sort order, must be one of VALID_ORDERINGS

        Returns:
            QuerySet[FileUpload]: Filtered and ordered queryset

        Raises:
            ValidationError: If file_type extension is not in ALLOWED_FILE_EXTENSIONS
            ValidationError: If ordering is not in VALID_ORDERINGS
        """
        project_pk = self.kwargs.get('pk')
        project = generics.get_object_or_404(
            Project.objects.for_user(self.request.user),
            pk=project_pk
        )

        queryset = FileUpload.objects.filter(project=project) \
            .select_related('project', 'user') \
            .prefetch_related('tasks')

        is_parent = bool_from_request(self.request.query_params, 'is_parent', True)
        if is_parent:
            child_file_ids = PDFImageRelationship.objects.values_list('image_file_id', flat=True)
            queryset = queryset.exclude(id__in=child_file_ids)

        file_type = self.request.query_params.get('file_type')
        if file_type:
            normalized_ext = file_type.strip().lower()
            if not normalized_ext.startswith('.'):
                normalized_ext = f'.{normalized_ext}'

            if normalized_ext not in ALLOWED_FILE_EXTENSIONS:
                raise ValidationError(
                    f'Invalid file_type "{file_type}". '
                    f'Must be one of: {", ".join(sorted(ALLOWED_FILE_EXTENSIONS))}'
                )

            queryset = queryset.filter(file__endswith=normalized_ext)

        ordering = self.request.query_params.get('ordering', '-created_at')
        if ordering not in VALID_ORDERINGS:
            raise ValidationError(
                f'Invalid ordering "{ordering}". '
                f'Must be one of: {", ".join(sorted(VALID_ORDERINGS))}'
            )

        queryset = queryset.order_by(ordering)

        return queryset


@method_decorator(
    name='get',
    decorator=swagger_auto_schema(
        tags=['Import'],
        x_fern_sdk_group_name=['files'],
        x_fern_sdk_method_name='download',
        x_fern_audiences=['public'],
        operation_summary='Download file upload',
        operation_description='Get download URL or stream for a specific file upload. Returns presigned URL for S3/MinIO storage, or streams file for local storage.',
    ),
)
class FileUploadDownloadAPI(APIView):
    """
    Provides download access for uploaded files.

    Behavior:
    - For S3/MinIO storage: Returns JSON with presigned URL
    - For local storage: Streams file using RangedFileResponse
    """
    permission_required = ViewClassPermission(
        GET=all_permissions.projects_view,
    )

    def get(self, request, *args, **kwargs):
        file_upload_id = self.kwargs.get('pk')

        file_upload = generics.get_object_or_404(FileUpload, pk=file_upload_id)

        if not file_upload.has_permission(request.user):
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )

        file = file_upload.file

        storage = file.storage
        storage_type = storage.__class__.__name__

        if 'S3' in storage_type or hasattr(storage, 'bucket_name'):
            try:
                from io_storages.s3.models import S3ImportStorage

                s3_storage = S3ImportStorage.objects.filter(
                    project=file_upload.project
                ).first()

                if s3_storage:
                    presigned_url = s3_storage.generate_http_url(file.url)
                    return Response({
                        'download_url': presigned_url,
                        'file_name': file_upload.file_name,
                    })
                else:
                    return Response({
                        'download_url': file.url,
                        'file_name': file_upload.file_name,
                    })

            except Exception as e:
                logger.error(f'Failed to generate presigned URL for file {file_upload.id}: {e}')
                return Response(
                    {'error': 'Failed to generate download URL'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        else:
            if not file.storage.exists(file.name):
                return Response(
                    {'error': 'File not found'},
                    status=status.HTTP_404_NOT_FOUND
                )

            content_type, encoding = mimetypes.guess_type(str(file.name))
            content_type = content_type or 'application/octet-stream'

            response = RangedFileResponse(
                request,
                file.open(mode='rb'),
                content_type=content_type
            )
            response['Content-Disposition'] = f'attachment; filename="{file_upload.file_name}"'
            return response


@method_decorator(
    name='get',
    decorator=swagger_auto_schema(
        tags=['Import'],
        x_fern_sdk_group_name=['files'],
        x_fern_sdk_method_name='get_task',
        x_fern_audiences=['public'],
        operation_summary='Get first task for file upload',
        operation_description='Returns the first task ID associated with this file upload for navigation to annotation view.',
    ),
)
class FileUploadTaskAPI(APIView):
    """
    Returns first associated task ID for file upload navigation.

    Used by frontend to navigate to: /projects/{project_id}/data?task={task_id}
    """
    permission_required = ViewClassPermission(
        GET=all_permissions.projects_view,
    )

    def get(self, request, *args, **kwargs):
        file_upload_id = self.kwargs.get('pk')

        file_upload = generics.get_object_or_404(FileUpload, pk=file_upload_id)

        if not file_upload.has_permission(request.user):
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )

        first_task = file_upload.tasks.first()

        if not first_task:
            return Response(
                {'error': 'No tasks found for this file upload'},
                status=status.HTTP_404_NOT_FOUND
            )

        return Response({
            'task_id': first_task.id,
            'project_id': file_upload.project_id,
        })


@method_decorator(
    name='get',
    decorator=swagger_auto_schema(
        tags=['Import'],
        x_fern_sdk_group_name=['files'],
        x_fern_sdk_method_name='get',
        x_fern_audiences=['public'],
        operation_summary='Get file upload',
        operation_description='Retrieve details about a specific uploaded file.',
    ),
)
@method_decorator(
    name='patch',
    decorator=swagger_auto_schema(
        tags=['Import'],
        x_fern_sdk_group_name=['files'],
        x_fern_sdk_method_name='update',
        x_fern_audiences=['public'],
        operation_summary='Update file upload',
        operation_description='Update a specific uploaded file.',
        request_body=FileUploadSerializer,
    ),
)
@method_decorator(
    name='delete',
    decorator=swagger_auto_schema(
        tags=['Import'],
        x_fern_sdk_group_name=['files'],
        x_fern_sdk_method_name='delete',
        x_fern_audiences=['public'],
        operation_summary='Delete file upload',
        operation_description='Delete a specific uploaded file.',
    ),
)
class FileUploadAPI(generics.RetrieveUpdateDestroyAPIView):
    parser_classes = (JSONParser, MultiPartParser, FormParser)
    permission_classes = (IsAuthenticated,)
    serializer_class = FileUploadSerializer
    queryset = FileUpload.objects.all()

    def get(self, *args, **kwargs):
        return super(FileUploadAPI, self).get(*args, **kwargs)

    def patch(self, *args, **kwargs):
        return super(FileUploadAPI, self).patch(*args, **kwargs)

    def delete(self, *args, **kwargs):
        return super(FileUploadAPI, self).delete(*args, **kwargs)

    @swagger_auto_schema(auto_schema=None)
    def put(self, *args, **kwargs):
        return super(FileUploadAPI, self).put(*args, **kwargs)


class UploadedFileResponse(generics.RetrieveAPIView):
    """Serve uploaded files from local drive"""

    permission_classes = (IsAuthenticated,)

    @override_report_only_csp
    @csp(SANDBOX=[])
    @swagger_auto_schema(
        tags=['Import'],
        x_fern_sdk_group_name=['files'],
        x_fern_sdk_method_name='download',
        x_fern_audiences=['public'],
        operation_summary='Download file',
        operation_description='Download a specific uploaded file.',
    )
    def get(self, *args, **kwargs):
        request = self.request
        filename = kwargs['filename']
        # XXX needed, on windows os.path.join generates '\' which breaks FileUpload
        file = settings.UPLOAD_DIR + ('/' if not settings.UPLOAD_DIR.endswith('/') else '') + filename
        logger.debug(f'Fetch uploaded file by user {request.user} => {file}')
        file_upload = FileUpload.objects.filter(file=file).last()

        if not file_upload.has_permission(request.user):
            return Response(status=status.HTTP_403_FORBIDDEN)

        file = file_upload.file
        if file.storage.exists(file.name):
            content_type, encoding = mimetypes.guess_type(str(file.name))
            content_type = content_type or 'application/octet-stream'
            return RangedFileResponse(request, file.open(mode='rb'), content_type=content_type)

        return Response(status=status.HTTP_404_NOT_FOUND)


class DownloadStorageData(APIView):
    """
    Secure file download API for persistent storage (S3, GCS, Azure, etc.)

    This view provides authenticated access to uploaded files and user avatars stored in
    cloud storage or local filesystems. It supports two operational modes for optimal
    performance and flexibility (simplicity).

    ## Operation Modes:

    ### 1. NGINX Mode (Default - USE_NGINX_FOR_UPLOADS=True)
    - **High Performance**: Uses X-Accel-Redirect headers for efficient file serving
    - **How it works**:
      1. Validates user permissions and file access
      2. Returns HttpResponse with X-Accel-Redirect header pointing to storage URL
      3. NGINX intercepts and serves the file directly from storage
    - **Benefits**: Reduces Django server load, better performance for large files

    ### 2. Direct Mode (USE_NGINX_FOR_UPLOADS=False)
    - **Direct Serving**: Django serves files using RangedFileResponse
    - **How it works**:
      1. Validates user permissions and file access
      2. Opens file from storage and streams it with range request support
      3. Supports partial content requests (HTTP 206)
    - **Benefits**: Works without NGINX, supports range requests for media files

    ## Content-Disposition Logic:
    - **Inline**: PDFs, audio, video files - because media files are directly displayed in the browser
    """

    swagger_schema = None
    http_method_names = ['get']
    permission_classes = (IsAuthenticated,)

    def get(self, request, *args, **kwargs):
        """Get export files list"""
        filepath = request.GET.get('filepath')
        if filepath is None:
            return Response(status=status.HTTP_404_NOT_FOUND)

        filepath = unquote(request.GET['filepath'])

        file_obj = None
        if filepath.startswith(settings.UPLOAD_DIR):
            logger.debug(f'Fetch uploaded file by user {request.user} => {filepath}')
            file_upload = FileUpload.objects.filter(file=filepath).last()

            if file_upload is not None and file_upload.has_permission(request.user):
                file_obj = file_upload.file
        elif filepath.startswith(settings.AVATAR_PATH):
            user = User.objects.filter(avatar=filepath).first()
            if user is not None and request.user.active_organization.has_user(user):
                file_obj = user.avatar

        if file_obj is None:
            return Response(status=status.HTTP_403_FORBIDDEN)

        # NGINX handling is the default for better performance
        if settings.USE_NGINX_FOR_UPLOADS:
            url = file_obj.storage.url(file_obj.name, storage_url=True)

            protocol = urlparse(url).scheme
            response = HttpResponse()
            # The below header tells NGINX to catch it and serve, see deploy/default.conf
            redirect = '/file_download/' + protocol + '/' + url.replace(protocol + '://', '')
            response['X-Accel-Redirect'] = redirect
            response['Content-Disposition'] = f'inline; filename="{filepath}"'
            return response

        # No NGINX: standard way for direct file serving
        else:
            content_type, _ = mimetypes.guess_type(filepath)
            content_type = content_type or 'application/octet-stream'
            response = RangedFileResponse(request, file_obj.open(mode='rb'), content_type=content_type)
            response['Content-Disposition'] = f'inline; filename="{filepath}"'
            response['filename'] = filepath
            return response



class ReImportAPIProxy(ReImportAPI):
    def async_reimport(self, project, file_upload_ids, files_as_tasks_list, organization_id):

        project_reimport = ProjectReimport.objects.create(
            project=project, file_upload_ids=file_upload_ids, files_as_tasks_list=files_as_tasks_list
        )

        start_job_async_or_sync(
            async_reimport_background,
            project_reimport.id,
            organization_id,
            self.request.user,
            queue_name='high',
            on_failure=set_reimport_background_failure,
            project_id=project.id,
        )

        response = {'reimport': project_reimport.id}
        return Response(response, status=status.HTTP_201_CREATED)

    @retry_database_locked()
    def create(self, request, *args, **kwargs):
        files_as_tasks_list = bool_from_request(request.data, 'files_as_tasks_list', True)
        file_upload_ids = self.request.data.get('file_upload_ids')

        project = generics.get_object_or_404(Project.objects.for_user(self.request.user), pk=self.kwargs['pk'])

        if not file_upload_ids:
            return Response(
                {
                    'task_count': 0,
                    'annotation_count': 0,
                    'prediction_count': 0,
                    'duration': 0,
                    'file_upload_ids': [],
                    'found_formats': {},
                    'data_columns': [],
                },
                status=status.HTTP_200_OK,
            )

        return self.sync_reimport(project, file_upload_ids, files_as_tasks_list)

