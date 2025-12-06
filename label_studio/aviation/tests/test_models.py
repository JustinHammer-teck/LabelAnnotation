from datetime import date, time
from django.test import TestCase
from django.db import IntegrityError

from organizations.tests.factories import OrganizationFactory
from projects.tests.factories import ProjectFactory
from tasks.tests.factories import TaskFactory, AnnotationFactory

from aviation.models import (
    AviationProject,
    AviationIncident,
    AviationAnnotation,
    AviationDropdownOption
)
from aviation.tests.factories import (
    AviationProjectFactory,
    AviationIncidentFactory,
    AviationAnnotationFactory,
    AviationDropdownOptionFactory
)


class AviationProjectModelTest(TestCase):
    def setUp(self):
        self.organization = OrganizationFactory()
        self.project = ProjectFactory(organization=self.organization)

    def test_create_aviation_project(self):
        aviation_project = AviationProjectFactory(project=self.project)

        self.assertIsNotNone(aviation_project.id)
        self.assertEqual(aviation_project.project, self.project)
        self.assertIsInstance(aviation_project.threat_mapping, dict)
        self.assertIsInstance(aviation_project.error_mapping, dict)
        self.assertIsInstance(aviation_project.uas_mapping, dict)

    def test_one_to_one_relationship(self):
        aviation_project = AviationProjectFactory(project=self.project)

        with self.assertRaises(IntegrityError):
            AviationProjectFactory(project=self.project)

    def test_string_representation(self):
        aviation_project = AviationProjectFactory(project=self.project)
        expected = f'Aviation Project for {self.project.title}'
        self.assertEqual(str(aviation_project), expected)

    def test_default_mappings(self):
        project = ProjectFactory(organization=self.organization)
        aviation_project = AviationProject.objects.create(project=project)

        self.assertEqual(aviation_project.threat_mapping, {})
        self.assertEqual(aviation_project.error_mapping, {})
        self.assertEqual(aviation_project.uas_mapping, {})

    def test_ordering(self):
        project1 = ProjectFactory(organization=self.organization)
        project2 = ProjectFactory(organization=self.organization)

        aviation_project1 = AviationProjectFactory(project=project1)
        aviation_project2 = AviationProjectFactory(project=project2)

        projects = AviationProject.objects.all()
        self.assertEqual(projects[0], aviation_project2)
        self.assertEqual(projects[1], aviation_project1)


class AviationIncidentModelTest(TestCase):
    def setUp(self):
        self.organization = OrganizationFactory()
        self.project = ProjectFactory(organization=self.organization)
        self.task = TaskFactory(project=self.project)

    def test_create_aviation_incident(self):
        incident = AviationIncidentFactory(task=self.task)

        self.assertIsNotNone(incident.id)
        self.assertEqual(incident.task, self.task)
        self.assertIsInstance(incident.event_number, str)
        self.assertIsInstance(incident.date, date)

    def test_string_representation(self):
        incident = AviationIncidentFactory(
            task=self.task,
            event_number='INC-12345',
            date=date(2024, 1, 15)
        )
        expected = 'Incident INC-12345 - 2024-01-15'
        self.assertEqual(str(incident), expected)

    def test_organization_property(self):
        incident = AviationIncidentFactory(task=self.task)
        self.assertEqual(incident.organization, self.organization)

    def test_optional_fields(self):
        incident = AviationIncident.objects.create(
            task=self.task,
            event_number='TEST-001',
            event_description='Test description',
            date=date(2024, 1, 1)
        )

        self.assertIsNone(incident.time)
        self.assertEqual(incident.location, '')
        self.assertEqual(incident.airport, '')
        self.assertEqual(incident.flight_phase, '')

    def test_one_to_one_with_task(self):
        incident = AviationIncidentFactory(task=self.task)

        with self.assertRaises(IntegrityError):
            AviationIncidentFactory(task=self.task)

    def test_ordering(self):
        task1 = TaskFactory(project=self.project)
        task2 = TaskFactory(project=self.project)

        incident1 = AviationIncidentFactory(
            task=task1,
            date=date(2024, 1, 1)
        )
        incident2 = AviationIncidentFactory(
            task=task2,
            date=date(2024, 1, 2)
        )

        incidents = AviationIncident.objects.all()
        self.assertEqual(incidents[0], incident2)
        self.assertEqual(incidents[1], incident1)


class AviationAnnotationModelTest(TestCase):
    def setUp(self):
        self.organization = OrganizationFactory()
        self.project = ProjectFactory(organization=self.organization)
        self.task = TaskFactory(project=self.project)
        self.annotation = AnnotationFactory(task=self.task, project=self.project)

    def test_create_aviation_annotation(self):
        aviation_annotation = AviationAnnotationFactory(annotation=self.annotation)

        self.assertIsNotNone(aviation_annotation.id)
        self.assertEqual(aviation_annotation.annotation, self.annotation)

    def test_all_threat_fields(self):
        aviation_annotation = AviationAnnotationFactory(
            annotation=self.annotation,
            threat_type_l1='Environmental',
            threat_type_l2='Weather',
            threat_type_l3='Turbulence',
            threat_management='Managed',
            threat_outcome='No Effect',
            threat_description='Encountered turbulence'
        )

        self.assertEqual(aviation_annotation.threat_type_l1, 'Environmental')
        self.assertEqual(aviation_annotation.threat_type_l2, 'Weather')
        self.assertEqual(aviation_annotation.threat_type_l3, 'Turbulence')
        self.assertEqual(aviation_annotation.threat_management, 'Managed')
        self.assertEqual(aviation_annotation.threat_outcome, 'No Effect')

    def test_all_error_fields(self):
        aviation_annotation = AviationAnnotationFactory(
            annotation=self.annotation,
            error_relevancy='Relevant',
            error_type_l1='Procedural',
            error_type_l2='Communication',
            error_type_l3='Readback Error',
            error_management='Corrected',
            error_outcome='Minor Deviation'
        )

        self.assertEqual(aviation_annotation.error_relevancy, 'Relevant')
        self.assertEqual(aviation_annotation.error_type_l1, 'Procedural')
        self.assertEqual(aviation_annotation.error_type_l2, 'Communication')
        self.assertEqual(aviation_annotation.error_type_l3, 'Readback Error')

    def test_all_uas_fields(self):
        aviation_annotation = AviationAnnotationFactory(
            annotation=self.annotation,
            uas_relevancy='Relevant',
            uas_type_l1='Drone',
            uas_type_l2='Commercial',
            uas_type_l3='Quadcopter',
            uas_management='Evasive Action',
            uas_description='Drone sighted near approach'
        )

        self.assertEqual(aviation_annotation.uas_relevancy, 'Relevant')
        self.assertEqual(aviation_annotation.uas_type_l1, 'Drone')
        self.assertEqual(aviation_annotation.uas_type_l2, 'Commercial')
        self.assertEqual(aviation_annotation.uas_type_l3, 'Quadcopter')

    def test_json_fields_default_list(self):
        annotation2 = AnnotationFactory(task=self.task, project=self.project)
        aviation_annotation = AviationAnnotation.objects.create(
            annotation=annotation2,
            threat_type_l1='Test'
        )

        self.assertEqual(aviation_annotation.event_labels, [])
        self.assertEqual(aviation_annotation.competency_indicators, [])
        self.assertEqual(aviation_annotation.competency_selections, [])
        self.assertEqual(aviation_annotation.threat_training_topics, [])
        self.assertEqual(aviation_annotation.error_training_topics, [])
        self.assertEqual(aviation_annotation.uas_training_topics, [])

    def test_organization_cached_property(self):
        aviation_annotation = AviationAnnotationFactory(annotation=self.annotation)
        self.assertEqual(aviation_annotation.organization, self.organization)

    def test_string_representation(self):
        aviation_annotation = AviationAnnotationFactory(annotation=self.annotation)
        expected = f'Aviation Annotation {aviation_annotation.id} for Task {self.task.id}'
        self.assertEqual(str(aviation_annotation), expected)

    def test_one_to_one_with_annotation(self):
        aviation_annotation = AviationAnnotationFactory(annotation=self.annotation)

        with self.assertRaises(IntegrityError):
            AviationAnnotationFactory(annotation=self.annotation)

    def test_training_topics_fields(self):
        aviation_annotation = AviationAnnotationFactory(
            annotation=self.annotation,
            threat_training_topics=['Topic 1', 'Topic 2'],
            error_training_topics=['Topic 3'],
            uas_training_topics=['Topic 4', 'Topic 5'],
            competency_selections=['Topic 6']
        )

        self.assertEqual(len(aviation_annotation.threat_training_topics), 2)
        self.assertEqual(len(aviation_annotation.error_training_topics), 1)
        self.assertEqual(len(aviation_annotation.uas_training_topics), 2)
        self.assertEqual(len(aviation_annotation.competency_selections), 1)


class AviationDropdownOptionModelTest(TestCase):
    def test_create_dropdown_option(self):
        option = AviationDropdownOptionFactory(
            category='threat',
            level=1,
            code='ENV',
            label='Environmental'
        )

        self.assertIsNotNone(option.id)
        self.assertEqual(option.category, 'threat')
        self.assertEqual(option.level, 1)
        self.assertEqual(option.code, 'ENV')
        self.assertEqual(option.label, 'Environmental')
        self.assertTrue(option.is_active)

    def test_hierarchical_relationship(self):
        parent = AviationDropdownOptionFactory(
            category='threat',
            level=1,
            code='ENV',
            label='Environmental'
        )

        child = AviationDropdownOptionFactory(
            category='threat',
            level=2,
            parent=parent,
            code='WX',
            label='Weather'
        )

        self.assertEqual(child.parent, parent)
        self.assertIn(child, parent.children.all())

    def test_three_level_hierarchy(self):
        l1 = AviationDropdownOptionFactory(category='threat', level=1, code='L1')
        l2 = AviationDropdownOptionFactory(category='threat', level=2, code='L2', parent=l1)
        l3 = AviationDropdownOptionFactory(category='threat', level=3, code='L3', parent=l2)

        self.assertIsNone(l1.parent)
        self.assertEqual(l2.parent, l1)
        self.assertEqual(l3.parent, l2)

        self.assertEqual(l1.children.count(), 1)
        self.assertEqual(l2.children.count(), 1)
        self.assertEqual(l3.children.count(), 0)

    def test_unique_together_constraint(self):
        AviationDropdownOptionFactory(
            category='threat',
            level=1,
            code='TEST'
        )

        with self.assertRaises(IntegrityError):
            AviationDropdownOptionFactory(
                category='threat',
                level=1,
                code='TEST'
            )

    def test_unique_code_different_category(self):
        AviationDropdownOptionFactory(
            category='threat',
            level=1,
            code='TEST'
        )

        option2 = AviationDropdownOptionFactory(
            category='error',
            level=1,
            code='TEST'
        )
        self.assertIsNotNone(option2.id)

    def test_unique_code_different_level(self):
        AviationDropdownOptionFactory(
            category='threat',
            level=1,
            code='TEST'
        )

        option2 = AviationDropdownOptionFactory(
            category='threat',
            level=2,
            code='TEST'
        )
        self.assertIsNotNone(option2.id)

    def test_ordering(self):
        option3 = AviationDropdownOptionFactory(
            category='threat',
            level=1,
            display_order=3
        )
        option1 = AviationDropdownOptionFactory(
            category='threat',
            level=1,
            display_order=1
        )
        option2 = AviationDropdownOptionFactory(
            category='error',
            level=1,
            display_order=2
        )

        options = AviationDropdownOption.objects.all()
        self.assertEqual(options[0], option2)
        self.assertEqual(options[1], option1)
        self.assertEqual(options[2], option3)

    def test_string_representation(self):
        option = AviationDropdownOptionFactory(
            category='threat',
            level=2,
            label='Weather'
        )
        expected = 'threat - Weather (L2)'
        self.assertEqual(str(option), expected)

    def test_training_topics_json_field(self):
        option = AviationDropdownOptionFactory(
            training_topics=['Topic A', 'Topic B', 'Topic C']
        )

        self.assertEqual(len(option.training_topics), 3)
        self.assertIn('Topic A', option.training_topics)

    def test_is_active_default(self):
        option = AviationDropdownOption.objects.create(
            category='threat',
            level=1,
            code='TEST',
            label='Test'
        )
        self.assertTrue(option.is_active)

    def test_cascade_delete(self):
        parent = AviationDropdownOptionFactory(category='threat', level=1)
        child1 = AviationDropdownOptionFactory(category='threat', level=2, parent=parent)
        child2 = AviationDropdownOptionFactory(category='threat', level=2, parent=parent)

        parent.delete()

        self.assertFalse(AviationDropdownOption.objects.filter(id=child1.id).exists())
        self.assertFalse(AviationDropdownOption.objects.filter(id=child2.id).exists())
