import logging
from pathlib import Path

from rest_framework.views import APIView
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.pagination import PageNumberPagination
from django.http import FileResponse
from django.shortcuts import get_object_or_404
from django.utils.decorators import method_decorator
from django.db import transaction
from django.db.models import Q

from core.permissions import ViewClassPermission, all_permissions
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from projects.models import Project

from .models import AviationAnnotation, AviationDropdownOption, AviationIncident, AviationProject
from .serializers import (
    AviationAnnotationSerializer,
    AviationDropdownOptionSerializer,
    AviationIncidentSerializer,
    AviationProjectSerializer,
    ExcelUploadSerializer
)

logger = logging.getLogger(__name__)

ALLOWED_EXPORT_BASE = Path('/tmp').resolve()


def _validate_export_path(file_path):
    """Validate file path to prevent path traversal attacks.

    Returns resolved Path if valid, None if invalid.
    """
    resolved_path = Path(file_path).resolve()
    if not str(resolved_path).startswith(str(ALLOWED_EXPORT_BASE)):
        logger.error(f"Path traversal attempt: {resolved_path}")
        return None
    return resolved_path


class AviationDropdownPagination(PageNumberPagination):
    page_size = 100
    page_size_query_param = 'page_size'
    max_page_size = 1000


@method_decorator(
    name='get',
    decorator=swagger_auto_schema(
        tags=['Aviation'],
        operation_summary='List aviation projects',
        operation_description='Get list of aviation projects for current organization',
    )
)
@method_decorator(
    name='post',
    decorator=swagger_auto_schema(
        tags=['Aviation'],
        operation_summary='Create aviation project',
        operation_description='Create new aviation project with base project wrapper',
    )
)
class AviationProjectListAPI(generics.ListCreateAPIView):
    """List and create aviation projects"""
    serializer_class = AviationProjectSerializer
    pagination_class = AviationDropdownPagination
    permission_required = ViewClassPermission(
        GET=all_permissions.projects_view,
        POST=all_permissions.projects_create,
    )

    def get_queryset(self):
        return AviationProject.objects.filter(
            project__organization=self.request.user.active_organization
        ).select_related('project').order_by('-created_at')


@method_decorator(
    name='get',
    decorator=swagger_auto_schema(
        tags=['Aviation'],
        operation_summary='Get aviation project',
    )
)
@method_decorator(
    name='patch',
    decorator=swagger_auto_schema(
        tags=['Aviation'],
        operation_summary='Update aviation project',
    )
)
@method_decorator(
    name='delete',
    decorator=swagger_auto_schema(
        tags=['Aviation'],
        operation_summary='Delete aviation project',
    )
)
class AviationProjectDetailAPI(generics.RetrieveUpdateDestroyAPIView):
    """Get, update, or delete aviation project"""
    serializer_class = AviationProjectSerializer
    permission_required = ViewClassPermission(
        GET=all_permissions.projects_view,
        PATCH=all_permissions.projects_change,
        DELETE=all_permissions.projects_delete,
    )

    def get_queryset(self):
        return AviationProject.objects.filter(
            project__organization=self.request.user.active_organization
        ).select_related('project')

    def perform_destroy(self, instance):
        with transaction.atomic():
            project = instance.project
            instance.delete()
            project.delete()


@method_decorator(
    name='post',
    decorator=swagger_auto_schema(
        tags=['Aviation'],
        operation_summary='Upload aviation incidents from Excel',
        operation_description='Parse Excel file and create tasks from aviation incidents',
    )
)
class AviationExcelUploadAPI(generics.CreateAPIView):
    """Handle Excel file upload and task creation"""
    parser_classes = (MultiPartParser, FormParser)
    serializer_class = ExcelUploadSerializer
    permission_required = ViewClassPermission(
        POST=all_permissions.projects_change,
    )

    def get_queryset(self):
        return Project.objects.filter(organization=self.request.user.active_organization)

    def post(self, request, *args, **kwargs):
        project = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        from .services import ExcelParserService
        parser = ExcelParserService()

        try:
            result = parser.parse_incidents(serializer.validated_data['file'], project)

            if result['created'] == 0 and result['total_rows'] > 0:
                return Response(result, status=status.HTTP_400_BAD_REQUEST)

            return Response(result, status=status.HTTP_200_OK if result['errors'] else status.HTTP_201_CREATED)
        except NotImplementedError as e:
            return Response({'error': str(e)}, status=status.HTTP_501_NOT_IMPLEMENTED)


@method_decorator(
    name='post',
    decorator=swagger_auto_schema(
        tags=['Aviation'],
        operation_summary='Validate Excel format',
        operation_description='Validate Excel file structure compliance',
    )
)
class AviationExcelValidateAPI(APIView):
    """Validate Excel format compliance"""
    parser_classes = (MultiPartParser, FormParser)
    permission_required = ViewClassPermission(
        POST=all_permissions.projects_view,
    )

    def post(self, request, pk=None):
        get_object_or_404(
            Project.objects.filter(organization=request.user.active_organization),
            id=pk
        )

        from .services import ExcelParserService
        parser = ExcelParserService()

        file = request.FILES.get('file')
        if not file:
            return Response({'error': 'File parameter is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            validation_result = parser.validate_structure(file)
            result = validation_result or {'valid': True}
            if not result.get('valid', True):
                return Response(result, status=status.HTTP_400_BAD_REQUEST)
            return Response(result, status=status.HTTP_200_OK)
        except NotImplementedError as e:
            return Response({'error': str(e)}, status=status.HTTP_501_NOT_IMPLEMENTED)
        except ValidationError as e:
            return Response({'error': 'Invalid file format', 'details': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.exception("Unexpected error during validation")
            return Response({'error': 'Validation failed'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@method_decorator(
    name='get',
    decorator=swagger_auto_schema(
        tags=['Aviation'],
        operation_summary='List aviation annotations',
    )
)
@method_decorator(
    name='post',
    decorator=swagger_auto_schema(
        tags=['Aviation'],
        operation_summary='Create aviation annotation',
    )
)
class AviationAnnotationListAPI(generics.ListCreateAPIView):
    """Aviation annotation CRUD operations"""
    serializer_class = AviationAnnotationSerializer
    pagination_class = AviationDropdownPagination
    permission_required = ViewClassPermission(
        GET=all_permissions.tasks_view,
        POST=all_permissions.tasks_change,
    )

    def get_queryset(self):
        task_id = self.request.query_params.get('task_id')
        project_id = self.request.query_params.get('project')
        queryset = AviationAnnotation.objects.for_organization(
            self.request.user.active_organization
        )
        if task_id:
            queryset = queryset.filter(annotation__task_id=task_id)
        if project_id:
            queryset = queryset.filter(annotation__task__project_id=project_id)
        return queryset

    def perform_create(self, serializer):
        from tasks.models import Annotation, Task

        with transaction.atomic():
            task_id = self.request.data.get('task_id')
            if not task_id:
                raise ValidationError({'task_id': 'This field is required'})

            task = get_object_or_404(
                Task.objects.for_user(self.request.user),
                id=task_id
            )

            annotation, created = Annotation.objects.get_or_create(
                task=task,
                completed_by=self.request.user,
                defaults={'result': []}
            )

            if created:
                logger.debug(f'Auto-created annotation for task={task_id} user={self.request.user.id}')

            serializer.save(annotation=annotation)


@method_decorator(
    name='get',
    decorator=swagger_auto_schema(
        tags=['Aviation'],
        operation_summary='Get aviation annotation',
    )
)
@method_decorator(
    name='patch',
    decorator=swagger_auto_schema(
        tags=['Aviation'],
        operation_summary='Update aviation annotation',
    )
)
@method_decorator(
    name='delete',
    decorator=swagger_auto_schema(
        tags=['Aviation'],
        operation_summary='Delete aviation annotation',
    )
)
class AviationAnnotationDetailAPI(generics.RetrieveUpdateDestroyAPIView):
    """Get, update, or delete aviation annotation"""
    serializer_class = AviationAnnotationSerializer
    permission_required = ViewClassPermission(
        GET=all_permissions.tasks_view,
        PATCH=all_permissions.tasks_change,
        DELETE=all_permissions.tasks_delete,
    )

    def get_queryset(self):
        return AviationAnnotation.objects.for_organization(
            self.request.user.active_organization
        )

    def perform_update(self, serializer):
        with transaction.atomic():
            serializer.save()


DROPDOWN_CATEGORY_MAPPING = {
    'flight_phase': 'flight_phases',
    'threat_mgmt': 'threat_management',
    'error_mgmt': 'error_management',
    'uas_mgmt': 'uas_management',
    'error': 'error_type',
}


@method_decorator(
    name='get',
    decorator=swagger_auto_schema(
        tags=['Aviation'],
        operation_summary='List dropdown options',
        operation_description='Get dropdown options filtered by category, level, or parent. Use grouped=true to get all options grouped by category.',
        manual_parameters=[
            openapi.Parameter(
                name='category',
                type=openapi.TYPE_STRING,
                in_=openapi.IN_QUERY,
                description='Filter by category'
            ),
            openapi.Parameter(
                name='level',
                type=openapi.TYPE_INTEGER,
                in_=openapi.IN_QUERY,
                description='Filter by level (1, 2, or 3)'
            ),
            openapi.Parameter(
                name='parent',
                type=openapi.TYPE_INTEGER,
                in_=openapi.IN_QUERY,
                description='Filter by parent ID'
            ),
            openapi.Parameter(
                name='grouped',
                type=openapi.TYPE_BOOLEAN,
                in_=openapi.IN_QUERY,
                description='Return all options grouped by category (ignores other filters)'
            ),
        ],
    )
)
class AviationDropdownListAPI(generics.ListAPIView):
    """Provide dropdown options to frontend.

    Supports two modes:
    - Filtered mode (default): Filter by category, level, or parent
    - Grouped mode (?grouped=true): Return all options grouped by category
    """
    serializer_class = AviationDropdownOptionSerializer
    pagination_class = AviationDropdownPagination
    permission_required = ViewClassPermission(
        GET=all_permissions.projects_view,
    )

    def get(self, request, *args, **kwargs):
        grouped = request.query_params.get('grouped', '').lower() == 'true'
        if grouped:
            return self._get_grouped_response()
        return super().get(request, *args, **kwargs)

    def _get_grouped_response(self):
        from collections import defaultdict

        options = AviationDropdownOption.objects.filter(
            is_active=True
        ).order_by('category', 'display_order')

        grouped = defaultdict(list)
        serializer = AviationDropdownOptionSerializer(options, many=True)

        for option_data in serializer.data:
            category = option_data['category']
            frontend_category = DROPDOWN_CATEGORY_MAPPING.get(category, category)
            grouped[frontend_category].append(option_data)

        return Response(dict(grouped), status=status.HTTP_200_OK)

    def get_queryset(self):
        category = self.request.query_params.get('category')
        level = self.request.query_params.get('level')
        parent_id = self.request.query_params.get('parent')

        queryset = AviationDropdownOption.objects.filter(is_active=True)

        if category:
            queryset = queryset.filter(category=category)
        if level:
            try:
                level = int(level)
                if level not in (1, 2, 3):
                    raise ValueError
                queryset = queryset.filter(level=level)
            except (ValueError, TypeError):
                raise ValidationError({'level': 'Must be integer 1, 2, or 3'})
        if parent_id:
            try:
                parent_id = int(parent_id)
                queryset = queryset.filter(parent_id=parent_id)
            except (ValueError, TypeError):
                raise ValidationError({'parent': 'Must be valid integer'})

        return queryset.order_by('display_order')


class AviationDropdownHierarchyAPI(APIView):
    """Return full hierarchy tree for dropdowns"""
    permission_required = ViewClassPermission(
        GET=all_permissions.projects_view,
    )

    @swagger_auto_schema(
        tags=['Aviation'],
        operation_summary='Get dropdown hierarchy tree',
        operation_description='Return full hierarchical tree structure for a category',
        manual_parameters=[
            openapi.Parameter(
                name='category',
                type=openapi.TYPE_STRING,
                in_=openapi.IN_QUERY,
                description='Category to get hierarchy for',
                required=True
            ),
        ],
    )
    def get(self, request):
        category = request.query_params.get('category')
        if not category:
            return Response(
                {'error': 'category parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        options = AviationDropdownOption.objects.filter(
            category=category,
            is_active=True
        ).order_by('level', 'display_order')

        hierarchy = self._build_tree(options)
        return Response(hierarchy, status=status.HTTP_200_OK)

    def _build_tree(self, options):
        """Build hierarchical tree structure"""
        tree = {}
        nodes = {}

        for option in options:
            nodes[option.id] = {
                'id': option.id,
                'code': option.code,
                'label': option.label,
                'level': option.level,
                'training_topics': option.training_topics,
                'children': []
            }

        for option in options:
            if option.parent_id:
                if option.parent_id in nodes:
                    nodes[option.parent_id]['children'].append(nodes[option.id])
            else:
                tree[option.id] = nodes[option.id]

        return list(tree.values())


class AviationDropdownSearchAPI(APIView):
    """Fuzzy search across dropdown options"""
    permission_required = ViewClassPermission(
        GET=all_permissions.projects_view,
    )

    @swagger_auto_schema(
        tags=['Aviation'],
        operation_summary='Search dropdown options',
        operation_description='Fuzzy search across dropdown labels and codes',
        manual_parameters=[
            openapi.Parameter(
                name='q',
                type=openapi.TYPE_STRING,
                in_=openapi.IN_QUERY,
                description='Search query',
                required=True
            ),
            openapi.Parameter(
                name='category',
                type=openapi.TYPE_STRING,
                in_=openapi.IN_QUERY,
                description='Filter by category'
            ),
        ],
    )
    def get(self, request):
        query = request.query_params.get('q', '')
        category = request.query_params.get('category')

        if not query:
            return Response([], status=status.HTTP_200_OK)

        if len(query) > 100:
            return Response(
                {'error': 'Query too long. Maximum 100 characters allowed'},
                status=status.HTTP_400_BAD_REQUEST
            )

        sanitized_query = query.replace('%', '').replace('_', '')

        queryset = AviationDropdownOption.objects.filter(
            Q(label__icontains=sanitized_query) | Q(code__icontains=sanitized_query),
            is_active=True
        )

        if category:
            queryset = queryset.filter(category=category)

        queryset = queryset.order_by('level', 'display_order')[:50]
        serializer = AviationDropdownOptionSerializer(queryset, many=True)

        return Response(serializer.data, status=status.HTTP_200_OK)


class AviationExportAPI(APIView):
    """Generate Excel exports with annotations"""
    permission_required = ViewClassPermission(
        GET=all_permissions.projects_view,
    )

    def get_queryset(self):
        return Project.objects.filter(organization=self.request.user.active_organization)

    @swagger_auto_schema(
        tags=['Aviation'],
        operation_summary='Export aviation annotations to Excel',
        manual_parameters=[
            openapi.Parameter(
                name='project_id',
                type=openapi.TYPE_INTEGER,
                in_=openapi.IN_QUERY,
                description='Project ID to export',
                required=True
            ),
        ],
    )
    def get(self, request):
        project_id = request.query_params.get('project_id')
        if not project_id:
            return Response(
                {'error': 'project_id parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        from .services import ExcelExportService
        exporter = ExcelExportService()

        project = self.get_queryset().filter(id=project_id).first()
        if not project:
            raise NotFound('Project not found')

        try:
            file_path = exporter.export_annotations(project)
        except NotImplementedError:
            return Response(
                {'error': 'Export service not yet implemented'},
                status=status.HTTP_501_NOT_IMPLEMENTED
            )

        if not file_path:
            return Response(
                {'error': 'Export service not yet implemented'},
                status=status.HTTP_501_NOT_IMPLEMENTED
            )

        validated_path = _validate_export_path(file_path)
        if validated_path is None:
            return Response(
                {'error': 'Invalid file path'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            response = FileResponse(
                open(validated_path, 'rb'),
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                as_attachment=True,
                filename=f'aviation_export_{project_id}.xlsx'
            )
            return response
        except FileNotFoundError:
            logger.error(f"Export file not found: {validated_path}")
            return Response(
                {'error': 'Export file not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class AviationExportTemplateAPI(APIView):
    """Generate empty Excel template"""
    permission_classes = (IsAuthenticated,)

    @swagger_auto_schema(
        tags=['Aviation'],
        operation_summary='Download empty aviation Excel template',
    )
    def get(self, request):
        from .services import ExcelExportService
        exporter = ExcelExportService()

        try:
            file_path = exporter.generate_template()
        except NotImplementedError:
            return Response(
                {'error': 'Template service not yet implemented'},
                status=status.HTTP_501_NOT_IMPLEMENTED
            )

        if not file_path:
            return Response(
                {'error': 'Template service not yet implemented'},
                status=status.HTTP_501_NOT_IMPLEMENTED
            )

        validated_path = _validate_export_path(file_path)
        if validated_path is None:
            return Response(
                {'error': 'Invalid file path'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            response = FileResponse(
                open(validated_path, 'rb'),
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                as_attachment=True,
                filename='aviation_template.xlsx'
            )
            return response
        except FileNotFoundError:
            logger.error(f"Template file not found: {validated_path}")
            return Response(
                {'error': 'Template file not found'},
                status=status.HTTP_404_NOT_FOUND
            )


@method_decorator(
    name='get',
    decorator=swagger_auto_schema(
        tags=['Aviation'],
        operation_summary='List aviation incidents',
        operation_description='Get aviation incidents filtered by task or project',
        manual_parameters=[
            openapi.Parameter(
                name='task_id',
                type=openapi.TYPE_INTEGER,
                in_=openapi.IN_QUERY,
                description='Filter by task ID (returns single incident)'
            ),
            openapi.Parameter(
                name='project',
                type=openapi.TYPE_INTEGER,
                in_=openapi.IN_QUERY,
                description='Filter by project ID'
            ),
        ],
    )
)
class AviationIncidentListAPI(generics.ListAPIView):
    """List aviation incidents for a project"""
    serializer_class = AviationIncidentSerializer
    pagination_class = AviationDropdownPagination
    permission_required = ViewClassPermission(
        GET=all_permissions.tasks_view,
    )

    def get_queryset(self):
        project_id = self.request.query_params.get('project')
        task_id = self.request.query_params.get('task_id')
        queryset = AviationIncident.objects.filter(
            task__project__organization=self.request.user.active_organization
        ).select_related('task', 'task__project')

        if task_id:
            queryset = queryset.filter(task_id=task_id)
        elif project_id:
            queryset = queryset.filter(task__project_id=project_id)

        return queryset.order_by('-date', '-created_at')


@method_decorator(
    name='get',
    decorator=swagger_auto_schema(
        tags=['Aviation'],
        operation_summary='Get aviation incident',
    )
)
@method_decorator(
    name='patch',
    decorator=swagger_auto_schema(
        tags=['Aviation'],
        operation_summary='Update aviation incident',
    )
)
@method_decorator(
    name='delete',
    decorator=swagger_auto_schema(
        tags=['Aviation'],
        operation_summary='Delete aviation incident',
    )
)
class AviationIncidentDetailAPI(generics.RetrieveUpdateDestroyAPIView):
    """Get, update, or delete aviation incident"""
    serializer_class = AviationIncidentSerializer
    permission_required = ViewClassPermission(
        GET=all_permissions.tasks_view,
        PATCH=all_permissions.tasks_change,
        DELETE=all_permissions.tasks_delete,
    )

    def get_queryset(self):
        return AviationIncident.objects.filter(
            task__project__organization=self.request.user.active_organization
        ).select_related('task', 'task__project')


class AviationTaskLockAPI(APIView):
    """Manage task locks for concurrent editing"""
    permission_required = ViewClassPermission(
        GET=all_permissions.tasks_view,
        POST=all_permissions.tasks_change,
        DELETE=all_permissions.tasks_change,
    )

    @swagger_auto_schema(
        tags=['Aviation'],
        operation_summary='Get task lock status',
    )
    def get(self, request, task_id):
        from .services import TaskLockService
        lock_service = TaskLockService()
        result = lock_service.get_lock_status(task_id)
        return Response(result, status=status.HTTP_200_OK)

    @swagger_auto_schema(
        tags=['Aviation'],
        operation_summary='Acquire task lock',
    )
    def post(self, request, task_id):
        from tasks.models import Task

        task = Task.objects.filter(
            id=task_id,
            project__organization=request.user.active_organization
        ).first()

        if not task:
            raise NotFound('Task not found')

        from .services import TaskLockService
        lock_service = TaskLockService()
        result = lock_service.acquire_lock(task_id, request.user)

        if result['success']:
            return Response(result, status=status.HTTP_200_OK)
        return Response(result, status=status.HTTP_409_CONFLICT)

    @swagger_auto_schema(
        tags=['Aviation'],
        operation_summary='Release task lock',
    )
    def delete(self, request, task_id):
        from .services import TaskLockService
        lock_service = TaskLockService()
        result = lock_service.release_lock(task_id, request.user)

        if result['success']:
            return Response(result, status=status.HTTP_200_OK)
        return Response(result, status=status.HTTP_403_FORBIDDEN)


class AviationDropdownAllAPI(APIView):
    """Return all dropdown options grouped by category.

    DEPRECATED: Use AviationDropdownListAPI with ?grouped=true instead.
    This endpoint is kept for backward compatibility.
    """
    permission_required = ViewClassPermission(
        GET=all_permissions.projects_view,
    )

    @swagger_auto_schema(
        tags=['Aviation'],
        operation_summary='Get all dropdown options (deprecated)',
        operation_description='DEPRECATED: Use /aviation/dropdowns/?grouped=true instead. Return all active dropdown options grouped by category.',
        deprecated=True,
    )
    def get(self, request):
        from collections import defaultdict

        options = AviationDropdownOption.objects.filter(
            is_active=True
        ).order_by('category', 'display_order')

        grouped = defaultdict(list)
        serializer = AviationDropdownOptionSerializer(options, many=True)

        for option_data in serializer.data:
            category = option_data['category']
            frontend_category = DROPDOWN_CATEGORY_MAPPING.get(category, category)
            grouped[frontend_category].append(option_data)

        return Response(dict(grouped), status=status.HTTP_200_OK)


class AviationTrainingMappingsAPI(APIView):
    """Get training topic mappings for dropdown options"""
    permission_required = ViewClassPermission(
        GET=all_permissions.projects_view,
    )

    @swagger_auto_schema(
        tags=['Aviation'],
        operation_summary='Get training mappings',
        operation_description='Get all training topic mappings grouped by category',
    )
    def get(self, request):
        from .models import AviationDropdownOption

        mappings = {}
        categories = ['threat', 'error', 'uas']

        for category in categories:
            options = AviationDropdownOption.objects.filter(
                category=category,
                level=3,
                is_active=True
            ).exclude(training_topics=[]).values('label', 'training_topics')

            mappings[category] = {
                opt['label']: opt['training_topics']
                for opt in options
                if opt['training_topics']
            }

        return Response(mappings, status=status.HTTP_200_OK)
