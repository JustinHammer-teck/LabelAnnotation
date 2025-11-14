"""This file and its contents are licensed under the Apache License 2.0. Please see the included NOTICE for copyright information and LICENSE for a copy of the license.
"""
from rest_framework import serializers
from tasks.models import Task
from tasks.serializers import AnnotationSerializer, PredictionSerializer, TaskSerializer, TaskSerializerBulk

from .models import FileUpload


class ImportApiSerializer(TaskSerializer):
    """Tasks serializer for Import API (TaskBulkCreateAPI)"""

    annotations = AnnotationSerializer(many=True, default=[])
    predictions = PredictionSerializer(many=True, default=[])

    class Meta:
        model = Task
        list_serializer_class = TaskSerializerBulk
        exclude = ('is_labeled', 'project')


class FileUploadSerializer(serializers.ModelSerializer):
    file = serializers.FileField(use_url=False)

    class Meta:
        model = FileUpload
        fields = ['id', 'file']


class FileUploadListSerializer(serializers.ModelSerializer):
    """Serializer for FileUpload list view with computed fields for file management tab"""

    file_name = serializers.SerializerMethodField()
    file_type = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    task_count = serializers.SerializerMethodField()
    project_title = serializers.SerializerMethodField()

    class Meta:
        model = FileUpload
        fields = [
            'id',
            'file_name',
            'file_type',
            'created_at',
            'status',
            'task_count',
            'project_title',
        ]

    def get_file_name(self, obj):
        """Extract file name from file path"""
        return obj.file_name

    def get_file_type(self, obj):
        """Get file extension/format"""
        return obj.format or 'unknown'

    def get_status(self, obj):
        """Get annotation status from model method"""
        return obj.get_annotation_status()

    def get_task_count(self, obj):
        """Get count of tasks associated with this upload"""
        return obj.task_count

    def get_project_title(self, obj):
        """Get project title for display"""
        return obj.project.title if obj.project else None