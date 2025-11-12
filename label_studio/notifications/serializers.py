import json
from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    subject = serializers.SerializerMethodField()
    message = serializers.SerializerMethodField()
    message_time = serializers.SerializerMethodField()
    path = serializers.SerializerMethodField()
    action_type = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = ['id', 'event_type', 'subject', 'message', 'message_time', 'path', 'action_type', 'is_read', 'created_at']
        read_only_fields = ['id', 'event_type', 'subject', 'message', 'message_time', 'path', 'action_type', 'created_at']

    def get_subject(self, obj):
        try:
            content = json.loads(obj.content)
            return content.get('subject', '')
        except (json.JSONDecodeError, AttributeError):
            return ''

    def get_message(self, obj):
        try:
            content = json.loads(obj.content)
            return content.get('message', '')
        except (json.JSONDecodeError, AttributeError):
            return ''

    def get_message_time(self, obj):
        try:
            content = json.loads(obj.content)
            return content.get('message_time', obj.created_at.timestamp())
        except (json.JSONDecodeError, AttributeError):
            return obj.created_at.timestamp()

    def get_path(self, obj):
        try:
            content = json.loads(obj.content)
            return content.get('path', None)
        except (json.JSONDecodeError, AttributeError):
            return None

    def get_action_type(self, obj):
        try:
            content = json.loads(obj.content)
            return content.get('action_type', None)
        except (json.JSONDecodeError, AttributeError):
            return None