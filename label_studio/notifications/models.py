from django.db import models
from django.utils.translation import gettext_lazy as _


class NotificationChannel():
    NOTIFICATION = 'notifications'

class NotificationEventType(models.TextChoices):
    PROJECT_ASSIGNED = 'project_assigned', _('Project Assigned')
    PROJECT_COMMENTED = 'project_commented', _('Project Task Commented')
    PROJECT_OCR_IMPORT = 'project_ocr_import', _('Project OCR Import')

""" 
TODO: Redesign the Notification send_notification implementation 
for easy sourcing action
"""
class Notification(models.Model):
    class Status(models.TextChoices):
        CREATED = 'created', _('Created')
        DISPATHED_FAILED = 'failed', _('Dispatch Failed')
        DISPATHED = 'dispatched', _('Dispatched')

    source = models.TextField(null=False)
    channel = models.CharField(max_length=255, db_index=True)
    event_type = models.CharField(max_length=64, choices=NotificationEventType.choices, null=False)
    content = models.TextField(null=False, blank=True)
    status = models.CharField(max_length=64, choices=Status.choices, default=Status.CREATED)
    is_read = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
