import os
from rest_flex_fields import FlexFieldsModelSerializer
from rest_framework import serializers
from django.db import transaction

from projects.models import Project
from .models import AviationAnnotation, AviationIncident, AviationDropdownOption, AviationProject


class AviationProjectSerializer(FlexFieldsModelSerializer):
    """Serializer for aviation project with nested project data"""

    project_id = serializers.IntegerField(source='project.id', read_only=True)
    title = serializers.CharField(source='project.title')
    description = serializers.CharField(source='project.description', required=False, allow_blank=True)
    incident_count = serializers.SerializerMethodField()
    annotation_count = serializers.SerializerMethodField()

    def get_incident_count(self, obj):
        return AviationIncident.objects.filter(task__project=obj.project).count()

    def get_annotation_count(self, obj):
        return AviationAnnotation.objects.filter(annotation__task__project=obj.project).count()

    def create(self, validated_data):
        project_data = validated_data.pop('project', {})
        request = self.context.get('request')

        with transaction.atomic():
            project = Project.objects.create(
                title=project_data.get('title', ''),
                description=project_data.get('description', ''),
                organization=request.user.active_organization,
                created_by=request.user
            )
            aviation_project = AviationProject.objects.create(
                project=project,
                threat_mapping=validated_data.get('threat_mapping', {}),
                error_mapping=validated_data.get('error_mapping', {}),
                uas_mapping=validated_data.get('uas_mapping', {})
            )
        return aviation_project

    def update(self, instance, validated_data):
        project_data = validated_data.pop('project', {})

        with transaction.atomic():
            if project_data:
                project = instance.project
                if 'title' in project_data:
                    project.title = project_data['title']
                if 'description' in project_data:
                    project.description = project_data['description']
                project.save()

            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            instance.save()

        return instance

    class Meta:
        model = AviationProject
        fields = [
            'id',
            'project_id',
            'title',
            'description',
            'threat_mapping',
            'error_mapping',
            'uas_mapping',
            'incident_count',
            'annotation_count',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'project_id', 'incident_count', 'annotation_count', 'created_at', 'updated_at']


class AviationIncidentSerializer(FlexFieldsModelSerializer):
    """Serializer for aviation incident data"""

    task_id = serializers.IntegerField(read_only=True, source='task.id')
    project_id = serializers.IntegerField(read_only=True, source='task.project.id')
    aircraft_type = serializers.SerializerMethodField()
    event_labels = serializers.SerializerMethodField()

    def get_aircraft_type(self, obj):
        return obj.task.data.get('aircraft_type', '') if obj.task else ''

    def get_event_labels(self, obj):
        return obj.task.data.get('event_labels', '') if obj.task else ''

    class Meta:
        model = AviationIncident
        fields = [
            'id',
            'task_id',
            'project_id',
            'event_number',
            'event_description',
            'date',
            'time',
            'location',
            'airport',
            'flight_phase',
            'aircraft_type',
            'event_labels',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']


class AviationAnnotationSerializer(FlexFieldsModelSerializer):
    """Serializer for aviation annotation with auto-calculation"""

    annotation_id = serializers.IntegerField(source='annotation.id', read_only=True)
    task_id = serializers.IntegerField(required=False, write_only=True)

    calculated_training = serializers.SerializerMethodField(
        read_only=True,
        help_text='Combined training topics from all sources'
    )

    threat_type = serializers.SerializerMethodField(read_only=True)
    error_type = serializers.SerializerMethodField(read_only=True)
    uas_type = serializers.SerializerMethodField(read_only=True)

    def get_calculated_training(self, obj):
        """Aggregate all training topics"""
        topics = set()
        if obj.threat_training_topics and isinstance(obj.threat_training_topics, list):
            topics.update(obj.threat_training_topics)
        if obj.error_training_topics and isinstance(obj.error_training_topics, list):
            topics.update(obj.error_training_topics)
        if obj.uas_training_topics and isinstance(obj.uas_training_topics, list):
            topics.update(obj.uas_training_topics)
        if obj.competency_selections:
            if isinstance(obj.competency_selections, dict):
                for category_topics in obj.competency_selections.values():
                    if isinstance(category_topics, list):
                        topics.update(category_topics)
            elif isinstance(obj.competency_selections, list):
                topics.update(obj.competency_selections)
        return sorted(list(topics))

    def _get_type_hierarchy(self, obj, prefix):
        """Get hierarchical type levels for a given prefix (threat, error, uas)."""
        return {
            'level1': getattr(obj, f'{prefix}_type_l1', '') or '',
            'level2': getattr(obj, f'{prefix}_type_l2', '') or '',
            'level3': getattr(obj, f'{prefix}_type_l3', '') or '',
        }

    def get_threat_type(self, obj):
        return self._get_type_hierarchy(obj, 'threat')

    def get_error_type(self, obj):
        return self._get_type_hierarchy(obj, 'error')

    def get_uas_type(self, obj):
        return self._get_type_hierarchy(obj, 'uas')

    def validate(self, data):
        """Validate annotation data - allow empty drafts for auto-save"""
        return data

    def _extract_hierarchical_fields(self, validated_data):
        """Extract nested hierarchical types to flat fields.

        Handles both string codes and DropdownOption objects for backwards compatibility.
        """
        level_mapping = {'level1': 'l1', 'level2': 'l2', 'level3': 'l3'}
        for type_name in ['threat_type', 'error_type', 'uas_type']:
            nested = validated_data.pop(type_name, None)
            if nested and isinstance(nested, dict):
                for level_key, field_suffix in level_mapping.items():
                    level_val = nested.get(level_key)
                    if isinstance(level_val, dict):
                        validated_data[f'{type_name}_{field_suffix}'] = level_val.get('code') or ''
                    else:
                        validated_data[f'{type_name}_{field_suffix}'] = level_val or ''
        return validated_data

    def to_internal_value(self, data):
        """Handle nested type objects in input"""
        internal = super().to_internal_value(data)
        for type_name in ['threat_type', 'error_type', 'uas_type']:
            if type_name in data and isinstance(data[type_name], dict):
                internal[type_name] = data[type_name]
        return internal

    def to_representation(self, instance):
        """Normalize competency_selections to dict format on read"""
        data = super().to_representation(instance)
        cs = data.get('competency_selections')
        if cs is None or not isinstance(cs, dict):
            data['competency_selections'] = {}
        return data

    def create(self, validated_data):
        """Create with auto-calculation trigger"""
        validated_data.pop('task_id', None)
        validated_data = self._extract_hierarchical_fields(validated_data)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        """Update with auto-calculation trigger"""
        validated_data.pop('task_id', None)
        validated_data = self._extract_hierarchical_fields(validated_data)
        instance = super().update(instance, validated_data)
        return instance

    class Meta:
        model = AviationAnnotation
        fields = '__all__'
        read_only_fields = [
            'created_at',
            'updated_at',
            'annotation'
        ]
        extra_kwargs = {
            'threat_type_l1': {'write_only': True},
            'threat_type_l2': {'write_only': True},
            'threat_type_l3': {'write_only': True},
            'error_type_l1': {'write_only': True},
            'error_type_l2': {'write_only': True},
            'error_type_l3': {'write_only': True},
            'uas_type_l1': {'write_only': True},
            'uas_type_l2': {'write_only': True},
            'uas_type_l3': {'write_only': True},
        }


class AviationDropdownOptionSerializer(serializers.ModelSerializer):
    """Serializer for dropdown options"""

    has_children = serializers.SerializerMethodField()
    parent_label = serializers.SerializerMethodField()

    def get_has_children(self, obj):
        return obj.children.exists()

    def get_parent_label(self, obj):
        return obj.parent.label if obj.parent else None

    class Meta:
        model = AviationDropdownOption
        fields = [
            'id',
            'category',
            'level',
            'parent_id',
            'parent_label',
            'code',
            'label',
            'training_topics',
            'display_order',
            'is_active',
            'has_children'
        ]


class ExcelUploadSerializer(serializers.Serializer):
    """Serializer for Excel file upload"""

    file = serializers.FileField(
        help_text='Excel file containing aviation incidents'
    )

    def validate_file(self, value):
        """Validate file is Excel format"""
        valid_extensions = ['.xlsx', '.xls']
        ext = os.path.splitext(value.name)[1].lower()

        if ext not in valid_extensions:
            raise serializers.ValidationError(
                f'Invalid file format. Expected {", ".join(valid_extensions)}'
            )

        if value.size > 50 * 1024 * 1024:
            raise serializers.ValidationError(
                'File size too large. Maximum size is 50MB'
            )

        return value
