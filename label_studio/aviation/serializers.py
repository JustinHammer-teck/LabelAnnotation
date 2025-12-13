from rest_framework import serializers

from .models import (
    AviationEvent,
    AviationProject,
    LabelingItem,
    LabelingItemPerformance,
    ResultPerformance,
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
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

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
