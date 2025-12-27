from django.core.management.base import BaseCommand
from django.db import transaction

from aviation.models import (
    AviationProject,
    AviationEvent,
    TypeHierarchy,
    LabelingItem,
    ResultPerformance,
    LabelingItemPerformance,
    ReviewDecision,
    FieldFeedback,
)


class Command(BaseCommand):
    help = 'Clear all aviation data from the database'

    def add_arguments(self, parser):
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Confirm deletion without prompting'
        )
        parser.add_argument(
            '--events-only',
            action='store_true',
            help='Only clear events, labeling items, and performances'
        )
        parser.add_argument(
            '--type-hierarchy-only',
            action='store_true',
            help='Only clear type hierarchy options'
        )

    def handle(self, *args, **options):
        counts = {
            'projects': AviationProject.objects.count(),
            'events': AviationEvent.objects.count(),
            'labeling_items': LabelingItem.objects.count(),
            'result_performances': ResultPerformance.objects.count(),
            'review_decisions': ReviewDecision.objects.count(),
            'field_feedbacks': FieldFeedback.objects.count(),
            'type_hierarchy': TypeHierarchy.objects.count(),
        }

        self.stdout.write('Current aviation data counts:')
        for name, count in counts.items():
            self.stdout.write(f'  {name}: {count}')

        if not options['confirm']:
            self.stdout.write(
                self.style.WARNING('\nThis will permanently delete aviation data.')
            )
            confirm = input('Type "yes" to confirm: ')
            if confirm.lower() != 'yes':
                self.stdout.write(self.style.ERROR('Aborted.'))
                return

        with transaction.atomic():
            if options['type_hierarchy_only']:
                deleted = TypeHierarchy.objects.all().delete()
                self.stdout.write(
                    self.style.SUCCESS(f'Deleted {deleted[0]} type hierarchy entries')
                )
                return

            if options['events_only']:
                # Delete in order: feedbacks -> decisions -> performances -> items -> events
                deleted_feedbacks = FieldFeedback.objects.all().delete()
                deleted_decisions = ReviewDecision.objects.all().delete()
                deleted_item_perfs = LabelingItemPerformance.objects.all().delete()
                deleted_perfs = ResultPerformance.objects.all().delete()
                deleted_items = LabelingItem.objects.all().delete()
                deleted_events = AviationEvent.objects.all().delete()
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Deleted {deleted_events[0]} events, '
                        f'{deleted_items[0]} labeling items, '
                        f'{deleted_perfs[0]} result performances, '
                        f'{deleted_decisions[0]} review decisions, '
                        f'{deleted_feedbacks[0]} field feedbacks'
                    )
                )
                return

            # Full deletion
            deleted_feedbacks = FieldFeedback.objects.all().delete()
            deleted_decisions = ReviewDecision.objects.all().delete()
            deleted_item_perfs = LabelingItemPerformance.objects.all().delete()
            deleted_perfs = ResultPerformance.objects.all().delete()
            deleted_items = LabelingItem.objects.all().delete()
            deleted_events = AviationEvent.objects.all().delete()
            deleted_projects = AviationProject.objects.all().delete()
            deleted_types = TypeHierarchy.objects.all().delete()

            self.stdout.write(self.style.SUCCESS('\nDeleted:'))
            self.stdout.write(f'  Projects: {deleted_projects[0]}')
            self.stdout.write(f'  Events: {deleted_events[0]}')
            self.stdout.write(f'  Labeling Items: {deleted_items[0]}')
            self.stdout.write(f'  Result Performances: {deleted_perfs[0]}')
            self.stdout.write(f'  Review Decisions: {deleted_decisions[0]}')
            self.stdout.write(f'  Field Feedbacks: {deleted_feedbacks[0]}')
            self.stdout.write(f'  Type Hierarchy: {deleted_types[0]}')
