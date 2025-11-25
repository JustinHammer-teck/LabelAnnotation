import logging
import os
from pathlib import Path

from rest_framework.views import APIView
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.pagination import PageNumberPagination
from django.http import FileResponse
from django.utils.decorators import method_decorator
from django.db import transaction
from django.db.models import Q
from django.core.validators import validate_unicode_slug

from core.permissions import ViewClassPermission, all_permissions
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from projects.models import Project

from .models import AviationAnnotation, AviationDropdownOption
from .serializers import (
    AviationAnnotationSerializer,
    AviationDropdownOptionSerializer,
    ExcelUploadSerializer
)

logger = logging.getLogger(__name__)


class AviationDropdownPagination(PageNumberPagination):
    page_size = 100
    page_size_query_param = 'page_size'
    max_page_size = 1000


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
            incidents = parser.parse_incidents(serializer.validated_data['file'], project)
            return Response({
                'created_tasks': len(incidents) if incidents else 0,
                'project_id': project.id
            }, status=status.HTTP_201_CREATED)
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
        from .services import ExcelParserService
        parser = ExcelParserService()

        file = request.FILES.get('file')
        if not file:
            return Response({'error': 'File parameter is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            validation_result = parser.validate_structure(file)
            return Response(validation_result or {'valid': True}, status=status.HTTP_200_OK)
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
        return AviationAnnotation.objects.filter(
            annotation__task__project__organization=self.request.user.active_organization
        ).select_related(
            'annotation',
            'annotation__task',
            'annotation__task__project'
        ).prefetch_related(
            'annotation__task__project__organization'
        )

    def perform_create(self, serializer):
        from .services import TrainingCalculationService
        calculator = TrainingCalculationService()

        with transaction.atomic():
            instance = serializer.save()
            try:
                calculator.calculate_and_update(instance)
            except NotImplementedError:
                pass


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
        return AviationAnnotation.objects.filter(
            annotation__task__project__organization=self.request.user.active_organization
        ).select_related(
            'annotation',
            'annotation__task',
            'annotation__task__project'
        )

    def perform_update(self, serializer):
        from .services import TrainingCalculationService
        calculator = TrainingCalculationService()

        with transaction.atomic():
            instance = serializer.save()
            try:
                calculator.calculate_and_update(instance)
            except NotImplementedError:
                pass


@method_decorator(
    name='get',
    decorator=swagger_auto_schema(
        tags=['Aviation'],
        operation_summary='List dropdown options',
        operation_description='Get dropdown options filtered by category, level, or parent',
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
        ],
    )
)
class AviationDropdownListAPI(generics.ListAPIView):
    """Provide dropdown options to frontend"""
    serializer_class = AviationDropdownOptionSerializer
    pagination_class = AviationDropdownPagination
    permission_required = ViewClassPermission(
        GET=all_permissions.projects_view,
    )

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

        file_path = Path(file_path).resolve()
        allowed_base = Path('/tmp').resolve()

        if not str(file_path).startswith(str(allowed_base)):
            logger.error(f"Path traversal attempt: {file_path}")
            return Response(
                {'error': 'Invalid file path'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            response = FileResponse(
                open(file_path, 'rb'),
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                as_attachment=True,
                filename=f'aviation_export_{project_id}.xlsx'
            )
            return response
        except FileNotFoundError:
            logger.error(f"Export file not found: {file_path}")
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

        file_path = Path(file_path).resolve()
        allowed_base = Path('/tmp').resolve()

        if not str(file_path).startswith(str(allowed_base)):
            logger.error(f"Path traversal attempt: {file_path}")
            return Response(
                {'error': 'Invalid file path'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            response = FileResponse(
                open(file_path, 'rb'),
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                as_attachment=True,
                filename='aviation_template.xlsx'
            )
            return response
        except FileNotFoundError:
            logger.error(f"Template file not found: {file_path}")
            return Response(
                {'error': 'Template file not found'},
                status=status.HTTP_404_NOT_FOUND
            )
