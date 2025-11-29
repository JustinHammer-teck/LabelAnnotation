from django.core.management.base import BaseCommand
from django.db import transaction

from aviation.models import (
    AviationAnnotation,
    AviationDropdownOption,
    AviationIncident,
    AviationProject,
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
            '--annotations-only',
            action='store_true',
            help='Only clear annotations, keep dropdown options and projects'
        )
        parser.add_argument(
            '--dropdowns-only',
            action='store_true',
            help='Only clear dropdown options'
        )

    def handle(self, *args, **options):
        counts = {
            'annotations': AviationAnnotation.objects.count(),
            'incidents': AviationIncident.objects.count(),
            'projects': AviationProject.objects.count(),
            'dropdowns': AviationDropdownOption.objects.count(),
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
            if options['dropdowns_only']:
                deleted = AviationDropdownOption.objects.all().delete()
                self.stdout.write(
                    self.style.SUCCESS(f'Deleted {deleted[0]} dropdown options')
                )
                return

            if options['annotations_only']:
                deleted_annotations = AviationAnnotation.objects.all().delete()
                deleted_incidents = AviationIncident.objects.all().delete()
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Deleted {deleted_annotations[0]} annotations, '
                        f'{deleted_incidents[0]} incidents'
                    )
                )
                return

            deleted_annotations = AviationAnnotation.objects.all().delete()
            deleted_incidents = AviationIncident.objects.all().delete()
            deleted_projects = AviationProject.objects.all().delete()
            deleted_dropdowns = AviationDropdownOption.objects.all().delete()

            self.stdout.write(self.style.SUCCESS('\nDeleted:'))
            self.stdout.write(f'  Annotations: {deleted_annotations[0]}')
            self.stdout.write(f'  Incidents: {deleted_incidents[0]}')
            self.stdout.write(f'  Projects: {deleted_projects[0]}')
            self.stdout.write(f'  Dropdown options: {deleted_dropdowns[0]}')
