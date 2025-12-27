from django.conf import settings
from django.db import models


class AviationProject(models.Model):
    project = models.OneToOneField(
        'projects.Project',
        on_delete=models.CASCADE,
        related_name='aviation_project'
    )
    threat_mapping = models.JSONField(default=dict, blank=True)
    error_mapping = models.JSONField(default=dict, blank=True)
    uas_mapping = models.JSONField(default=dict, blank=True)
    default_workflow = models.CharField(max_length=50, blank=True, default='')
    require_uas_assessment = models.BooleanField(default=True)
    auto_calculate_training = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'aviation_project'

    def __str__(self):
        return f'AviationProject({self.project_id})'

    def has_permission(self, user):
        return self.project.has_permission(user)


class AviationEvent(models.Model):
    task = models.OneToOneField(
        'tasks.Task',
        on_delete=models.CASCADE,
        related_name='aviation_event'
    )
    event_number = models.CharField(max_length=50, db_index=True)
    event_description = models.TextField(blank=True, default='')
    date = models.DateField(db_index=True)
    time = models.TimeField(null=True, blank=True)
    location = models.CharField(max_length=255, blank=True, default='')
    airport = models.CharField(max_length=255, blank=True, default='')
    departure_airport = models.CharField(max_length=255, blank=True, default='')
    arrival_airport = models.CharField(max_length=255, blank=True, default='')
    actual_landing_airport = models.CharField(max_length=255, blank=True, default='')
    flight_phase = models.CharField(max_length=100, blank=True, default='')
    aircraft_registration = models.CharField(max_length=50, blank=True, default='')
    aircraft_type = models.CharField(max_length=100, blank=True, default='')
    crew_composition = models.JSONField(default=dict, blank=True)
    weather_conditions = models.CharField(max_length=255, blank=True, default='')
    file_upload = models.ForeignKey(
        'data_import.FileUpload',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='aviation_events'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'aviation_event'

    def __str__(self):
        return f'AviationEvent({self.event_number})'


class TypeHierarchy(models.Model):
    CATEGORY_CHOICES = [
        ('threat', 'Threat'),
        ('error', 'Error'),
        ('uas', 'UAS'),
        ('flight_phase', 'Flight Phase'),
        ('management', 'Management'),
        ('impact', 'Impact'),
        ('coping', 'Coping'),
        ('severity', 'Severity'),
        ('airport', 'Airport'),
        ('event_type', 'Event Type'),
        ('likelihood', 'Likelihood'),
        ('training_effect', 'Training Effect'),
        ('training_topics', 'Training Topics'),
    ]

    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    level = models.PositiveSmallIntegerField()
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='children'
    )
    code = models.CharField(max_length=50)
    label = models.CharField(max_length=255)
    label_zh = models.CharField(max_length=255, blank=True, default='')
    training_topics = models.JSONField(default=list, blank=True)
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'aviation_type_hierarchy'
        unique_together = [('category', 'level', 'code')]
        ordering = ['category', 'level', 'display_order']

    def __str__(self):
        return f'{self.category}:{self.code}'


class LabelingItem(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('reviewed', 'Reviewed'),
        ('approved', 'Approved'),
    ]

    event = models.ForeignKey(
        AviationEvent,
        on_delete=models.CASCADE,
        related_name='labeling_items'
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='aviation_labeling_items'
    )
    sequence_number = models.PositiveIntegerField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')

    threat_type_l1 = models.ForeignKey(
        TypeHierarchy,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='labeling_items_threat_l1'
    )
    threat_type_l2 = models.ForeignKey(
        TypeHierarchy,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='labeling_items_threat_l2'
    )
    threat_type_l3 = models.ForeignKey(
        TypeHierarchy,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='labeling_items_threat_l3'
    )
    threat_management = models.JSONField(default=dict, blank=True)
    threat_impact = models.JSONField(default=dict, blank=True)
    threat_coping_abilities = models.JSONField(default=dict, blank=True)
    threat_description = models.TextField(blank=True, default='')

    error_type_l1 = models.ForeignKey(
        TypeHierarchy,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='labeling_items_error_l1'
    )
    error_type_l2 = models.ForeignKey(
        TypeHierarchy,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='labeling_items_error_l2'
    )
    error_type_l3 = models.ForeignKey(
        TypeHierarchy,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='labeling_items_error_l3'
    )
    error_relevance = models.CharField(
        max_length=50,
        blank=True,
        default='',
        help_text='Origin of error: 来源于威胁'
    )
    error_management = models.JSONField(default=dict, blank=True)
    error_impact = models.JSONField(default=dict, blank=True)
    error_coping_abilities = models.JSONField(default=dict, blank=True)
    error_description = models.TextField(blank=True, default='')

    uas_applicable = models.BooleanField(default=False)
    uas_relevance = models.CharField(
        max_length=50,
        blank=True,
        default='',
        help_text='Origin of UAS: 来源于差错, 来源于威胁'
    )
    uas_type_l1 = models.ForeignKey(
        TypeHierarchy,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='labeling_items_uas_l1'
    )
    uas_type_l2 = models.ForeignKey(
        TypeHierarchy,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='labeling_items_uas_l2'
    )
    uas_type_l3 = models.ForeignKey(
        TypeHierarchy,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='labeling_items_uas_l3'
    )
    uas_management = models.JSONField(default=dict, blank=True)
    uas_impact = models.JSONField(default=dict, blank=True)
    uas_coping_abilities = models.JSONField(default=dict, blank=True)
    uas_description = models.TextField(blank=True, default='')

    calculated_threat_topics = models.JSONField(default=list, blank=True)
    calculated_error_topics = models.JSONField(default=list, blank=True)
    calculated_uas_topics = models.JSONField(default=list, blank=True)

    notes = models.TextField(blank=True, default='')
    linked_result = models.ForeignKey(
        'ResultPerformance',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='linked_labeling_items'
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_labeling_items'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'aviation_labeling_item'
        unique_together = [('event', 'sequence_number')]
        ordering = ['event', 'sequence_number']

    def __str__(self):
        return f'LabelingItem({self.event.event_number}:{self.sequence_number})'


class ResultPerformance(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('reviewed', 'Reviewed'),
        ('approved', 'Approved'),
    ]

    aviation_project = models.ForeignKey(
        AviationProject,
        on_delete=models.CASCADE,
        related_name='result_performances'
    )
    event = models.ForeignKey(
        AviationEvent,
        on_delete=models.CASCADE,
        related_name='result_performances',
        help_text='The event this performance assessment belongs to'
    )
    labeling_items = models.ManyToManyField(
        LabelingItem,
        through='LabelingItemPerformance',
        related_name='result_performances'
    )
    event_type = models.CharField(max_length=100, blank=True, default='')
    flight_phase = models.CharField(max_length=100, blank=True, default='')
    likelihood = models.CharField(max_length=50, blank=True, default='')
    severity = models.CharField(max_length=50, blank=True, default='')
    training_effect = models.CharField(max_length=100, blank=True, default='')
    training_plan = models.TextField(blank=True, default='')
    training_topics = models.JSONField(default=list, blank=True)
    training_goals = models.TextField(blank=True, default='')
    objectives = models.TextField(blank=True, default='')
    recommendations = models.TextField(blank=True, default='')
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_result_performances'
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_result_performances'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'aviation_result_performance'

    def __str__(self):
        return f'ResultPerformance({self.id})'


class LabelingItemPerformance(models.Model):
    labeling_item = models.ForeignKey(
        LabelingItem,
        on_delete=models.CASCADE,
        related_name='performance_links'
    )
    result_performance = models.ForeignKey(
        ResultPerformance,
        on_delete=models.CASCADE,
        related_name='labeling_item_links'
    )
    contribution_weight = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=1.00
    )
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'aviation_labeling_item_performance'
        unique_together = [('labeling_item', 'result_performance')]

    def __str__(self):
        return f'LabelingItemPerformance({self.labeling_item_id}:{self.result_performance_id})'


class ReviewDecision(models.Model):
    """
    Audit trail for review decisions on labeling items.

    Captures each review action (approve, reject, revision request) with
    associated reviewer comments. Multiple decisions can exist for the same
    labeling item to maintain a complete review history.
    """
    STATUS_CHOICES = [
        ('approved', 'Approved'),
        ('rejected_partial', 'Rejected (Partial)'),
        ('rejected_full', 'Rejected (Full)'),
        ('revision_requested', 'Revision Requested'),
    ]

    labeling_item = models.ForeignKey(
        LabelingItem,
        on_delete=models.CASCADE,
        related_name='review_decisions',
        help_text='The labeling item being reviewed'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        help_text='Review decision status: approved, rejected_partial, rejected_full, or revision_requested'
    )
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='aviation_review_decisions',
        help_text='User who made this review decision'
    )
    reviewer_comment = models.TextField(
        blank=True,
        default='',
        help_text='Optional comment from the reviewer explaining the decision'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text='Timestamp when this review decision was made'
    )

    class Meta:
        db_table = 'aviation_review_decision'
        ordering = ['-created_at']

    def __str__(self):
        return f'ReviewDecision({self.id}:{self.status})'


class FieldFeedback(models.Model):
    """
    Field-level feedback for rejected or revision-requested items.

    Allows reviewers to provide targeted feedback on specific annotation fields
    within a labeling item. Each feedback is linked to a review decision.
    """
    FEEDBACK_TYPE_CHOICES = [
        ('partial', 'Partial'),
        ('full', 'Full'),
        ('revision', 'Revision'),
    ]

    review_decision = models.ForeignKey(
        ReviewDecision,
        on_delete=models.CASCADE,
        related_name='field_feedbacks',
        help_text='The review decision this feedback belongs to'
    )
    labeling_item = models.ForeignKey(
        LabelingItem,
        on_delete=models.CASCADE,
        related_name='field_feedbacks',
        help_text='The labeling item this feedback refers to'
    )
    field_name = models.CharField(
        max_length=50,
        help_text='Name of the field being reviewed (e.g., threat_type_l1, error_management)'
    )
    feedback_type = models.CharField(
        max_length=20,
        choices=FEEDBACK_TYPE_CHOICES,
        help_text='Type of feedback: partial (some issues), full (completely incorrect), or revision (needs clarification)'
    )
    feedback_comment = models.TextField(
        blank=True,
        default='',
        help_text='Detailed feedback explaining the issue with this field'
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='aviation_field_feedbacks',
        help_text='User who provided this field feedback'
    )
    reviewed_at = models.DateTimeField(
        auto_now_add=True,
        help_text='Timestamp when this feedback was created'
    )

    class Meta:
        db_table = 'aviation_field_feedback'
        ordering = ['field_name']

    def __str__(self):
        return f'FieldFeedback({self.field_name}:{self.feedback_type})'
