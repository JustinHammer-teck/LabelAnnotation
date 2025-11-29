from django.db.models.signals import post_save, pre_delete
from django.dispatch import receiver
from .models import AviationAnnotation
from .services import TrainingCalculationService


@receiver(post_save, sender=AviationAnnotation)
def aviation_annotation_post_save(sender, instance, created, **kwargs):
    """Auto-calculate training topics after save"""
    if kwargs.get('raw', False):
        return

    update_fields = kwargs.get('update_fields')

    if update_fields is not None and (
        'threat_training_topics' in update_fields or
        'error_training_topics' in update_fields or
        'uas_training_topics' in update_fields
    ):
        return

    if created or (update_fields is not None and any(field in update_fields for field in [
        'threat_type_l3', 'error_type_l3', 'uas_type_l3'
    ])):
        calculator = TrainingCalculationService()

        try:
            training_data = calculator.calculate_training_topics(instance)

            AviationAnnotation.objects.filter(pk=instance.pk).update(
                threat_training_topics=training_data.get('threat_training_topics', []),
                error_training_topics=training_data.get('error_training_topics', []),
                uas_training_topics=training_data.get('uas_training_topics', [])
            )
        except NotImplementedError:
            pass


