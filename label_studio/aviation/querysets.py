from django.db.models import QuerySet, Q


class AviationAnnotationQuerySet(QuerySet):
    """Custom queryset for complex aviation queries"""

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
