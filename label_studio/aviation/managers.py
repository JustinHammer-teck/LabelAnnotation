from django.db import models
from django.db.models import Q


class AviationAnnotationQuerySet(models.QuerySet):
    """Custom queryset for aviation annotations"""

    def for_organization(self, organization):
        """Filter by organization with optimized queries"""
        return self.select_related(
            'annotation',
            'annotation__task',
            'annotation__task__project',
            'annotation__task__project__organization'
        ).filter(
            annotation__task__project__organization=organization
        )

    def for_project(self, project):
        """Filter by project with optimized queries"""
        return self.select_related(
            'annotation',
            'annotation__task'
        ).filter(
            annotation__task__project=project
        )

    def with_incident_data(self):
        """Include related incident data"""
        return self.select_related(
            'annotation__task__aviation_incident'
        )

    def with_threat_type(self, threat_type):
        """Filter by threat type at any level"""
        return self.filter(
            Q(threat_type_l1__icontains=threat_type) |
            Q(threat_type_l2__icontains=threat_type) |
            Q(threat_type_l3__icontains=threat_type)
        )

    def completed(self):
        """Annotations with all required fields filled"""
        return self.exclude(
            Q(threat_type_l1='') &
            Q(error_type_l1='') &
            Q(uas_type_l1='')
        )

    def with_training_recommendations(self):
        """Annotations that have training recommendations"""
        return self.exclude(
            threat_training_topics=[],
            error_training_topics=[],
            uas_training_topics=[]
        )


class AviationAnnotationManager(models.Manager.from_queryset(AviationAnnotationQuerySet)):
    """Custom manager for aviation annotations"""
    pass


class AviationDropdownQuerySet(models.QuerySet):
    """Custom queryset for dropdown options"""

    def active(self):
        """Return only active options"""
        return self.filter(is_active=True)

    def by_category(self, category):
        """Get options by category with children"""
        return self.filter(category=category).prefetch_related('children')

    def root_options(self, category):
        """Get only root-level options for category"""
        return self.filter(
            category=category,
            parent__isnull=True,
            is_active=True
        ).order_by('display_order')


class AviationDropdownManager(models.Manager.from_queryset(AviationDropdownQuerySet)):
    """Custom manager for dropdown options"""
    pass
