from django.db import migrations, models
import django.db.models.deletion


def populate_event_from_linked_items(apps, schema_editor):
    """
    Populate event field for existing ResultPerformance records.
    Strategy:
    1. Get event from linked labeling item (via linked_result FK)
    2. Fallback: Get first event in the same project
    3. Last resort: Delete orphan performance records
    """
    ResultPerformance = apps.get_model('aviation', 'ResultPerformance')
    LabelingItem = apps.get_model('aviation', 'LabelingItem')
    AviationEvent = apps.get_model('aviation', 'AviationEvent')

    for perf in ResultPerformance.objects.all():
        linked_item = LabelingItem.objects.filter(linked_result=perf).first()
        if linked_item:
            perf.event = linked_item.event
            perf.save(update_fields=['event'])
            continue

        first_event = AviationEvent.objects.filter(
            task__project=perf.aviation_project.project
        ).first()
        if first_event:
            perf.event = first_event
            perf.save(update_fields=['event'])
            continue

        perf.delete()


def reverse_populate(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('aviation', '0006_add_relevance_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='resultperformance',
            name='event',
            field=models.ForeignKey(
                null=True,
                blank=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='result_performances',
                to='aviation.aviationevent',
                help_text='The event this performance assessment belongs to',
            ),
        ),
        migrations.RunPython(populate_event_from_linked_items, reverse_populate),
        migrations.AlterField(
            model_name='resultperformance',
            name='event',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='result_performances',
                to='aviation.aviationevent',
                help_text='The event this performance assessment belongs to',
            ),
        ),
    ]
