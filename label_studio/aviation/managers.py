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
        from django.db import connection

        if connection.vendor == 'postgresql':
            threat_has_data = ~Q(threat_training_topics__isnull=True) & ~Q(threat_training_topics=[])
            error_has_data = ~Q(error_training_topics__isnull=True) & ~Q(error_training_topics=[])
            uas_has_data = ~Q(uas_training_topics__isnull=True) & ~Q(uas_training_topics=[])
            return self.filter(threat_has_data | error_has_data | uas_has_data)
        else:
            result_ids = []
            for ann in self:
                has_topics = (
                    (ann.threat_training_topics and len(ann.threat_training_topics) > 0) or
                    (ann.error_training_topics and len(ann.error_training_topics) > 0) or
                    (ann.uas_training_topics and len(ann.uas_training_topics) > 0)
                )
                if has_topics:
                    result_ids.append(ann.id)
            if not result_ids:
                return self.none()
            return self.filter(id__in=result_ids)


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
