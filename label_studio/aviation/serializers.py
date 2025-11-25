import os
from rest_flex_fields import FlexFieldsModelSerializer
from rest_framework import serializers
from django.db import transaction

from projects.models import Project
from .models import AviationAnnotation, AviationIncident, AviationDropdownOption


class AviationIncidentSerializer(FlexFieldsModelSerializer):
    """Serializer for aviation incident data"""

    task_id = serializers.IntegerField(read_only=True, source='task.id')
    project_id = serializers.IntegerField(read_only=True, source='task.project.id')

    class Meta:
        model = AviationIncident
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class AviationAnnotationSerializer(FlexFieldsModelSerializer):
    """Serializer for aviation annotation with auto-calculation"""

    annotation_id = serializers.IntegerField(source='annotation.id', read_only=True)
    task_id = serializers.IntegerField(source='annotation.task.id', read_only=True)

    calculated_training = serializers.SerializerMethodField(
        read_only=True,
        help_text='Combined training topics from all sources'
    )

    def get_calculated_training(self, obj):
        """Aggregate all training topics"""
        topics = set()
        if obj.threat_training_topics and isinstance(obj.threat_training_topics, list):
            topics.update(obj.threat_training_topics)
        if obj.error_training_topics and isinstance(obj.error_training_topics, list):
            topics.update(obj.error_training_topics)
        if obj.uas_training_topics and isinstance(obj.uas_training_topics, list):
            topics.update(obj.uas_training_topics)
        if obj.crm_training_topics and isinstance(obj.crm_training_topics, list):
            topics.update(obj.crm_training_topics)
        return sorted(list(topics))

    def validate(self, data):
        """Validate annotation data"""
        has_threat = any([
            data.get('threat_type_l1'),
            data.get('threat_type_l2'),
            data.get('threat_type_l3')
        ])
        has_error = any([
            data.get('error_type_l1'),
            data.get('error_type_l2'),
            data.get('error_type_l3')
        ])
        has_uas = any([
            data.get('uas_type_l1'),
            data.get('uas_type_l2'),
            data.get('uas_type_l3')
        ])

        if not (has_threat or has_error or has_uas):
            raise serializers.ValidationError(
                'At least one identification section (Threat, Error, or UAS) must be filled'
            )

        return data

    def update(self, instance, validated_data):
        """Update with auto-calculation trigger"""
        with transaction.atomic():
            instance = super().update(instance, validated_data)
        return instance

    class Meta:
        model = AviationAnnotation
        fields = '__all__'
        read_only_fields = [
            'created_at',
            'updated_at',
            'threat_training_topics',
            'error_training_topics',
            'uas_training_topics'
        ]


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
            'parent',
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
    project = serializers.PrimaryKeyRelatedField(
        queryset=Project.objects.all(),
        help_text='Target project ID'
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            self.fields['project'].queryset = Project.objects.filter(
                organization=request.user.active_organization
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
