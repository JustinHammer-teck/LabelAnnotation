from django.core.management.base import BaseCommand
from django.db import transaction
from aviation.models import AviationDropdownOption
import pandas as pd
import os


class Command(BaseCommand):
    help = 'Load aviation dropdown options from Excel file (idempotent)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--excel-path',
            type=str,
            default='/label-studio/deploy/data/aviation_options.xlsx',
            help='Path to Excel file with aviation options'
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force reload even if options already exist'
        )

    def handle(self, *args, **options):
        excel_path = options['excel_path']
        force = options['force']

        if not os.path.exists(excel_path):
            self.stdout.write(self.style.WARNING(
                f'Excel file not found at {excel_path}. Skipping aviation options import.'
            ))
            return

        if not force and AviationDropdownOption.objects.exists():
            self.stdout.write(self.style.SUCCESS(
                'Aviation dropdown options already loaded. Use --force to reload.'
            ))
            return

        self.stdout.write('Loading aviation dropdown options from Excel...')

        try:
            with transaction.atomic():
                if force:
                    self.stdout.write('Force reload: clearing existing options...')
                    AviationDropdownOption.objects.all().delete()

                self._load_aircraft_types(excel_path)
                self._load_event_labels(excel_path)
                self._load_flight_phases(excel_path)
                self._load_threat_types(excel_path)
                self._load_threat_management_outcome(excel_path)
                self._load_error_types(excel_path)
                self._load_error_relevancy_management_outcome(excel_path)
                self._load_uas_types(excel_path)
                self._load_uas_relevancy_management(excel_path)
                self._load_competency_indicators(excel_path)
                self._load_training_assessment(excel_path)
                self._load_crm_topics(excel_path)

            self.stdout.write(self.style.SUCCESS(
                'Successfully loaded aviation dropdown options'
            ))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error loading options: {str(e)}'))
            raise

    def _load_aircraft_types(self, excel_path):
        df = pd.read_excel(excel_path, sheet_name='基本信息')
        aircraft_types = df['机型'].dropna().unique()

        for idx, aircraft in enumerate(aircraft_types, 1):
            aircraft = str(aircraft).strip()
            if not aircraft:
                continue

            code = aircraft.replace('/', '_').replace(' ', '_').replace('(', '').replace(')', '')
            AviationDropdownOption.objects.get_or_create(
                category='aircraft',
                level=1,
                code=code,
                defaults={
                    'label': aircraft,
                    'display_order': idx
                }
            )
        self.stdout.write(f'  Loaded {len(aircraft_types)} aircraft types')

    def _load_event_labels(self, excel_path):
        df = pd.read_excel(excel_path, sheet_name='基本信息')
        event_labels = df['事件标签'].dropna().unique()

        for idx, label in enumerate(event_labels, 1):
            label = str(label).strip()
            if not label:
                continue

            code = label.replace(' ', '_').upper()
            AviationDropdownOption.objects.get_or_create(
                category='event_label',
                level=1,
                code=code,
                defaults={
                    'label': label,
                    'display_order': idx
                }
            )
        self.stdout.write(f'  Loaded {len(event_labels)} event labels')

    def _load_flight_phases(self, excel_path):
        df = pd.read_excel(excel_path, sheet_name='基本信息')
        flight_phases = df['飞行阶段'].dropna().unique()

        for idx, phase in enumerate(flight_phases, 1):
            phase = str(phase).strip()
            if not phase:
                continue

            code = phase.replace(' ', '_').replace('/', '_').upper()
            AviationDropdownOption.objects.get_or_create(
                category='flight_phase',
                level=1,
                code=code,
                defaults={
                    'label': phase,
                    'display_order': idx
                }
            )
        self.stdout.write(f'  Loaded {len(flight_phases)} flight phases')

    def _load_threat_types(self, excel_path):
        df = pd.read_excel(excel_path, sheet_name='威胁类型&训练主题')

        l1_map = {}
        l2_map = {}
        count = 0

        for _, row in df.iterrows():
            l1_label = str(row['一级']).strip() if pd.notna(row['一级']) else None
            l2_label = str(row['二级']).strip() if pd.notna(row['二级']) else None
            l3_label = str(row['三级']).strip() if pd.notna(row['三级']) else None
            topics_str = str(row['模拟机训练主题']).strip() if pd.notna(row['模拟机训练主题']) else None

            if l1_label and l1_label not in l1_map:
                code = l1_label.split()[0] if ' ' in l1_label else l1_label[:3].upper()
                l1_obj, _ = AviationDropdownOption.objects.get_or_create(
                    category='threat',
                    level=1,
                    code=code,
                    defaults={
                        'label': l1_label,
                        'display_order': len(l1_map) + 1
                    }
                )
                l1_map[l1_label] = l1_obj

            if l1_label and l2_label:
                key = (l1_label, l2_label)
                if key not in l2_map:
                    code = l2_label.split()[0] if ' ' in l2_label else l2_label[:3].upper()
                    l2_obj, _ = AviationDropdownOption.objects.get_or_create(
                        category='threat',
                        level=2,
                        parent=l1_map[l1_label],
                        code=code,
                        defaults={
                            'label': l2_label,
                            'display_order': len([k for k in l2_map if k[0] == l1_label]) + 1
                        }
                    )
                    l2_map[key] = l2_obj

            if l1_label and l2_label and l3_label:
                code = l3_label.split()[0]
                topics = [t.strip() for t in topics_str.split(',')] if topics_str else []
                AviationDropdownOption.objects.get_or_create(
                    category='threat',
                    level=3,
                    parent=l2_map[(l1_label, l2_label)],
                    code=code,
                    defaults={
                        'label': l3_label,
                        'training_topics': topics,
                        'display_order': count + 1
                    }
                )
                count += 1

        self.stdout.write(f'  Loaded threat hierarchy: {len(l1_map)} L1, {len(l2_map)} L2, {count} L3')

    def _load_threat_management_outcome(self, excel_path):
        df = pd.read_excel(excel_path, sheet_name='威胁-管理&影响')

        managements = df['Threat Management\n威胁管理'].dropna().unique()
        for idx, mgmt in enumerate(managements, 1):
            mgmt = str(mgmt).strip()
            if not mgmt:
                continue
            code = mgmt.split('\\n')[0].replace(' ', '_').upper()
            label = mgmt.replace('\\n', ' / ')
            AviationDropdownOption.objects.get_or_create(
                category='threat_management',
                level=1,
                code=code,
                defaults={
                    'label': label,
                    'display_order': idx
                }
            )

        outcomes = df['Threat Outcome\n威胁影响'].dropna().unique()
        for idx, outcome in enumerate(outcomes, 1):
            outcome = str(outcome).strip()
            if not outcome:
                continue
            code = outcome.split('\\n')[0].replace(' ', '_').replace('(', '').replace(')', '').upper()
            label = outcome.replace('\\n', ' / ')
            AviationDropdownOption.objects.get_or_create(
                category='threat_outcome',
                level=1,
                code=code,
                defaults={
                    'label': label,
                    'display_order': idx
                }
            )

        self.stdout.write(f'  Loaded {len(managements)} threat managements, {len(outcomes)} outcomes')

    def _load_error_types(self, excel_path):
        df = pd.read_excel(excel_path, sheet_name='差错类型&训练主题')

        l1_map = {}
        l2_map = {}
        count = 0

        for _, row in df.iterrows():
            l1_label = str(row['一级']).strip() if pd.notna(row['一级']) else None
            l2_label = str(row['二级']).strip() if pd.notna(row['二级']) else None
            l3_label = str(row['三级']).strip() if pd.notna(row['三级']) else None
            topics_str = str(row['模拟机训练主题']).strip() if pd.notna(row['模拟机训练主题']) else None

            if l1_label and l1_label not in l1_map:
                code = l1_label.split()[0] if ' ' in l1_label else l1_label[:3].upper()
                l1_obj, _ = AviationDropdownOption.objects.get_or_create(
                    category='error',
                    level=1,
                    code=code,
                    defaults={
                        'label': l1_label,
                        'display_order': len(l1_map) + 1
                    }
                )
                l1_map[l1_label] = l1_obj

            if l1_label and l2_label:
                key = (l1_label, l2_label)
                if key not in l2_map:
                    code = l2_label.split()[0] if ' ' in l2_label else l2_label[:3].upper()
                    l2_obj, _ = AviationDropdownOption.objects.get_or_create(
                        category='error',
                        level=2,
                        parent=l1_map[l1_label],
                        code=code,
                        defaults={
                            'label': l2_label,
                            'display_order': len([k for k in l2_map if k[0] == l1_label]) + 1
                        }
                    )
                    l2_map[key] = l2_obj

            if l1_label and l2_label and l3_label:
                code = l3_label.split()[0]
                topics = [t.strip() for t in topics_str.split(',')] if topics_str else []
                AviationDropdownOption.objects.get_or_create(
                    category='error',
                    level=3,
                    parent=l2_map[(l1_label, l2_label)],
                    code=code,
                    defaults={
                        'label': l3_label,
                        'training_topics': topics,
                        'display_order': count + 1
                    }
                )
                count += 1

        self.stdout.write(f'  Loaded error hierarchy: {len(l1_map)} L1, {len(l2_map)} L2, {count} L3')

    def _load_error_relevancy_management_outcome(self, excel_path):
        df = pd.read_excel(excel_path, sheet_name='差错-相关性&管理&影响')

        relevancies = df['Error\n差错'].dropna().unique()
        for idx, rel in enumerate(relevancies, 1):
            rel = str(rel).strip()
            if not rel:
                continue
            code = rel.split('\\n')[0].replace(' ', '_').upper()
            label = rel.replace('\\n', ' / ')
            AviationDropdownOption.objects.get_or_create(
                category='error_relevancy',
                level=1,
                code=code,
                defaults={
                    'label': label,
                    'display_order': idx
                }
            )

        managements = df['Error management\n差错管理'].dropna().unique()
        for idx, mgmt in enumerate(managements, 1):
            mgmt = str(mgmt).strip()
            if not mgmt:
                continue
            code = mgmt.split('\\n')[0].replace(' ', '_').upper()
            label = mgmt.replace('\\n', ' / ')
            AviationDropdownOption.objects.get_or_create(
                category='error_management',
                level=1,
                code=code,
                defaults={
                    'label': label,
                    'display_order': idx
                }
            )

        outcomes = df['Error Outcome\n差错影响'].dropna().unique()
        for idx, outcome in enumerate(outcomes, 1):
            outcome = str(outcome).strip()
            if not outcome:
                continue
            code = outcome.split('\\n')[0].replace(' ', '_').replace('(', '').replace(')', '').upper()
            label = outcome.replace('\\n', ' / ')
            AviationDropdownOption.objects.get_or_create(
                category='error_outcome',
                level=1,
                code=code,
                defaults={
                    'label': label,
                    'display_order': idx
                }
            )

        self.stdout.write(f'  Loaded {len(relevancies)} error relevancies, {len(managements)} managements, {len(outcomes)} outcomes')

    def _load_uas_types(self, excel_path):
        df = pd.read_excel(excel_path, sheet_name='UAS&训练主题-UAS')

        l1_map = {}
        l2_map = {}
        count = 0

        for _, row in df.iterrows():
            l1_label = str(row['一级']).strip() if pd.notna(row['一级']) else None
            l2_label = str(row['二级']).strip() if pd.notna(row['二级']) else None
            l3_label = str(row['三级']).strip() if pd.notna(row['三级']) else None
            topics_str = str(row['模拟机训练主题']).strip() if pd.notna(row['模拟机训练主题']) else None

            if l1_label and l1_label not in l1_map:
                code = l1_label.split()[0] if ' ' in l1_label else l1_label[:3].upper()
                l1_obj, _ = AviationDropdownOption.objects.get_or_create(
                    category='uas',
                    level=1,
                    code=code,
                    defaults={
                        'label': l1_label,
                        'display_order': len(l1_map) + 1
                    }
                )
                l1_map[l1_label] = l1_obj

            if l1_label and l2_label:
                key = (l1_label, l2_label)
                if key not in l2_map:
                    code = l2_label.split()[0] if ' ' in l2_label else l2_label[:3].upper()
                    l2_obj, _ = AviationDropdownOption.objects.get_or_create(
                        category='uas',
                        level=2,
                        parent=l1_map[l1_label],
                        code=code,
                        defaults={
                            'label': l2_label,
                            'display_order': len([k for k in l2_map if k[0] == l1_label]) + 1
                        }
                    )
                    l2_map[key] = l2_obj

            if l1_label and l2_label and l3_label:
                code = l3_label.split()[0]
                topics = [t.strip() for t in topics_str.split(',')] if topics_str and topics_str != 'nan' else []
                AviationDropdownOption.objects.get_or_create(
                    category='uas',
                    level=3,
                    parent=l2_map[(l1_label, l2_label)],
                    code=code,
                    defaults={
                        'label': l3_label,
                        'training_topics': topics,
                        'display_order': count + 1
                    }
                )
                count += 1

        self.stdout.write(f'  Loaded UAS hierarchy: {len(l1_map)} L1, {len(l2_map)} L2, {count} L3')

    def _load_uas_relevancy_management(self, excel_path):
        df = pd.read_excel(excel_path, sheet_name='UAS-相关性&管理')

        relevancies = df['UAS相关性'].dropna().unique()
        for idx, rel in enumerate(relevancies, 1):
            rel = str(rel).strip()
            if not rel:
                continue
            code = rel.split('\\n')[0].replace(' ', '_').upper()
            label = rel.replace('\\n', ' / ')
            AviationDropdownOption.objects.get_or_create(
                category='uas_relevancy',
                level=1,
                code=code,
                defaults={
                    'label': label,
                    'display_order': idx
                }
            )

        managements = df['Undesired State Management\nUAS管理'].dropna().unique()
        for idx, mgmt in enumerate(managements, 1):
            mgmt = str(mgmt).strip()
            if not mgmt:
                continue
            code = mgmt.split('\\n')[0].replace(' ', '_').upper()
            label = mgmt.replace('\\n', ' / ')
            AviationDropdownOption.objects.get_or_create(
                category='uas_management',
                level=1,
                code=code,
                defaults={
                    'label': label,
                    'display_order': idx
                }
            )

        self.stdout.write(f'  Loaded {len(relevancies)} UAS relevancies, {len(managements)} managements')

    def _load_competency_indicators(self, excel_path):
        df = pd.read_excel(excel_path, sheet_name='胜任力')

        l1_map = {}
        count = 0

        for _, row in df.iterrows():
            l1_label = str(row['一级']).strip() if pd.notna(row['一级']) else None
            l2_label = str(row['二级']).strip() if pd.notna(row['二级']) else None

            if l1_label and l1_label not in l1_map:
                code = l1_label.split('\\n')[0].split('(')[0].strip().upper()
                label = l1_label.replace('\\n', ' ')
                l1_obj, _ = AviationDropdownOption.objects.get_or_create(
                    category='competency',
                    level=1,
                    code=code,
                    defaults={
                        'label': label,
                        'display_order': len(l1_map) + 1
                    }
                )
                l1_map[l1_label] = l1_obj

            if l1_label and l2_label:
                code = l2_label.split()[0]
                label = l2_label
                AviationDropdownOption.objects.get_or_create(
                    category='competency',
                    level=2,
                    parent=l1_map[l1_label],
                    code=code,
                    defaults={
                        'label': label,
                        'display_order': count + 1
                    }
                )
                count += 1

        self.stdout.write(f'  Loaded competency indicators: {len(l1_map)} L1, {count} L2')

    def _load_training_assessment(self, excel_path):
        df = pd.read_excel(excel_path, sheet_name='训练评估')

        likelihoods = df['Likelihood 可能性：\n飞行员遇到需要人工干预的威胁与差错的可能性。'].dropna().unique()
        for idx, likelihood in enumerate(likelihoods, 1):
            likelihood = str(likelihood).strip()
            if not likelihood:
                continue
            code = likelihood.split('\\n')[0].split()[0].upper()
            label = likelihood.replace('\\n', ' ')
            AviationDropdownOption.objects.get_or_create(
                category='likelihood',
                level=1,
                code=code,
                defaults={
                    'label': label,
                    'display_order': idx
                }
            )

        severities = df['Severity 严重性：\n假设飞行员没有经过训练而在遇到此类事件时最可能产生的后果。'].dropna().unique()
        for idx, severity in enumerate(severities, 1):
            severity = str(severity).strip()
            if not severity:
                continue
            code = severity.split('\\n')[0].split()[0].upper()
            label = severity.replace('\\n', ' ')
            AviationDropdownOption.objects.get_or_create(
                category='severity',
                level=1,
                code=code,
                defaults={
                    'label': label,
                    'display_order': idx
                }
            )

        benefits = df['Training Benefit 训练效果：\n培训在改善此类事件严重性方面的效果。'].dropna().unique()
        for idx, benefit in enumerate(benefits, 1):
            benefit = str(benefit).strip()
            if not benefit:
                continue
            code = benefit.split('\\n')[0].split()[0].upper()
            label = benefit.replace('\\n', ' ')
            AviationDropdownOption.objects.get_or_create(
                category='training_benefit',
                level=1,
                code=code,
                defaults={
                    'label': label,
                    'display_order': idx
                }
            )

        self.stdout.write(f'  Loaded training assessment: {len(likelihoods)} likelihoods, {len(severities)} severities, {len(benefits)} benefits')

    def _load_crm_topics(self, excel_path):
        df = pd.read_excel(excel_path, sheet_name='CRM训练主题')
        topics = df['训练主题'].dropna().unique()

        for idx, topic in enumerate(topics, 1):
            topic = str(topic).strip()
            if not topic:
                continue

            code = topic[:3].upper()
            AviationDropdownOption.objects.get_or_create(
                category='crm_topic',
                level=1,
                code=code,
                defaults={
                    'label': topic,
                    'display_order': idx
                }
            )

        self.stdout.write(f'  Loaded {len(topics)} CRM training topics')
