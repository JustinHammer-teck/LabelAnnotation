from django.core.management.base import BaseCommand, CommandError
from django.db.models import Count
from aviation.schema_services import SchemaLoaderService
import os


class Command(BaseCommand):
    help = 'Load aviation dropdown options from \u6807\u7b7e\u6c47\u603b.xlsx'

    def add_arguments(self, parser):
        parser.add_argument(
            'excel_file',
            type=str,
            help='Path to \u6807\u7b7e\u6c47\u603b.xlsx file'
        )
        parser.add_argument(
            '--validate-only',
            action='store_true',
            help='Only validate file structure without loading'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Simulate loading without committing to database'
        )

    def handle(self, *args, **options):
        excel_file = options['excel_file']

        if not os.path.exists(excel_file):
            raise CommandError(f"File not found: {excel_file}")

        loader = SchemaLoaderService()

        self.stdout.write('Validating Excel structure...')
        validation = loader.validate_excel_structure(excel_file)

        if not validation['valid']:
            self.stdout.write(self.style.ERROR('Validation failed:'))
            for error in validation['errors']:
                self.stdout.write(self.style.ERROR(f"  - {error}"))
            raise CommandError('Excel file structure is invalid')

        self.stdout.write(self.style.SUCCESS('Validation passed'))

        if options['validate_only']:
            return

        self.stdout.write('Loading aviation schema...')

        if options['dry_run']:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No changes will be committed'))

        count = loader.load_from_excel(excel_file)

        self.stdout.write(
            self.style.SUCCESS(f'\nSuccessfully loaded {count} dropdown options')
        )

        from aviation.models import AviationDropdownOption
        categories = AviationDropdownOption.objects.values('category').annotate(
            count=Count('id')
        ).order_by('category')

        self.stdout.write('\nSummary by category:')
        for cat in categories:
            self.stdout.write(f"  {cat['category']}: {cat['count']} options")
