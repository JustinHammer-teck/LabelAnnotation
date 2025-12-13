"""
Management command to seed aviation type hierarchy data.

Usage:
    python manage.py seed_aviation_types
    python manage.py seed_aviation_types --clear  # Clear existing data first
"""
from django.core.management.base import BaseCommand
from django.db import transaction

from aviation.models import TypeHierarchy


class Command(BaseCommand):
    help = 'Seed aviation type hierarchy data from labHieStru'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing type hierarchy data before seeding',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write('Clearing existing type hierarchy data...')
            TypeHierarchy.objects.all().delete()

        with transaction.atomic():
            self._seed_basic_options()
            self._seed_threat_hierarchy()
            self._seed_error_hierarchy()
            self._seed_uas_hierarchy()
            self._seed_management_options()
            self._seed_coping_abilities()

        self.stdout.write(self.style.SUCCESS('Successfully seeded aviation type hierarchy data'))

    def _create_type(self, category, level, code, label, label_zh='', parent=None,
                     training_topics=None, display_order=0):
        obj, created = TypeHierarchy.objects.update_or_create(
            category=category,
            code=code,
            defaults={
                'level': level,
                'label': label,
                'label_zh': label_zh or label,
                'parent': parent,
                'training_topics': training_topics or [],
                'display_order': display_order,
                'is_active': True,
            }
        )
        action = 'Created' if created else 'Updated'
        self.stdout.write(f'  {action}: {category}/{code}')
        return obj

    def _seed_basic_options(self):
        self.stdout.write('Seeding basic options...')

        event_types = ['失速', '鸟击', '机械故障', '天气影响', '人为因素']
        for i, label in enumerate(event_types):
            self._create_type('event_type', 1, f'ET{i+1:02d}', label, label, display_order=i)

        flight_phases = ['起飞', '降落', '巡航', '爬升', '下降', '滑行']
        for i, label in enumerate(flight_phases):
            self._create_type('flight_phase', 1, f'FP{i+1:02d}', label, label, display_order=i)

        likelihoods = [
            ('L1', '极少', 'Rare'),
            ('L2', '中等情况', 'Moderate'),
            ('L3', '特别常见', 'Frequent'),
        ]
        for i, (code, zh, en) in enumerate(likelihoods):
            self._create_type('likelihood', 1, code, en, zh, display_order=i)

        severities = [
            ('S1', '微不足道', 'Negligible'),
            ('S2', '中等情况', 'Moderate'),
            ('S3', '灾难性的', 'Catastrophic'),
        ]
        for i, (code, zh, en) in enumerate(severities):
            self._create_type('severity', 1, code, en, zh, display_order=i)

        training_effects = [
            ('TE1', '没效果', 'No Effect'),
            ('TE2', '一般效果', 'Moderate Effect'),
            ('TE3', '效果显著', 'Significant Effect'),
        ]
        for i, (code, zh, en) in enumerate(training_effects):
            self._create_type('training_effect', 1, code, en, zh, display_order=i)

        training_topics = [
            '威胁与差错管理', '人的因素知识与应用', '沟通', '情景意识',
            '决策', '工作负荷管理', '领导力与团队合作', '自动化管理',
            '监控', '意外与惊吓', '发展韧性和复原力', '文化与SOP与CRM', 'CRM 概述'
        ]
        for i, label in enumerate(training_topics):
            self._create_type('training_topics', 1, f'TT{i+1:02d}', label, label, display_order=i)

    def _seed_threat_hierarchy(self):
        self.stdout.write('Seeding threat hierarchy...')

        te_env = self._create_type('threat', 1, 'TE', 'Environment', 'TE环境', display_order=0)

        tew = self._create_type('threat', 2, 'TEW', 'Weather', 'TEW 天气', parent=te_env, display_order=0)
        self._create_type('threat', 3, 'TEW01', 'Adverse Weather',
                         'TEW 01 恶劣天气( 寒冷/炎热/雷雨/颠簸/沙尘/火山灰)',
                         parent=tew, training_topics=['恶劣天气'], display_order=0)
        self._create_type('threat', 3, 'TEW02', 'Low Visibility',
                         'TEW 02 低能见度',
                         parent=tew, training_topics=['恶劣天气'], display_order=1)

        tes = self._create_type('threat', 2, 'TES', 'ATC Service', 'TES ATC服务', parent=te_env, display_order=1)
        self._create_type('threat', 3, 'TES01', 'Difficult Instructions',
                         'TES 01 难以完成的指令/限制',
                         parent=tes, training_topics=['ATC'], display_order=0)
        self._create_type('threat', 3, 'TES02', 'Difficult Communication',
                         'TES 02 难以建立联系',
                         parent=tes, training_topics=['ATC'], display_order=1)

        ta_airline = self._create_type('threat', 1, 'TA', 'Airline', 'TA航线', display_order=1)

        tae = self._create_type('threat', 2, 'TAE', 'Aircraft Engine', 'TAE 飞机发动机', parent=ta_airline, display_order=0)
        self._create_type('threat', 3, 'TAE01', 'Powerplant Failure',
                         'TAE 01 动力装置系统/部件失效或故障（包容/非包容性）',
                         parent=tae, training_topics=['发动机故障'], display_order=0)
        self._create_type('threat', 3, 'TAE02', 'Other Engine Issues',
                         'TAE 02 其它',
                         parent=tae, training_topics=['发动机故障'], display_order=1)

        tas = self._create_type('threat', 2, 'TAS', 'Aircraft System', 'TAS 飞机系统', parent=ta_airline, display_order=1)
        self._create_type('threat', 3, 'TAS01', 'Landing Gear/Tires',
                         'TAS 01 起落架/轮胎',
                         parent=tas, training_topics=['飞机系统故障'], display_order=0)
        self._create_type('threat', 3, 'TAS02', 'Brakes',
                         'TAS 02 刹车',
                         parent=tas, training_topics=['飞机系统故障'], display_order=1)

    def _seed_error_hierarchy(self):
        self.stdout.write('Seeding error hierarchy...')

        eh_handling = self._create_type('error', 1, 'EH', 'Aircraft Handling', 'EH 飞机操纵', display_order=0)

        ehg = self._create_type('error', 2, 'EHG', 'Ground Navigation', 'EHG 地面导航', parent=eh_handling, display_order=0)
        self._create_type('error', 3, 'EHG01', 'Wrong Taxiway/Runway',
                         'EHG 01 试图转向错误的滑行道/跑道',
                         parent=ehg, training_topics=['导航'], display_order=0)
        self._create_type('error', 3, 'EHG02', 'Taxi Overspeed',
                         'EHG 02 滑行超速',
                         parent=ehg, training_topics=['导航'], display_order=1)

        eha = self._create_type('error', 2, 'EHA', 'Automation', 'EHA 自动化', parent=eh_handling, display_order=1)
        self._create_type('error', 3, 'EHA01', 'Incorrect Settings',
                         'EHA 01 不正确的高度、速度、航向、自动推力（自动油门）设置、模式执行或输入',
                         parent=eha, training_topics=['自动化管理'], display_order=0)
        self._create_type('error', 3, 'EHA03', 'Other Automation',
                         'EHA 03 其他',
                         parent=eha, training_topics=['自动化管理'], display_order=1)

        ep_procedure = self._create_type('error', 1, 'EP', 'Procedure', 'EP 程序', display_order=1)

        eps = self._create_type('error', 2, 'EPS', 'SOP Compliance', 'EPS SOP 遵从性/交叉检查', parent=ep_procedure, display_order=0)
        self._create_type('error', 3, 'EPS01', 'Intentional',
                         'EPS 01 故意',
                         parent=eps, training_topics=['合规性'], display_order=0)
        self._create_type('error', 3, 'EPS02', 'Unintentional',
                         'EPS 02 无意',
                         parent=eps, training_topics=['合规性'], display_order=1)

        epl = self._create_type('error', 2, 'EPL', 'Checklist', 'EPL 检查单', parent=ep_procedure, display_order=1)
        self._create_type('error', 3, 'EPL01', 'Normal Checklist Error',
                         'EPL 01 正常检查单（差错）',
                         parent=epl, training_topics=['合规性'], display_order=0)
        self._create_type('error', 3, 'EPL02', 'Abnormal Checklist Error',
                         'EPL 02 非正常检查单（差错）',
                         parent=epl, training_topics=['合规性'], display_order=1)

    def _seed_uas_hierarchy(self):
        self.stdout.write('Seeding UAS hierarchy...')

        un_nav = self._create_type('uas', 1, 'UN', 'Ground Navigation', 'UN 地面导航', display_order=0)

        unt = self._create_type('uas', 2, 'UNT', 'Ground Taxi', 'UNT 地面滑行', parent=un_nav, display_order=0)
        self._create_type('uas', 3, 'UNT01', 'Pushback Conflict',
                         'UNT 01 误推出/推出冲突:未经许可推出/滑行',
                         parent=unt, training_topics=['地面导航'], display_order=0)
        self._create_type('uas', 3, 'UNT02', 'Wrong Taxiway',
                         'UNT 02 用错滑行道/停机坪:偏出/滑错滑行道',
                         parent=unt, training_topics=['地面导航'], display_order=1)

        uni = self._create_type('uas', 2, 'UNI', 'Runway Incursion', 'UNI 跑道侵入/占用', parent=un_nav, display_order=1)
        self._create_type('uas', 3, 'UNI01', 'Type A Incursion',
                         'UNI 01A 类跑道侵入',
                         parent=uni, training_topics=['跑道安全'], display_order=0)
        self._create_type('uas', 3, 'UNI02', 'Type B Incursion',
                         'UNI 02B 类跑道侵入',
                         parent=uni, training_topics=['跑道安全'], display_order=1)

        ui_config = self._create_type('uas', 1, 'UI', 'Incorrect Configuration', 'UI 不正确的航空器配置', display_order=1)

        uie = self._create_type('uas', 2, 'UIE', 'Incorrect Engine State', 'UIE 不正确的发动机状态', parent=ui_config, display_order=0)
        self._create_type('uas', 3, 'UIE01', 'Engine Shutdown',
                         'UIE 01发动机停车',
                         parent=uie, training_topics=['发动机管理'], display_order=0)
        self._create_type('uas', 3, 'UIE02', 'Other Engine Events',
                         'UIE 02其他发动机相关事件',
                         parent=uie, training_topics=['发动机管理'], display_order=1)

        uig = self._create_type('uas', 2, 'UIG', 'Ground Support', 'UIG 地面保障', parent=ui_config, display_order=1)
        self._create_type('uas', 3, 'UIG01', 'Cargo Transport',
                         'UIG 01物品运输',
                         parent=uig, training_topics=['地面保障'], display_order=0)
        self._create_type('uas', 3, 'UIG02', 'Loading',
                         'UIG 02配载/装载',
                         parent=uig, training_topics=['地面保障'], display_order=1)

    def _seed_management_options(self):
        self.stdout.write('Seeding management options...')

        management_options = [
            ('M1', '管理的', 'Managed'),
            ('M2', '未管理', 'Not Managed'),
            ('M3', '无效管理', 'Ineffective'),
            ('M4', '未观察到', 'Not Observed'),
        ]
        for i, (code, zh, en) in enumerate(management_options):
            self._create_type('management', 1, code, en, zh, display_order=i)

        impact_options = [
            ('I1', '无关紧要', 'Negligible'),
            ('I2', '导致差错', 'Leads to Error'),
            ('I3', '导致UAS T', 'Leads to UAS T'),
            ('I4', '导致UAS E', 'Leads to UAS E'),
        ]
        for i, (code, zh, en) in enumerate(impact_options):
            self._create_type('impact', 1, code, en, zh, display_order=i)

    def _seed_coping_abilities(self):
        self.stdout.write('Seeding coping abilities...')

        coping_categories = {
            'KNO': 'Knowledge',
            'PRO': 'Procedures',
            'FPA': 'Flight Path Awareness',
            'FPM': 'Flight Path Management',
            'COM': 'Communication',
            'LTW': 'Leadership & Teamwork',
            'SAW': 'Situational Awareness',
            'WLM': 'Workload Management',
            'PSD': 'Problem Solving & Decision Making',
        }

        for i, (code, label) in enumerate(coping_categories.items()):
            parent = self._create_type('coping', 1, code, label, code, display_order=i)
            self._create_type('coping', 2, f'{code}.1', f'{code}.1', f'{code}.1', parent=parent, display_order=0)
            self._create_type('coping', 2, f'{code}.2', f'{code}.2', f'{code}.2', parent=parent, display_order=1)
