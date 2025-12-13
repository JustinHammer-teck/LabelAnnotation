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
    sequence_number = factory.Sequence(lambda n: n + 1)
    status = 'draft'

    class Meta:
        model = LabelingItem


class ResultPerformanceFactory(factory.django.DjangoModelFactory):
    aviation_project = factory.SubFactory(AviationProjectFactory)
    event = factory.SubFactory(AviationEventFactory)
    status = 'draft'

    class Meta:
        model = ResultPerformance


class LabelingItemPerformanceFactory(factory.django.DjangoModelFactory):
    labeling_item = factory.SubFactory(LabelingItemFactory)
    result_performance = factory.SubFactory(ResultPerformanceFactory)
    contribution_weight = Decimal('1.00')

    class Meta:
        model = LabelingItemPerformance
