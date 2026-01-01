from rest_framework import serializers

from .models import (
    AviationEvent,
    AviationProject,
    FieldFeedback,
    LabelingItem,
    LabelingItemPerformance,
    ResultPerformance,
    ReviewDecision,
    TypeHierarchy,
)


class TypeHierarchyMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = TypeHierarchy
        fields = ['id', 'code', 'label']


class TypeHierarchySerializer(serializers.ModelSerializer):
    parent_id = serializers.IntegerField(source='parent.id', read_only=True, allow_null=True)
    children = serializers.SerializerMethodField()

    class Meta:
        model = TypeHierarchy
        fields = [
            'id',
            'category',
            'level',
            'parent_id',
            'code',
            'label',
            'label_zh',
            'training_topics',
            'is_active',
            'children',
        ]

    def get_children(self, obj):
        children = obj.children.filter(is_active=True).order_by('display_order')
        return TypeHierarchySerializer(children, many=True).data


class ProjectNestedSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    title = serializers.CharField(read_only=True)


class AviationProjectSerializer(serializers.ModelSerializer):
    project = ProjectNestedSerializer(read_only=True)
    project_id = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = AviationProject
        fields = [
            'id',
            'project',
            'project_id',
            'threat_mapping',
            'error_mapping',
            'uas_mapping',
            'default_workflow',
            'require_uas_assessment',
            'auto_calculate_training',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class TaskNestedSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)


class AviationEventSerializer(serializers.ModelSerializer):
    task = TaskNestedSerializer(read_only=True)
    task_id = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = AviationEvent
        fields = [
            'id',
            'task',
            'task_id',
            'event_number',
            'event_description',
            'date',
            'time',
            'location',
            'airport',
            'departure_airport',
            'arrival_airport',
            'actual_landing_airport',
            'flight_phase',
            'aircraft_type',
            'aircraft_registration',
            'crew_composition',
            'weather_conditions',
            'file_upload',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'file_upload', 'created_at', 'updated_at']


class LabelingItemSerializer(serializers.ModelSerializer):
    threat_type_l1_detail = TypeHierarchyMinimalSerializer(source='threat_type_l1', read_only=True)
    threat_type_l2_detail = TypeHierarchyMinimalSerializer(source='threat_type_l2', read_only=True)
    threat_type_l3_detail = TypeHierarchyMinimalSerializer(source='threat_type_l3', read_only=True)
    error_type_l1_detail = TypeHierarchyMinimalSerializer(source='error_type_l1', read_only=True)
    error_type_l2_detail = TypeHierarchyMinimalSerializer(source='error_type_l2', read_only=True)
    error_type_l3_detail = TypeHierarchyMinimalSerializer(source='error_type_l3', read_only=True)
    uas_type_l1_detail = TypeHierarchyMinimalSerializer(source='uas_type_l1', read_only=True)
    uas_type_l2_detail = TypeHierarchyMinimalSerializer(source='uas_type_l2', read_only=True)
    uas_type_l3_detail = TypeHierarchyMinimalSerializer(source='uas_type_l3', read_only=True)
    linked_result_id = serializers.PrimaryKeyRelatedField(
        source='linked_result',
        queryset=ResultPerformance.objects.all(),
        allow_null=True,
        required=False
    )

    class Meta:
        model = LabelingItem
        fields = [
            'id',
            'event',
            'created_by',
            'sequence_number',
            'status',
            'threat_type_l1',
            'threat_type_l1_detail',
            'threat_type_l2',
            'threat_type_l2_detail',
            'threat_type_l3',
            'threat_type_l3_detail',
            'threat_management',
            'threat_impact',
            'threat_coping_abilities',
            'threat_description',
            'error_type_l1',
            'error_type_l1_detail',
            'error_type_l2',
            'error_type_l2_detail',
            'error_type_l3',
            'error_type_l3_detail',
            'error_relevance',
            'error_management',
            'error_impact',
            'error_coping_abilities',
            'error_description',
            'uas_applicable',
            'uas_relevance',
            'uas_type_l1',
            'uas_type_l1_detail',
            'uas_type_l2',
            'uas_type_l2_detail',
            'uas_type_l3',
            'uas_type_l3_detail',
            'uas_management',
            'uas_impact',
            'uas_coping_abilities',
            'uas_description',
            'calculated_threat_topics',
            'calculated_error_topics',
            'calculated_uas_topics',
            'notes',
            'linked_result_id',
            'reviewed_by',
            'reviewed_at',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'created_by',
            'calculated_threat_topics',
            'calculated_error_topics',
            'calculated_uas_topics',
            'created_at',
            'updated_at',
        ]

    VALID_ERROR_RELEVANCE = {'', '来源于威胁'}
    VALID_UAS_RELEVANCE = {'', '来源于威胁', '来源于差错'}

    def validate_error_relevance(self, value):
        if value and value not in self.VALID_ERROR_RELEVANCE:
            raise serializers.ValidationError(
                f'Invalid error_relevance value. Must be one of: {self.VALID_ERROR_RELEVANCE}'
            )
        return value

    def validate_uas_relevance(self, value):
        if value and value not in self.VALID_UAS_RELEVANCE:
            raise serializers.ValidationError(
                f'Invalid uas_relevance value. Must be one of: {self.VALID_UAS_RELEVANCE}'
            )
        return value


class LabelingItemPerformanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = LabelingItemPerformance
        fields = [
            'id',
            'labeling_item',
            'result_performance',
            'contribution_weight',
            'notes',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class ResultPerformanceSerializer(serializers.ModelSerializer):
    linked_items = serializers.SerializerMethodField()
    threat_summary = serializers.SerializerMethodField()
    error_summary = serializers.SerializerMethodField()
    competency_summary = serializers.SerializerMethodField()

    class Meta:
        model = ResultPerformance
        fields = [
            'id',
            'aviation_project',
            'event',
            'event_type',
            'flight_phase',
            'likelihood',
            'severity',
            'training_effect',
            'training_plan',
            'training_topics',
            'training_goals',
            'objectives',
            'recommendations',
            'created_by',
            'reviewed_by',
            'status',
            'linked_items',
            'threat_summary',
            'error_summary',
            'competency_summary',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_by', 'aviation_project', 'created_at', 'updated_at']

    def get_linked_items(self, obj):
        return list(obj.linked_labeling_items.values_list('id', flat=True))

    def get_threat_summary(self, obj):
        linked_items = obj.linked_labeling_items.select_related(
            'threat_type_l3', 'threat_type_l2', 'threat_type_l1'
        ).all()
        tags = set()
        for item in linked_items:
            type_obj = item.threat_type_l3 or item.threat_type_l2 or item.threat_type_l1
            if type_obj:
                tags.add(type_obj.label_zh or type_obj.label)
        return '; '.join(sorted(tags)) if tags else ''

    def get_error_summary(self, obj):
        linked_items = obj.linked_labeling_items.select_related(
            'error_type_l3', 'error_type_l2', 'error_type_l1'
        ).all()
        tags = set()
        for item in linked_items:
            type_obj = item.error_type_l3 or item.error_type_l2 or item.error_type_l1
            if type_obj:
                tags.add(type_obj.label_zh or type_obj.label)
        return '; '.join(sorted(tags)) if tags else ''

    def get_competency_summary(self, obj):
        linked_items = obj.linked_labeling_items.all()
        abilities = set()
        for item in linked_items:
            for field in ['threat_coping_abilities', 'error_coping_abilities', 'uas_coping_abilities']:
                coping = getattr(item, field, None)
                if coping and isinstance(coping, dict):
                    values = coping.get('values', [])
                    if isinstance(values, list):
                        abilities.update(v for v in values if v)
        return '; '.join(sorted(abilities)) if abilities else ''


class LinkItemsSerializer(serializers.Serializer):
    item_ids = serializers.ListField(
        child=serializers.IntegerField(),
        allow_empty=False
    )
    contribution_weight = serializers.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=1.00,
        required=False
    )
    notes = serializers.CharField(required=False, allow_blank=True, default='')


class CreateAviationProjectSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=500, required=False)
    description = serializers.CharField(required=False, allow_blank=True, default='')
    project_id = serializers.IntegerField(required=False)
    default_workflow = serializers.CharField(required=False, allow_blank=True, default='')
    require_uas_assessment = serializers.BooleanField(required=False, default=True)

    def validate(self, data):
        title = data.get('title')
        project_id = data.get('project_id')
        if not title and not project_id:
            raise serializers.ValidationError('Either title or project_id is required')
        if title and project_id:
            raise serializers.ValidationError('Provide either title or project_id, not both')
        return data


# =============================================================================
# Review System Serializers
# =============================================================================


class FieldFeedbackInputSerializer(serializers.Serializer):
    """Input serializer for field feedback in review requests."""
    field_name = serializers.CharField(
        max_length=50,
        help_text='Name of the field being reviewed (e.g., threat_type_l1, error_management)'
    )
    feedback_type = serializers.ChoiceField(
        choices=['partial', 'full', 'revision'],
        help_text='Type of feedback: partial, full, or revision'
    )
    feedback_comment = serializers.CharField(
        required=False,
        allow_blank=True,
        default='',
        help_text='Detailed feedback explaining the issue with this field'
    )


class FieldFeedbackSerializer(serializers.ModelSerializer):
    """Serializer for FieldFeedback model output."""
    class Meta:
        model = FieldFeedback
        fields = [
            'id',
            'field_name',
            'feedback_type',
            'feedback_comment',
            'reviewed_by',
            'reviewed_at',
        ]
        read_only_fields = ['id', 'reviewed_by', 'reviewed_at']


class ReviewDecisionSerializer(serializers.ModelSerializer):
    """Serializer for ReviewDecision model output."""
    field_feedbacks = FieldFeedbackSerializer(many=True, read_only=True)
    reviewer_email = serializers.EmailField(source='reviewer.email', read_only=True)

    class Meta:
        model = ReviewDecision
        fields = [
            'id',
            'labeling_item',
            'status',
            'reviewer',
            'reviewer_email',
            'reviewer_comment',
            'field_feedbacks',
            'created_at',
        ]
        read_only_fields = ['id', 'labeling_item', 'reviewer', 'created_at']


class ApproveRequestSerializer(serializers.Serializer):
    """Request serializer for approving a labeling item."""
    comment = serializers.CharField(
        required=False,
        allow_blank=True,
        default='',
        help_text='Optional comment from the reviewer'
    )


class RejectRequestSerializer(serializers.Serializer):
    """Request serializer for rejecting a labeling item."""
    status = serializers.ChoiceField(
        choices=['rejected_partial', 'rejected_full'],
        help_text='Rejection type: rejected_partial or rejected_full'
    )
    comment = serializers.CharField(
        required=False,
        allow_blank=True,
        default='',
        help_text='Overall comment from the reviewer'
    )
    field_feedbacks = FieldFeedbackInputSerializer(
        many=True,
        help_text='List of field-specific feedback'
    )

    def validate_field_feedbacks(self, value):
        if not value or len(value) == 0:
            raise serializers.ValidationError(
                'At least one field_feedback is required for rejection'
            )
        return value


class RevisionRequestSerializer(serializers.Serializer):
    """Request serializer for requesting revision of a labeling item."""
    comment = serializers.CharField(
        required=False,
        allow_blank=True,
        default='',
        help_text='Overall comment from the reviewer'
    )
    field_feedbacks = FieldFeedbackInputSerializer(
        many=True,
        help_text='List of field-specific revision requests'
    )

    def validate_field_feedbacks(self, value):
        if not value or len(value) == 0:
            raise serializers.ValidationError(
                'At least one field_feedback is required for revision request'
            )
        return value


class ResubmitRequestSerializer(serializers.Serializer):
    """Request serializer for resubmitting a labeling item."""
    comment = serializers.CharField(
        required=False,
        allow_blank=True,
        default='',
        help_text='Optional comment explaining changes made'
    )


class ReviewHistoryResponseSerializer(serializers.Serializer):
    """Response serializer for review history endpoint."""
    current_status = serializers.CharField(
        help_text='Current status of the labeling item'
    )
    pending_revision_fields = serializers.ListField(
        child=serializers.CharField(),
        help_text='List of field names with pending revision requests'
    )
    decisions = ReviewDecisionSerializer(
        many=True,
        help_text='List of all review decisions for this item'
    )


# =============================================================================
# Assignment Serializers
# =============================================================================


class AviationProjectUserPermissionSerializer(serializers.Serializer):
    """
    Serializes a User with a dynamic 'has_permission' field for assignment status.

    Requires 'aviation_project' to be passed in the serializer context.
    Example:
    context = {
        'aviation_project': aviation_project_instance,
    }
    """
    user_id = serializers.IntegerField(source='id', read_only=True)
    user_email = serializers.EmailField(source='email', read_only=True)
    has_permission = serializers.SerializerMethodField()

    def get_has_permission(self, user_obj):
        """
        Checks if the user has the assigned_to_aviation_project permission.
        """
        aviation_project = self.context.get('aviation_project')
        if not aviation_project:
            return False
        return user_obj.has_perm('aviation.assigned_to_aviation_project', aviation_project)


class AviationAssignmentToggleSerializer(serializers.Serializer):
    """
    Serializer for toggling user assignments to an AviationProject.

    Expects a list of user assignment changes:
    {
        "users": [
            {"user_id": 1, "has_permission": true},
            {"user_id": 2, "has_permission": false}
        ]
    }
    """
    users = serializers.ListField(
        child=serializers.DictField(),
        help_text='List of user assignment changes with user_id and has_permission'
    )


# =============================================================================
# Analytics Serializers
# =============================================================================


class EventsByStatusSerializer(serializers.Serializer):
    """Serializer for events by status breakdown."""
    in_progress = serializers.IntegerField(read_only=True)
    completed = serializers.IntegerField(read_only=True)


class LabelingItemsByStatusSerializer(serializers.Serializer):
    """Serializer for labeling items by status breakdown."""
    draft = serializers.IntegerField(read_only=True)
    submitted = serializers.IntegerField(read_only=True)
    reviewed = serializers.IntegerField(read_only=True)
    approved = serializers.IntegerField(read_only=True)


class LabelingItemsAnalyticsSerializer(serializers.Serializer):
    """Serializer for labeling items analytics."""
    total = serializers.IntegerField(read_only=True)
    by_status = LabelingItemsByStatusSerializer(read_only=True)


class AviationProjectAnalyticsSerializer(serializers.Serializer):
    """
    Serializer for aviation project analytics response.

    Read-only serializer that formats analytics data for API responses.
    Does not create or update any models.

    Response structure:
    {
        "project_id": 1,
        "project_type": "aviation",
        "total_events": 10,
        "events_by_status": {
            "in_progress": 3,
            "completed": 7
        },
        "labeling_items": {
            "total": 25,
            "by_status": {
                "draft": 5,
                "submitted": 3,
                "reviewed": 2,
                "approved": 15
            }
        }
    }
    """
    project_id = serializers.IntegerField(
        read_only=True,
        help_text='Aviation project ID'
    )
    project_type = serializers.CharField(
        read_only=True,
        help_text='Project type (always "aviation" for this endpoint)'
    )
    total_events = serializers.IntegerField(
        read_only=True,
        help_text='Total number of events in the project'
    )
    events_by_status = EventsByStatusSerializer(
        read_only=True,
        help_text='Event completion status breakdown'
    )
    labeling_items = LabelingItemsAnalyticsSerializer(
        read_only=True,
        help_text='Labeling items analytics with status breakdown'
    )


# =============================================================================
# Events Analytics Serializers (Phase 2)
# =============================================================================


class AnalyticsBasicInfoSerializer(serializers.Serializer):
    """
    Serializer for event basic information with Chinese field names.

    Maps AviationEvent fields to Chinese labels expected by the frontend.
    Used for the '基本信息' section of the analytics response.
    """
    事件编号 = serializers.CharField(source='event_number')
    日期 = serializers.DateField(source='date', format='%Y-%m-%d')
    时间 = serializers.TimeField(source='time', format='%H:%M:%S', allow_null=True)
    机型 = serializers.CharField(source='aircraft_type', allow_blank=True)
    起飞机场 = serializers.CharField(source='departure_airport', allow_blank=True)
    落地机场 = serializers.CharField(source='arrival_airport', allow_blank=True)
    实际降落 = serializers.CharField(source='actual_landing_airport', allow_blank=True)
    报告单位 = serializers.CharField(source='location', allow_blank=True)
    备注 = serializers.CharField(source='weather_conditions', allow_blank=True)


class AnalyticsResultPerformanceSerializer(serializers.Serializer):
    """
    Serializer for result performance with Chinese field names.

    Used for the '结果绩效列表' section of the analytics response.
    """
    id = serializers.IntegerField()
    事件类型 = serializers.CharField(source='event_type', allow_blank=True)
    飞行阶段 = serializers.CharField(source='flight_phase', allow_blank=True)
    可能性 = serializers.CharField(source='likelihood', allow_blank=True)
    严重程度 = serializers.CharField(source='severity', allow_blank=True)
    训练效果 = serializers.CharField(source='training_effect', allow_blank=True)
    训练方案设想 = serializers.CharField(source='training_plan', allow_blank=True)
    训练主题 = serializers.JSONField(source='training_topics')
    所需达到的目标 = serializers.CharField(source='training_goals', allow_blank=True)


class AnalyticsHierarchyListSerializer(serializers.Serializer):
    """
    Serializer for hierarchy type list (threat/error/UAS).

    Serializes the three-level hierarchy with management, impact, and coping abilities.
    """
    level1 = serializers.SerializerMethodField()
    level2 = serializers.SerializerMethodField()
    level3 = serializers.SerializerMethodField()
    管理 = serializers.JSONField()
    影响 = serializers.JSONField()
    应对能力 = serializers.JSONField()
    描述 = serializers.CharField(allow_blank=True)

    def __init__(self, *args, prefix='threat', **kwargs):
        """
        Initialize with hierarchy prefix.

        Args:
            prefix: One of 'threat', 'error', or 'uas'
        """
        self.prefix = prefix
        super().__init__(*args, **kwargs)

    def get_level1(self, obj):
        type_obj = getattr(obj, f'{self.prefix}_type_l1', None)
        if type_obj:
            return type_obj.label_zh or type_obj.label
        return None

    def get_level2(self, obj):
        type_obj = getattr(obj, f'{self.prefix}_type_l2', None)
        if type_obj:
            return type_obj.label_zh or type_obj.label
        return None

    def get_level3(self, obj):
        type_obj = getattr(obj, f'{self.prefix}_type_l3', None)
        if type_obj:
            return type_obj.label_zh or type_obj.label
        return None

    def to_representation(self, instance):
        """Build representation for hierarchy list."""
        return {
            'level1': self.get_level1(instance),
            'level2': self.get_level2(instance),
            'level3': self.get_level3(instance),
            '管理': getattr(instance, f'{self.prefix}_management', {}),
            '影响': getattr(instance, f'{self.prefix}_impact', {}),
            '应对能力': getattr(instance, f'{self.prefix}_coping_abilities', {}),
            '描述': getattr(instance, f'{self.prefix}_description', ''),
        }


class AnalyticsLabelingItemSerializer(serializers.Serializer):
    """
    Serializer for labeling items with Chinese field names.

    Used for the '标签标注列表' section of the analytics response.
    """
    id = serializers.IntegerField()
    关联事件类型ID = serializers.SerializerMethodField()
    威胁列表 = serializers.SerializerMethodField()
    差错列表 = serializers.SerializerMethodField()
    UAS列表 = serializers.SerializerMethodField()
    结束状态描述 = serializers.CharField(source='notes', allow_blank=True)

    def get_关联事件类型ID(self, obj):
        """Get linked result performance ID."""
        if obj.linked_result:
            return obj.linked_result_id
        return None

    def get_威胁列表(self, obj):
        """Serialize threat hierarchy list."""
        serializer = AnalyticsHierarchyListSerializer(obj, prefix='threat')
        return serializer.data

    def get_差错列表(self, obj):
        """Serialize error hierarchy list."""
        serializer = AnalyticsHierarchyListSerializer(obj, prefix='error')
        return serializer.data

    def get_UAS列表(self, obj):
        """Serialize UAS hierarchy list."""
        serializer = AnalyticsHierarchyListSerializer(obj, prefix='uas')
        return serializer.data


class AnalyticsEventSerializer(serializers.Serializer):
    """
    Serializer for aviation events in analytics response.

    Provides the full event structure with nested labeling items and
    result performances, using Chinese field names for frontend compatibility.
    """
    eventId = serializers.CharField(source='event_number')
    基本信息 = AnalyticsBasicInfoSerializer(source='*')
    事件描述 = serializers.CharField(source='event_description', allow_blank=True)
    结果绩效列表 = serializers.SerializerMethodField()
    标签标注列表 = serializers.SerializerMethodField()

    def get_结果绩效列表(self, obj):
        """Serialize nested result performances."""
        return AnalyticsResultPerformanceSerializer(
            obj.result_performances.all(), many=True
        ).data

    def get_标签标注列表(self, obj):
        """Serialize nested labeling items."""
        return AnalyticsLabelingItemSerializer(
            obj.labeling_items.all(), many=True
        ).data


# =============================================================================
# Filter Options Serializers (Phase 1 - Filter Integration)
# =============================================================================


class FilterOptionsSerializer(serializers.Serializer):
    """
    Serializer for filter options arrays.

    Returns distinct filter option values for analytics dashboard dropdowns:
    - aircraft: Aircraft types from events
    - airports: Airport codes (departure/arrival/actual_landing merged)
    - eventTypes: Event types from result performances
    - flightPhases: Flight phases from events
    - trainingTopics: Training topics from result performances (flattened from JSONField arrays)

    All arrays are returned sorted alphabetically with duplicates removed.
    """
    aircraft = serializers.ListField(
        child=serializers.CharField(),
        help_text='Distinct aircraft types from events'
    )
    airports = serializers.ListField(
        child=serializers.CharField(),
        help_text='Distinct airport codes from departure/arrival/actual_landing fields'
    )
    eventTypes = serializers.ListField(
        child=serializers.CharField(),
        help_text='Distinct event types from result performances'
    )
    flightPhases = serializers.ListField(
        child=serializers.CharField(),
        help_text='Distinct flight phases from events'
    )
    trainingTopics = serializers.ListField(
        child=serializers.CharField(),
        help_text='Distinct training topics from result performances (flattened from arrays)'
    )
