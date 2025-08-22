from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.utils.translation import gettext_lazy as _


class NotificationChannel():
    NOTIFICATION = 'notification'

class NotificationEventType(models.TextChoices):
    PROJECT_ASSIGNED = 'project_assigned', _('Project Assigned')
    PROJECT_COMMENTED = 'project_commented', _('Project Task Commented')


class NotificationTarget(models.Model):
    """Represents anything that can receive a notification."""

    class TargetType(models.TextChoices):
        USER = 'user', _('Platform User')

    target_type = models.CharField(max_length=64, choices=TargetType.choices)

    # Stores the unique identifier for the target.
    # For a USER, this could be the user_id.
    identifier = models.CharField(max_length=255, unique=True)

    # Optional: For linking directly to internal Django models like User
    # This allows for easy reverse lookups within Django.
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')

    def __str__(self):
        return f'{self.get_target_type_display()}: {self.identifier}'


""" 
TODO: Redesign the Notification send_notification implementation 
for easy sourcing action
"""
class Notification(models.Model):
    class Status(models.TextChoices):
        CREATED = 'created', _('Created')
        DISPATHED_FAILED = 'failed', _('Dispatch Failed')
        DISPATHED = 'dispatched', _('Dispatched')

    source = models.TextField(null=False) # The Action that trigger this Notification e.g: Permission Grant, etc.
    channel = models.CharField(max_length=255, db_index=True) # Could be long channel name
    event_type = models.CharField(max_length=64, choices=NotificationEventType.choices, null=False)
    content = models.TextField(null=False, blank=True)
    status = models.CharField(max_length=64, choices=Status.choices, default=Status.CREATED)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
