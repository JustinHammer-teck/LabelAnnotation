from datetime import datetime
from io import BytesIO

from django.db import transaction
from django.db.models import Prefetch, Q
from django.shortcuts import get_object_or_404
from openpyxl import load_workbook
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from projects.models import Project
from tasks.models import Task

from .models import (
    AviationEvent,
    AviationProject,
    LabelingItem,
    LabelingItemPerformance,
    ResultPerformance,
    TypeHierarchy,
)
from .serializers import (
    AviationEventSerializer,
    AviationProjectSerializer,
    CreateAviationProjectSerializer,
    LabelingItemPerformanceSerializer,
    LabelingItemSerializer,
    LinkItemsSerializer,
    ResultPerformanceSerializer,
    TypeHierarchySerializer,
)


class AviationProjectViewSet(viewsets.ModelViewSet):
    serializer_class = AviationProjectSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        return AviationProject.objects.filter(
            project__organization=self.request.user.active_organization
        ).select_related('project')

    def get_serializer_class(self):
        if self.action == 'create':
            return CreateAviationProjectSerializer
        return AviationProjectSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        project_id = serializer.validated_data.get('project_id')

        with transaction.atomic():
            if project_id:
                ls_project = Project.objects.filter(
                    id=project_id,
                    organization=request.user.active_organization
                ).first()
                if not ls_project:
                    raise ValidationError({'project_id': 'Project not found or not accessible'})
                if hasattr(ls_project, 'aviation_project'):
                    raise ValidationError({'project_id': 'Project already has an aviation wrapper'})
            else:
                ls_project = Project.objects.create(
                    title=serializer.validated_data['title'],
                    description=serializer.validated_data.get('description', ''),
                    organization=request.user.active_organization,
                    created_by=request.user,
                    label_config='<View></View>',
                )

            aviation_project = AviationProject.objects.create(
                project=ls_project,
                default_workflow=serializer.validated_data.get('default_workflow', ''),
                require_uas_assessment=serializer.validated_data.get('require_uas_assessment', True),
            )

        response_serializer = AviationProjectSerializer(aviation_project)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def available_projects(self, request):
        """Return LS projects that don't have an aviation wrapper yet"""
        projects = Project.objects.filter(
            organization=request.user.active_organization
        ).exclude(
            aviation_project__isnull=False
        ).values('id', 'title')
        return Response(list(projects))


class AviationEventViewSet(viewsets.ModelViewSet):
    serializer_class = AviationEventSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        queryset = AviationEvent.objects.filter(
            task__project__organization=self.request.user.active_organization
        ).select_related('task')

        project_id = self.request.query_params.get('project')
        if project_id:
            try:
                project_id = int(project_id)
                queryset = queryset.filter(task__project__aviation_project__id=project_id)
            except ValueError:
                raise ValidationError({'project': 'Must be an integer'})

        return queryset


def _get_type_hierarchy_prefetch():
    return Prefetch(
        'children',
        queryset=TypeHierarchy.objects.filter(is_active=True).order_by('display_order').prefetch_related(
            Prefetch(
                'children',
                queryset=TypeHierarchy.objects.filter(is_active=True).order_by('display_order')
            )
        )
    )


class TypeHierarchyViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = TypeHierarchySerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        queryset = TypeHierarchy.objects.filter(is_active=True).prefetch_related(
            _get_type_hierarchy_prefetch()
        )
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        return queryset.order_by('category', 'level', 'display_order')

    @action(detail=False, methods=['get'])
    def hierarchy(self, request):
        category = request.query_params.get('category')
        if not category:
            return Response(
                {'error': 'category parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        root_items = TypeHierarchy.objects.filter(
            category=category,
            level=1,
            parent__isnull=True,
            is_active=True
        ).prefetch_related(
            _get_type_hierarchy_prefetch()
        ).order_by('display_order')

        serializer = TypeHierarchySerializer(root_items, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def search(self, request):
        query = request.query_params.get('q', '')
        category = request.query_params.get('category')

        queryset = TypeHierarchy.objects.filter(is_active=True)

        if category:
            queryset = queryset.filter(category=category)

        if query:
            queryset = queryset.filter(
                Q(code__icontains=query) |
                Q(label__icontains=query) |
                Q(label_zh__icontains=query)
            )

        queryset = queryset.prefetch_related(
            _get_type_hierarchy_prefetch()
        ).order_by('category', 'level', 'display_order')[:50]
        serializer = TypeHierarchySerializer(queryset, many=True)
        return Response(serializer.data)


class LabelingItemViewSet(viewsets.ModelViewSet):
    serializer_class = LabelingItemSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        queryset = LabelingItem.objects.filter(
            event__task__project__organization=self.request.user.active_organization
        ).select_related(
            'event',
            'created_by',
            'reviewed_by',
            'linked_result',
            'threat_type_l1',
            'threat_type_l2',
            'threat_type_l3',
            'error_type_l1',
            'error_type_l2',
            'error_type_l3',
            'uas_type_l1',
            'uas_type_l2',
            'uas_type_l3',
        )

        event_id = self.request.query_params.get('event')
        if event_id:
            try:
                event_id = int(event_id)
                queryset = queryset.filter(event_id=event_id)
            except ValueError:
                raise ValidationError({'event': 'Must be an integer'})

        return queryset.order_by('event', 'sequence_number')

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class ResultPerformanceViewSet(viewsets.ModelViewSet):
    serializer_class = ResultPerformanceSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        queryset = ResultPerformance.objects.filter(
            aviation_project__project__organization=self.request.user.active_organization
        ).select_related(
            'aviation_project',
            'created_by',
            'reviewed_by',
        ).prefetch_related('labeling_items')

        project_id = self.request.query_params.get('project')
        if project_id:
            try:
                project_id = int(project_id)
                queryset = queryset.filter(aviation_project_id=project_id)
            except ValueError:
                raise ValidationError({'project': 'Must be an integer'})

        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'], url_path='link-items')
    def link_items(self, request, pk=None):
        performance = self.get_object()
        serializer = LinkItemsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user_org = request.user.active_organization
        performance_org = performance.aviation_project.project.organization
        if performance_org != user_org:
            raise ValidationError({'detail': 'ResultPerformance does not belong to your organization'})

        item_ids = serializer.validated_data['item_ids']
        contribution_weight = serializer.validated_data.get('contribution_weight', 1.00)
        notes = serializer.validated_data.get('notes', '')

        items = LabelingItem.objects.filter(
            id__in=item_ids,
            event__task__project__organization=user_org
        )

        created_links = []
        for item in items:
            link, created = LabelingItemPerformance.objects.get_or_create(
                labeling_item=item,
                result_performance=performance,
                defaults={
                    'contribution_weight': contribution_weight,
                    'notes': notes,
                }
            )
            if created:
                created_links.append(link)

        return Response(
            LabelingItemPerformanceSerializer(created_links, many=True).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['delete'], url_path='unlink-items')
    def unlink_items(self, request, pk=None):
        performance = self.get_object()

        user_org = request.user.active_organization
        performance_org = performance.aviation_project.project.organization
        if performance_org != user_org:
            return Response(
                {'error': 'Not authorized'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = LinkItemsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        item_ids = serializer.validated_data['item_ids']

        deleted_count, _ = LabelingItemPerformance.objects.filter(
            result_performance=performance,
            labeling_item_id__in=item_ids
        ).delete()

        return Response(
            {'deleted_count': deleted_count},
            status=status.HTTP_200_OK
        )


class LabelingItemPerformanceViewSet(viewsets.ModelViewSet):
    serializer_class = LabelingItemPerformanceSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        return LabelingItemPerformance.objects.filter(
            labeling_item__event__task__project__organization=self.request.user.active_organization
        ).select_related('labeling_item', 'result_performance')


EXCEL_COLUMN_MAPPING = {
    'event_number': ['event_number', 'event_id', '事件编号', '编号', '涉及航班'],
    'event_description': ['event_description', 'description', '事件描述', '描述', '事件详情/处置结果／后续措施', '事件详情'],
    'date': ['date', 'event_date', '日期', '事件日期', '事件发生时间'],
    'time': ['time', 'event_time', '时间', '事件时间'],
    'location': ['location', '地点', '位置', '报告单位'],
    'departure_airport': ['departure_airport', '起飞机场（四字代码）', '起飞机场'],
    'arrival_airport': ['arrival_airport', '降落机场（四字代码）', '降落机场'],
    'flight_phase': ['flight_phase', 'phase', '飞行阶段', '阶段', '事件类型'],
    'aircraft_type': ['aircraft_type', 'type', '机型', '飞机类型', '涉及飞机（机型/注册号）', '涉及飞机'],
    'aircraft_registration': ['aircraft_registration', 'registration', '注册号', '飞机注册号'],
    'weather_conditions': ['weather_conditions', 'weather', '天气', '天气条件', '存在威胁和发生原因', '威胁原因'],
}

REQUIRED_COLUMNS = ['event_number', 'date']


def normalize_column_name(col_name):
    if col_name is None:
        return None
    return str(col_name).strip().lower().replace(' ', '_').replace('-', '_')


def find_column_mapping(headers):
    mapping = {}
    normalized_headers = {normalize_column_name(h): idx for idx, h in enumerate(headers) if h}

    for field, aliases in EXCEL_COLUMN_MAPPING.items():
        for alias in aliases:
            normalized_alias = normalize_column_name(alias)
            if normalized_alias in normalized_headers:
                mapping[field] = normalized_headers[normalized_alias]
                break

    return mapping


def parse_date(value):
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.date()
    if hasattr(value, 'date'):
        return value.date()
    try:
        return datetime.strptime(str(value).strip(), '%Y-%m-%d').date()
    except ValueError:
        pass
    try:
        return datetime.strptime(str(value).strip(), '%Y/%m/%d').date()
    except ValueError:
        pass
    try:
        return datetime.strptime(str(value).strip(), '%d/%m/%Y').date()
    except ValueError:
        pass
    return None


def parse_time(value):
    if value is None:
        return None
    if hasattr(value, 'time') and callable(getattr(value, 'time')):
        return value.time()
    if hasattr(value, 'hour'):
        return value
    try:
        return datetime.strptime(str(value).strip(), '%H:%M:%S').time()
    except ValueError:
        pass
    try:
        return datetime.strptime(str(value).strip(), '%H:%M').time()
    except ValueError:
        pass
    return None


class AviationExcelUploadView(APIView):
    permission_classes = (IsAuthenticated,)
    parser_classes = (MultiPartParser,)

    ALLOWED_EXTENSIONS = ('.xlsx', '.xls')

    def post(self, request, pk):
        aviation_project = get_object_or_404(AviationProject, pk=pk)
        project = aviation_project.project

        if project.organization != request.user.active_organization:
            return Response(
                {'error': 'You do not have access to this project'},
                status=status.HTTP_403_FORBIDDEN
            )

        if 'file' not in request.FILES:
            return Response(
                {'error': 'No file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        uploaded_file = request.FILES['file']
        filename = uploaded_file.name.lower()

        if not filename.endswith(self.ALLOWED_EXTENSIONS):
            return Response(
                {'error': f'Invalid file type. Allowed: {", ".join(self.ALLOWED_EXTENSIONS)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            file_content = BytesIO(uploaded_file.read())
            workbook = load_workbook(filename=file_content, read_only=True, data_only=True)
            sheet = workbook.active
        except Exception as e:
            return Response(
                {'error': f'Failed to parse Excel file: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        rows = list(sheet.iter_rows(values_only=True))
        if len(rows) < 2:
            return Response(
                {'error': 'Excel file must have a header row and at least one data row'},
                status=status.HTTP_400_BAD_REQUEST
            )

        headers = rows[0]
        column_mapping = find_column_mapping(headers)

        missing_required = [col for col in REQUIRED_COLUMNS if col not in column_mapping]
        if missing_required:
            return Response(
                {'error': f'Missing required columns: {", ".join(missing_required)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        created_count = 0
        errors = []
        tasks_to_create = []
        events_to_create = []

        for row_num, row in enumerate(rows[1:], start=2):
            try:
                event_number = row[column_mapping['event_number']]
                if event_number is None or str(event_number).strip() == '':
                    errors.append({'row': row_num, 'message': 'event_number is required'})
                    continue
                event_number = str(event_number).strip()

                date_value = row[column_mapping['date']]
                parsed_date = parse_date(date_value)
                if parsed_date is None:
                    errors.append({'row': row_num, 'message': f'Invalid date format: {date_value}'})
                    continue

                event_data = {
                    'event_number': event_number,
                    'date': parsed_date,
                }

                if 'event_description' in column_mapping:
                    val = row[column_mapping['event_description']]
                    event_data['event_description'] = str(val).strip() if val else ''

                if 'time' in column_mapping:
                    event_data['time'] = parse_time(row[column_mapping['time']])

                for field in ['location', 'departure_airport', 'arrival_airport',
                              'flight_phase', 'aircraft_type',
                              'aircraft_registration', 'weather_conditions']:
                    if field in column_mapping:
                        val = row[column_mapping[field]]
                        event_data[field] = str(val).strip() if val else ''

                tasks_to_create.append({
                    'project': project,
                    'data': {'event_number': event_number},
                })
                events_to_create.append(event_data)

            except Exception as e:
                errors.append({'row': row_num, 'message': str(e)})

        if not tasks_to_create:
            return Response({
                'success': True,
                'created_count': 0,
                'first_event_id': None,
                'errors': errors
            })

        with transaction.atomic():
            created_tasks = Task.objects.bulk_create([
                Task(**task_data) for task_data in tasks_to_create
            ])

            aviation_events = []
            for task, event_data in zip(created_tasks, events_to_create):
                aviation_events.append(AviationEvent(task=task, **event_data))

            created_events = AviationEvent.objects.bulk_create(aviation_events)
            created_count = len(created_tasks)
            first_event_id = created_events[0].id if created_events else None

        workbook.close()

        return Response({
            'success': True,
            'created_count': created_count,
            'first_event_id': first_event_id,
            'errors': errors
        })
