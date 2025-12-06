from django.db import models
from django.db.models import JSONField
from django.utils.translation import gettext_lazy as _
from django.utils.functional import cached_property

from .managers import AviationAnnotationManager, AviationDropdownManager


class AviationProject(models.Model):
    """Extension of base Project for aviation-specific features"""

    project = models.OneToOneField(
        'projects.Project',
        on_delete=models.CASCADE,
        related_name='aviation_project',
        help_text='Associated Label Studio project',
        db_index=True
    )

    threat_mapping = JSONField(
        default=dict,
        help_text='Threat type to training topic mappings'
    )

    error_mapping = JSONField(
        default=dict,
        help_text='Error type to training topic mappings'
    )

    uas_mapping = JSONField(
        default=dict,
        help_text='UAS type to training topic mappings'
    )

    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    class Meta:
        db_table = 'aviation_project'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['project']),
        ]

    def __str__(self):
        return f'Aviation Project for {self.project.title}'

    def has_permission(self, user):
        return self.project.has_permission(user)


class AviationIncident(models.Model):
    """Aviation safety incident data from Excel upload"""

    task = models.OneToOneField(
        'tasks.Task',
        on_delete=models.CASCADE,
        related_name='aviation_incident',
        help_text='Associated task for this incident',
        db_index=True
    )

    event_number = models.CharField(
        max_length=50,
        db_index=True,
        help_text='Unique event identifier'
    )

    event_description = models.TextField(
        help_text='Full description of the aviation incident'
    )

    date = models.DateField(
        help_text='Date when incident occurred',
        db_index=True
    )

    time = models.TimeField(
        null=True,
        blank=True,
        help_text='Time when incident occurred'
    )

    location = models.CharField(
        max_length=200,
        blank=True,
        help_text='Location where incident occurred'
    )

    airport = models.CharField(
        max_length=100,
        blank=True,
        db_index=True,
        help_text='Airport code or name'
    )

    flight_phase = models.CharField(
        max_length=100,
        blank=True,
        help_text='Phase of flight when incident occurred'
    )

    source_file = models.ForeignKey(
        'data_import.FileUpload',
        on_delete=models.SET_NULL,
        null=True,
        related_name='aviation_incidents',
        help_text='Source Excel file for this incident'
    )

    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    class Meta:
        db_table = 'aviation_incident'
        ordering = ['-date', '-created_at']
        indexes = [
            models.Index(fields=['task']),
            models.Index(fields=['event_number']),
            models.Index(fields=['date', 'airport']),
        ]

    def __str__(self):
        return f'Incident {self.event_number} - {self.date}'

    @cached_property
    def organization(self):
        """Get organization for permission checks"""
        return self.task.project.organization


class AviationAnnotation(models.Model):
    """Aviation-specific annotation data"""

    annotation = models.OneToOneField(
        'tasks.Annotation',
        on_delete=models.CASCADE,
        related_name='aviation_annotation',
        help_text='Associated annotation',
        db_index=True
    )

    aircraft_type = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        default='',
        help_text='Type of aircraft involved'
    )

    event_labels = JSONField(
        null=True,
        blank=True,
        default=list,
        help_text='Array of selected event labels'
    )

    threat_type_l1 = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        default='',
        db_index=True,
        help_text='Threat type level 1 category'
    )

    threat_type_l2 = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        default='',
        help_text='Threat type level 2 category'
    )

    threat_type_l3 = models.CharField(
        max_length=200,
        null=True,
        blank=True,
        default='',
        help_text='Threat type level 3 category'
    )

    threat_management = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        default='',
        help_text='How threat was managed'
    )

    threat_outcome = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        default='',
        help_text='Outcome of threat'
    )

    threat_description = models.TextField(
        null=True,
        blank=True,
        default='',
        help_text='Detailed threat description'
    )

    error_relevancy = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        default='',
        help_text='Relevancy of error'
    )

    error_type_l1 = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        default='',
        db_index=True,
        help_text='Error type level 1 category'
    )

    error_type_l2 = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        default='',
        help_text='Error type level 2 category'
    )

    error_type_l3 = models.CharField(
        max_length=200,
        null=True,
        blank=True,
        default='',
        help_text='Error type level 3 category'
    )

    error_management = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        default='',
        help_text='How error was managed'
    )

    error_outcome = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        default='',
        help_text='Outcome of error'
    )

    error_description = models.TextField(
        null=True,
        blank=True,
        default='',
        help_text='Detailed error description'
    )

    uas_relevancy = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        default='',
        help_text='Relevancy of UAS'
    )

    uas_type_l1 = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        default='',
        db_index=True,
        help_text='UAS type level 1 category'
    )

    uas_type_l2 = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        default='',
        help_text='UAS type level 2 category'
    )

    uas_type_l3 = models.CharField(
        max_length=200,
        null=True,
        blank=True,
        default='',
        help_text='UAS type level 3 category'
    )

    uas_management = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        default='',
        help_text='How UAS was managed'
    )

    uas_description = models.TextField(
        null=True,
        blank=True,
        default='',
        help_text='Detailed UAS description'
    )

    competency_indicators = JSONField(
        null=True,
        blank=True,
        default=list,
        help_text='Array of selected competency indicators'
    )

    threat_capability = JSONField(
        null=True,
        blank=True,
        default=list,
        help_text='Capability indicators for threat recognition'
    )

    error_capability = JSONField(
        null=True,
        blank=True,
        default=list,
        help_text='Capability indicators for error recognition'
    )

    uas_capability = JSONField(
        null=True,
        blank=True,
        default=list,
        help_text='Capability indicators for UAS recognition'
    )

    likelihood = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        default='',
        help_text='Likelihood assessment'
    )

    severity = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        default='',
        help_text='Severity assessment'
    )

    training_benefit = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        default='',
        help_text='Potential training benefit'
    )

    competency_selections = JSONField(
        null=True,
        blank=True,
        default=dict,
        help_text='Selected competency indicators grouped by competency category code'
    )

    threat_training_topics = JSONField(
        null=True,
        blank=True,
        default=list,
        help_text='Auto-calculated training topics based on threat selection'
    )

    error_training_topics = JSONField(
        null=True,
        blank=True,
        default=list,
        help_text='Auto-calculated training topics based on error selection'
    )

    uas_training_topics = JSONField(
        null=True,
        blank=True,
        default=list,
        help_text='Auto-calculated training topics based on UAS selection'
    )

    training_plan_ideas = models.TextField(
        null=True,
        blank=True,
        default='',
        help_text='Ideas for training plan'
    )

    goals_to_achieve = models.TextField(
        null=True,
        blank=True,
        default='',
        help_text='Goals to achieve with training'
    )

    notes = models.TextField(
        null=True,
        blank=True,
        default='',
        help_text='Additional notes'
    )

    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    objects = AviationAnnotationManager()

    class Meta:
        db_table = 'aviation_annotation'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['annotation']),
            models.Index(fields=['threat_type_l1', 'error_type_l1']),
            models.Index(fields=['aircraft_type']),
        ]

    def __str__(self):
        return f'Aviation Annotation {self.id} for Task {self.annotation.task_id}'

    @cached_property
    def organization(self):
        """Get organization for permission checks"""
        return self.annotation.task.project.organization

    def has_permission(self, user):
        """Check if user has permission to access this annotation"""
        return self.annotation.task.project.organization == user.active_organization


class AviationDropdownOption(models.Model):
    """Stores all dropdown options from Excel sheets"""

    category = models.CharField(
        max_length=50,
        db_index=True,
        help_text='Category: aircraft, threat, error, etc.'
    )

    level = models.IntegerField(
        default=1,
        db_index=True,
        help_text='Hierarchy level (1, 2, or 3)'
    )

    parent = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name='children',
        help_text='Parent option for hierarchical structure'
    )

    code = models.CharField(
        max_length=50,
        db_index=True,
        help_text='Option code or abbreviation'
    )

    label = models.CharField(
        max_length=200,
        help_text='Display label for option'
    )

    training_topics = JSONField(
        null=True,
        blank=True,
        default=list,
        help_text='Associated training topics for auto-calculation'
    )

    display_order = models.IntegerField(
        default=0,
        help_text='Display order within parent/level'
    )

    is_active = models.BooleanField(
        default=True,
        db_index=True,
        help_text='Whether this option is currently active'
    )

    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    objects = AviationDropdownManager()

    class Meta:
        db_table = 'aviation_dropdown_option'
        ordering = ['category', 'level', 'display_order']
        indexes = [
            models.Index(fields=['category', 'level']),
            models.Index(fields=['parent', 'display_order']),
            models.Index(fields=['category', 'is_active']),
        ]
        unique_together = [['category', 'level', 'code']]

    def __str__(self):
        return f'{self.category} - {self.label} (L{self.level})'
