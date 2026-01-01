import factory
from datetime import date, time
from decimal import Decimal

from core.utils.common import load_func
from django.conf import settings

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
from tasks.tests.factories import TaskFactory


class AviationProjectFactory(factory.django.DjangoModelFactory):
    project = factory.SubFactory(load_func(settings.PROJECT_FACTORY))
    threat_mapping = factory.LazyFunction(lambda: {
        'TCAS': ['Situational Awareness', 'Threat Detection'],
        'Wake Turbulence': ['Aircraft Performance']
    })
    error_mapping = factory.LazyFunction(lambda: {
        'Communication': ['CRM', 'Communication Skills'],
        'Procedure': ['Standard Operating Procedures']
    })
    uas_mapping = factory.LazyFunction(lambda: {
        'Drone': ['UAS Awareness', 'Airspace Management']
    })

    class Meta:
        model = AviationProject


class AviationEventFactory(factory.django.DjangoModelFactory):
    task = factory.SubFactory(TaskFactory)
    event_number = factory.Sequence(lambda n: f'EVT-{n:05d}')
    event_description = factory.Faker('paragraph')
    date = factory.LazyFunction(lambda: date(2024, 1, 1))
    time = factory.LazyFunction(lambda: time(14, 30, 0))
    location = factory.Faker('city')
    airport = factory.Sequence(lambda n: f'ICAO{n}')
    flight_phase = 'Cruise'

    class Meta:
        model = AviationEvent


class TypeHierarchyFactory(factory.django.DjangoModelFactory):
    category = 'threat'
    level = 1
    code = factory.Sequence(lambda n: f'CODE{n}')
    label = factory.Faker('word')
    training_topics = factory.LazyFunction(lambda: ['Training Topic 1'])
    display_order = factory.Sequence(lambda n: n)
    is_active = True

    class Meta:
        model = TypeHierarchy


class LabelingItemFactory(factory.django.DjangoModelFactory):
    event = factory.SubFactory(AviationEventFactory)
    created_by = None  # Allow setting created_by via kwarg
    sequence_number = factory.Sequence(lambda n: n + 1)
    status = 'draft'

    class Meta:
        model = LabelingItem


class ResultPerformanceFactory(factory.django.DjangoModelFactory):
    aviation_project = factory.SubFactory(AviationProjectFactory)
    event = factory.SubFactory(AviationEventFactory)
    created_by = None  # Allow setting created_by via kwarg
    status = 'draft'

    class Meta:
        model = ResultPerformance


class LabelingItemPerformanceFactory(factory.django.DjangoModelFactory):
    labeling_item = factory.SubFactory(LabelingItemFactory)
    result_performance = factory.SubFactory(ResultPerformanceFactory)
    contribution_weight = Decimal('1.00')

    class Meta:
        model = LabelingItemPerformance


class ReviewDecisionFactory(factory.django.DjangoModelFactory):
    """Factory for ReviewDecision model."""
    labeling_item = factory.SubFactory(LabelingItemFactory)
    status = 'approved'
    reviewer = None  # Allow setting reviewer via kwarg
    reviewer_comment = factory.Faker('sentence')

    class Meta:
        model = ReviewDecision


class FieldFeedbackFactory(factory.django.DjangoModelFactory):
    """Factory for FieldFeedback model."""
    review_decision = factory.SubFactory(ReviewDecisionFactory)
    labeling_item = factory.LazyAttribute(lambda obj: obj.review_decision.labeling_item)
    field_name = 'threat_type_l1'
    feedback_type = 'partial'
    feedback_comment = factory.Faker('sentence')
    reviewed_by = None  # Allow setting reviewed_by via kwarg

    class Meta:
        model = FieldFeedback


# =============================================================================
# Large Dataset Fixtures for Integration Testing (Phase 4)
# =============================================================================

def create_large_dataset(aviation_project, count=100):
    """
    Create a large dataset of events with varied data for performance testing.

    Creates events with:
    - Varied dates across 2023
    - Different aircraft types
    - Different airports
    - Labeling items with hierarchy types
    - Result performances with various event types/flight phases

    Args:
        aviation_project: The AviationProject to create events for
        count: Number of events to create (default: 100)

    Returns:
        dict containing created events, hierarchies, and counts
    """
    import random
    from datetime import timedelta

    # Aircraft and airport options
    aircraft_types = ['A320', 'A330', 'A350', 'B737', 'B777', 'B787', 'E190', 'C919']
    airports = ['ZBAA', 'ZSPD', 'ZGGG', 'ZUUU', 'ZSSS', 'ZGSZ', 'ZUCK', 'ZLXY']
    event_types = ['incident', 'accident', 'near_miss', 'observation']
    flight_phases = ['takeoff', 'climb', 'cruise', 'descent', 'approach', 'landing']
    training_topics_options = [
        ['CRM', 'Communication'],
        ['Manual Handling', 'Situational Awareness'],
        ['Decision Making', 'Leadership'],
        ['Threat Management', 'Error Management'],
        ['Automation', 'Flight Path Management'],
    ]

    # Create threat hierarchy
    threat_l1 = TypeHierarchyFactory(
        category='threat', level=1, code='THR-ENV', label='Environmental Threat',
        label_zh='TE环境威胁'
    )
    threat_l2 = TypeHierarchyFactory(
        category='threat', level=2, code='THR-WX', label='Weather',
        label_zh='TEW 天气', parent=threat_l1
    )
    threat_l3 = TypeHierarchyFactory(
        category='threat', level=3, code='THR-WX-TURB', label='Turbulence',
        label_zh='TEW 01 湍流', parent=threat_l2
    )

    # Create error hierarchy
    error_l1 = TypeHierarchyFactory(
        category='error', level=1, code='ERR-COMM', label='Communication Error',
        label_zh='差错通讯'
    )
    error_l2 = TypeHierarchyFactory(
        category='error', level=2, code='ERR-ATC', label='ATC Communication',
        label_zh='ATC差错', parent=error_l1
    )
    error_l3 = TypeHierarchyFactory(
        category='error', level=3, code='ERR-RDB', label='Readback Error',
        label_zh='复述差错', parent=error_l2
    )

    # Create UAS hierarchy
    uas_l1 = TypeHierarchyFactory(
        category='uas', level=1, code='UAS-CTRL', label='Aircraft Control',
        label_zh='UAS控制'
    )
    uas_l2 = TypeHierarchyFactory(
        category='uas', level=2, code='UAS-FLT', label='Flight Control',
        label_zh='UAS飞行', parent=uas_l1
    )
    uas_l3 = TypeHierarchyFactory(
        category='uas', level=3, code='UAS-PITCH', label='Pitch Control',
        label_zh='UAS俯仰', parent=uas_l2
    )

    hierarchies = {
        'threat': {'l1': threat_l1, 'l2': threat_l2, 'l3': threat_l3},
        'error': {'l1': error_l1, 'l2': error_l2, 'l3': error_l3},
        'uas': {'l1': uas_l1, 'l2': uas_l2, 'l3': uas_l3},
    }

    events = []
    labeling_items_count = 0
    result_performances_count = 0

    base_date = date(2023, 1, 1)

    for i in range(count):
        event_date = base_date + timedelta(days=i % 365)

        event = AviationEventFactory(
            task__project=aviation_project.project,
            event_number=f'PERF-{i:05d}',
            date=event_date,
            aircraft_type=random.choice(aircraft_types),
            departure_airport=random.choice(airports),
            arrival_airport=random.choice(airports),
            actual_landing_airport=random.choice(airports),
            location=f'Location-{i % 10}',
            weather_conditions=f'Weather-{i % 5}',
            event_description=f'Test event description for event {i}',
        )

        # Create 1-3 labeling items per event with varied hierarchies
        num_items = random.randint(1, 3)
        for j in range(num_items):
            # Randomly assign hierarchy types (some null for edge cases)
            item_kwargs = {
                'event': event,
                'sequence_number': j + 1,
                'notes': f'End state for item {j + 1}',
            }

            # 70% chance to have threat hierarchy
            if random.random() > 0.3:
                item_kwargs['threat_type_l1'] = threat_l1
                if random.random() > 0.4:
                    item_kwargs['threat_type_l2'] = threat_l2
                    if random.random() > 0.5:
                        item_kwargs['threat_type_l3'] = threat_l3
                item_kwargs['threat_coping_abilities'] = {'values': ['KNO.1', 'PRO.2']}

            # 50% chance to have error hierarchy
            if random.random() > 0.5:
                item_kwargs['error_type_l1'] = error_l1
                if random.random() > 0.5:
                    item_kwargs['error_type_l2'] = error_l2
                    if random.random() > 0.5:
                        item_kwargs['error_type_l3'] = error_l3
                item_kwargs['error_coping_abilities'] = {'values': ['PRO.1', 'KNO.3']}

            # 30% chance to have UAS hierarchy
            if random.random() > 0.7:
                item_kwargs['uas_type_l1'] = uas_l1
                if random.random() > 0.5:
                    item_kwargs['uas_type_l2'] = uas_l2
                    if random.random() > 0.5:
                        item_kwargs['uas_type_l3'] = uas_l3
                item_kwargs['uas_coping_abilities'] = {'values': ['KNO.2']}

            LabelingItemFactory(**item_kwargs)
            labeling_items_count += 1

        # Create 1-2 result performances per event
        num_perfs = random.randint(1, 2)
        for k in range(num_perfs):
            ResultPerformanceFactory(
                aviation_project=aviation_project,
                event=event,
                event_type=random.choice(event_types),
                flight_phase=random.choice(flight_phases),
                training_topics=random.choice(training_topics_options),
                likelihood='possible',
                severity='major',
            )
            result_performances_count += 1

        events.append(event)

    return {
        'events': events,
        'hierarchies': hierarchies,
        'events_count': count,
        'labeling_items_count': labeling_items_count,
        'result_performances_count': result_performances_count,
    }
