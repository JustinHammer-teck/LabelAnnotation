import factory
from datetime import date, time
from core.utils.common import load_func
from django.conf import settings
from faker import Faker

from aviation.models import (
    AviationProject,
    AviationIncident,
    AviationAnnotation,
    AviationDropdownOption
)
from tasks.tests.factories import TaskFactory, AnnotationFactory


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


class AviationIncidentFactory(factory.django.DjangoModelFactory):
    task = factory.SubFactory(TaskFactory)
    event_number = factory.Sequence(lambda n: f'INC-{n:05d}')
    event_description = factory.Faker('paragraph')
    date = factory.LazyFunction(lambda: date(2024, 1, 1))
    time = factory.LazyFunction(lambda: time(14, 30, 0))
    location = factory.Faker('city')
    airport = factory.Sequence(lambda n: f'ICAO{n}')
    flight_phase = 'Cruise'

    class Meta:
        model = AviationIncident


class AviationAnnotationFactory(factory.django.DjangoModelFactory):
    annotation = factory.SubFactory(AnnotationFactory)
    aircraft_type = 'B737'
    event_labels = factory.LazyFunction(lambda: ['Safety Event', 'Near Miss'])

    threat_type_l1 = 'Environmental'
    threat_type_l2 = 'Weather'
    threat_type_l3 = 'Turbulence'
    threat_management = 'Managed'
    threat_outcome = 'No Effect'
    threat_description = factory.Faker('sentence')

    threat_training_topics = factory.LazyFunction(lambda: ['Weather Recognition'])
    error_training_topics = factory.LazyFunction(lambda: [])
    uas_training_topics = factory.LazyFunction(lambda: [])
    competency_selections = factory.LazyFunction(lambda: ['Decision Making'])

    likelihood = 'Medium'
    severity = 'Low'
    training_benefit = 'High'

    class Meta:
        model = AviationAnnotation


class AviationDropdownOptionFactory(factory.django.DjangoModelFactory):
    category = 'threat'
    level = 1
    code = factory.Sequence(lambda n: f'CODE{n}')
    label = factory.Faker('word')
    training_topics = factory.LazyFunction(lambda: ['Training Topic 1'])
    display_order = factory.Sequence(lambda n: n)
    is_active = True

    class Meta:
        model = AviationDropdownOption
