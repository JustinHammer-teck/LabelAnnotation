from django.core.management.base import BaseCommand
from django.db import transaction
from aviation.models import AviationDropdownOption


class Command(BaseCommand):
    help = 'Load default aviation dropdown options'

    def handle(self, *args, **options):
        self.stdout.write('Loading default aviation dropdown options...')

        with transaction.atomic():
            self._load_aircraft_types()
            self._load_threat_types()
            self._load_error_types()
            self._load_uas_types()
            self._load_event_labels()
            self._load_crm_topics()

        self.stdout.write(self.style.SUCCESS('Successfully loaded aviation defaults'))

    def _load_aircraft_types(self):
        """Load aircraft type options"""
        aircraft_types = [
            {'code': 'A320', 'label': 'Airbus A320', 'display_order': 1},
            {'code': 'A330', 'label': 'Airbus A330', 'display_order': 2},
            {'code': 'B737', 'label': 'Boeing 737', 'display_order': 3},
            {'code': 'B777', 'label': 'Boeing 777', 'display_order': 4},
            {'code': 'B787', 'label': 'Boeing 787', 'display_order': 5},
        ]

        for aircraft in aircraft_types:
            AviationDropdownOption.objects.get_or_create(
                category='aircraft',
                level=1,
                code=aircraft['code'],
                defaults={
                    'label': aircraft['label'],
                    'display_order': aircraft['display_order']
                }
            )

    def _load_threat_types(self):
        """Load threat type hierarchy"""
        threats = [
            {
                'l1': 'Environmental', 'l1_code': 'ENV',
                'l2': 'Weather', 'l2_code': 'WX',
                'l3': [
                    {'code': 'TURB', 'label': 'Turbulence', 'topics': ['SAW', 'WLM']},
                    {'code': 'WIND', 'label': 'Wind Shear', 'topics': ['SAW', 'FPM']},
                ]
            },
            {
                'l1': 'Operational', 'l1_code': 'OPS',
                'l2': 'ATC', 'l2_code': 'ATC',
                'l3': [
                    {'code': 'CLRNC', 'label': 'Clearance Issue', 'topics': ['COM', 'LTW']},
                    {'code': 'CONF', 'label': 'Conflicting Instructions', 'topics': ['COM', 'SAW']},
                ]
            },
        ]

        for threat_group in threats:
            l1, _ = AviationDropdownOption.objects.get_or_create(
                category='threat',
                level=1,
                code=threat_group['l1_code'],
                defaults={'label': threat_group['l1'], 'display_order': 1}
            )

            l2, _ = AviationDropdownOption.objects.get_or_create(
                category='threat',
                level=2,
                parent=l1,
                code=threat_group['l2_code'],
                defaults={'label': threat_group['l2'], 'display_order': 1}
            )

            for idx, l3_item in enumerate(threat_group['l3'], 1):
                AviationDropdownOption.objects.get_or_create(
                    category='threat',
                    level=3,
                    parent=l2,
                    code=l3_item['code'],
                    defaults={
                        'label': l3_item['label'],
                        'training_topics': l3_item['topics'],
                        'display_order': idx
                    }
                )

    def _load_error_types(self):
        """Load error type hierarchy"""
        errors = [
            {
                'l1': 'Procedural', 'l1_code': 'PROC',
                'l2': 'Checklist', 'l2_code': 'CL',
                'l3': [
                    {'code': 'SKIP', 'label': 'Skipped Items', 'topics': ['PRO', 'KNO']},
                    {'code': 'WRONG', 'label': 'Wrong Checklist', 'topics': ['PRO', 'SAW']},
                ]
            },
        ]

        for error_group in errors:
            l1, _ = AviationDropdownOption.objects.get_or_create(
                category='error',
                level=1,
                code=error_group['l1_code'],
                defaults={'label': error_group['l1'], 'display_order': 1}
            )

            l2, _ = AviationDropdownOption.objects.get_or_create(
                category='error',
                level=2,
                parent=l1,
                code=error_group['l2_code'],
                defaults={'label': error_group['l2'], 'display_order': 1}
            )

            for idx, l3_item in enumerate(error_group['l3'], 1):
                AviationDropdownOption.objects.get_or_create(
                    category='error',
                    level=3,
                    parent=l2,
                    code=l3_item['code'],
                    defaults={
                        'label': l3_item['label'],
                        'training_topics': l3_item['topics'],
                        'display_order': idx
                    }
                )

    def _load_uas_types(self):
        """Load UAS (Undesired Aircraft State) types"""
        uas_types = [
            {
                'l1': 'Flight Path', 'l1_code': 'FP',
                'l2': 'Altitude', 'l2_code': 'ALT',
                'l3': [
                    {'code': 'DEV_ALT', 'label': 'Altitude Deviation', 'topics': ['FPM', 'SAW']},
                ]
            },
        ]

        for uas_group in uas_types:
            l1, _ = AviationDropdownOption.objects.get_or_create(
                category='uas',
                level=1,
                code=uas_group['l1_code'],
                defaults={'label': uas_group['l1'], 'display_order': 1}
            )

            l2, _ = AviationDropdownOption.objects.get_or_create(
                category='uas',
                level=2,
                parent=l1,
                code=uas_group['l2_code'],
                defaults={'label': uas_group['l2'], 'display_order': 1}
            )

            for idx, l3_item in enumerate(uas_group['l3'], 1):
                AviationDropdownOption.objects.get_or_create(
                    category='uas',
                    level=3,
                    parent=l2,
                    code=l3_item['code'],
                    defaults={
                        'label': l3_item['label'],
                        'training_topics': l3_item['topics'],
                        'display_order': idx
                    }
                )

    def _load_event_labels(self):
        """Load event label options"""
        labels = [
            {'code': 'INCIDENT', 'label': 'Incident'},
            {'code': 'NEAR_MISS', 'label': 'Near Miss'},
            {'code': 'HAZARD', 'label': 'Hazard'},
        ]

        for idx, label in enumerate(labels, 1):
            AviationDropdownOption.objects.get_or_create(
                category='event_label',
                level=1,
                code=label['code'],
                defaults={
                    'label': label['label'],
                    'display_order': idx
                }
            )

    def _load_crm_topics(self):
        """Load CRM training topic options"""
        crm_topics = [
            {'code': 'KNO', 'label': 'Knowledge'},
            {'code': 'PRO', 'label': 'Procedures'},
            {'code': 'FPA', 'label': 'Flight Path Awareness'},
            {'code': 'FPM', 'label': 'Flight Path Management'},
            {'code': 'COM', 'label': 'Communication'},
            {'code': 'LTW', 'label': 'Leadership & Teamwork'},
            {'code': 'SAW', 'label': 'Situation Awareness'},
            {'code': 'WLM', 'label': 'Workload Management'},
            {'code': 'PSD', 'label': 'Problem Solving & Decision Making'},
        ]

        for idx, topic in enumerate(crm_topics, 1):
            AviationDropdownOption.objects.get_or_create(
                category='crm_topic',
                level=1,
                code=topic['code'],
                defaults={
                    'label': topic['label'],
                    'display_order': idx
                }
            )
