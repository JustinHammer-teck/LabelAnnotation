from django.test import TestCase

from organizations.tests.factories import OrganizationFactory
from projects.tests.factories import ProjectFactory
from tasks.tests.factories import TaskFactory, AnnotationFactory

from aviation.models import AviationAnnotation, AviationDropdownOption
from aviation.tests.factories import (
    AviationAnnotationFactory,
    AviationDropdownOptionFactory
)


class AviationAnnotationManagerTest(TestCase):
    def setUp(self):
        self.org1 = OrganizationFactory()
        self.org2 = OrganizationFactory()

        self.project1 = ProjectFactory(organization=self.org1)
        self.project2 = ProjectFactory(organization=self.org2)

        self.task1 = TaskFactory(project=self.project1)
        self.task2 = TaskFactory(project=self.project2)

        self.annotation1 = AnnotationFactory(task=self.task1, project=self.project1)
        self.annotation2 = AnnotationFactory(task=self.task2, project=self.project2)

        self.aviation_annotation1 = AviationAnnotationFactory(annotation=self.annotation1)
        self.aviation_annotation2 = AviationAnnotationFactory(annotation=self.annotation2)

    def test_for_organization(self):
        queryset = AviationAnnotation.objects.for_organization(self.org1)

        self.assertIn(self.aviation_annotation1, queryset)
        self.assertNotIn(self.aviation_annotation2, queryset)

    def test_for_organization_optimized_queries(self):
        queryset = AviationAnnotation.objects.for_organization(self.org1)

        with self.assertNumQueries(1):
            list(queryset)
            for annotation in queryset:
                _ = annotation.annotation.task.project.organization

    def test_for_project(self):
        queryset = AviationAnnotation.objects.for_project(self.project1)

        self.assertEqual(queryset.count(), 1)
        self.assertIn(self.aviation_annotation1, queryset)

    def test_for_project_multiple_annotations(self):
        task3 = TaskFactory(project=self.project1)
        annotation3 = AnnotationFactory(task=task3, project=self.project1)
        aviation_annotation3 = AviationAnnotationFactory(annotation=annotation3)

        queryset = AviationAnnotation.objects.for_project(self.project1)

        self.assertEqual(queryset.count(), 2)
        self.assertIn(self.aviation_annotation1, queryset)
        self.assertIn(aviation_annotation3, queryset)

    def test_with_incident_data(self):
        from aviation.tests.factories import AviationIncidentFactory

        incident = AviationIncidentFactory(task=self.task1)

        queryset = AviationAnnotation.objects.with_incident_data()

        with self.assertNumQueries(1):
            list(queryset)
            for annotation in queryset:
                if annotation.annotation.task.id == self.task1.id:
                    _ = annotation.annotation.task.aviation_incident

    def test_chaining_methods(self):
        queryset = AviationAnnotation.objects.for_organization(self.org1).with_incident_data()

        self.assertEqual(queryset.count(), 1)
        self.assertIn(self.aviation_annotation1, queryset)


class AviationDropdownManagerTest(TestCase):
    def setUp(self):
        self.active_option1 = AviationDropdownOptionFactory(
            category='threat',
            level=1,
            is_active=True
        )
        self.active_option2 = AviationDropdownOptionFactory(
            category='error',
            level=1,
            is_active=True
        )
        self.inactive_option = AviationDropdownOptionFactory(
            category='threat',
            level=1,
            is_active=False
        )

    def test_active(self):
        queryset = AviationDropdownOption.objects.active()

        self.assertEqual(queryset.count(), 2)
        self.assertIn(self.active_option1, queryset)
        self.assertIn(self.active_option2, queryset)
        self.assertNotIn(self.inactive_option, queryset)

    def test_by_category(self):
        queryset = AviationDropdownOption.objects.by_category('threat')

        self.assertEqual(queryset.count(), 2)
        self.assertIn(self.active_option1, queryset)
        self.assertIn(self.inactive_option, queryset)
        self.assertNotIn(self.active_option2, queryset)

    def test_by_category_with_children(self):
        parent = AviationDropdownOptionFactory(category='threat', level=1)
        child1 = AviationDropdownOptionFactory(category='threat', level=2, parent=parent)
        child2 = AviationDropdownOptionFactory(category='threat', level=2, parent=parent)

        queryset = AviationDropdownOption.objects.by_category('threat')

        with self.assertNumQueries(2):
            options = list(queryset)
            for option in options:
                _ = list(option.children.all())

    def test_root_options(self):
        parent = AviationDropdownOptionFactory(
            category='threat',
            level=1,
            parent=None,
            is_active=True,
            display_order=1
        )
        child = AviationDropdownOptionFactory(
            category='threat',
            level=2,
            parent=parent,
            is_active=True
        )
        inactive_root = AviationDropdownOptionFactory(
            category='threat',
            level=1,
            parent=None,
            is_active=False
        )

        queryset = AviationDropdownOption.objects.root_options('threat')

        self.assertIn(parent, queryset)
        self.assertNotIn(child, queryset)
        self.assertNotIn(inactive_root, queryset)

    def test_root_options_ordering(self):
        root1 = AviationDropdownOptionFactory(
            category='threat',
            level=1,
            display_order=2
        )
        root2 = AviationDropdownOptionFactory(
            category='threat',
            level=1,
            display_order=1
        )

        queryset = AviationDropdownOption.objects.root_options('threat')
        options = list(queryset)

        self.assertEqual(options[0], root2)
        self.assertEqual(options[1], root1)

    def test_chaining_methods(self):
        option = AviationDropdownOptionFactory(
            category='threat',
            level=1,
            is_active=True
        )

        queryset = AviationDropdownOption.objects.active().by_category('threat')

        self.assertIn(option, queryset)


class AviationAnnotationQuerySetTest(TestCase):
    def setUp(self):
        self.organization = OrganizationFactory()
        self.project = ProjectFactory(organization=self.organization)
        self.task = TaskFactory(project=self.project)

    def test_with_threat_type_l1(self):
        annotation1 = AnnotationFactory(task=self.task, project=self.project)
        annotation2 = AnnotationFactory(task=self.task, project=self.project)

        aviation1 = AviationAnnotationFactory(
            annotation=annotation1,
            threat_type_l1='Environmental',
            threat_type_l2='',
            threat_type_l3=''
        )
        aviation2 = AviationAnnotationFactory(
            annotation=annotation2,
            threat_type_l1='Operational',
            threat_type_l2='',
            threat_type_l3=''
        )

        queryset = AviationAnnotation.objects.with_threat_type('Environmental')

        self.assertIn(aviation1, queryset)
        self.assertNotIn(aviation2, queryset)

    def test_with_threat_type_l2(self):
        annotation1 = AnnotationFactory(task=self.task, project=self.project)
        annotation2 = AnnotationFactory(task=self.task, project=self.project)

        aviation1 = AviationAnnotationFactory(
            annotation=annotation1,
            threat_type_l1='Environmental',
            threat_type_l2='Weather',
            threat_type_l3=''
        )
        aviation2 = AviationAnnotationFactory(
            annotation=annotation2,
            threat_type_l1='Environmental',
            threat_type_l2='Terrain',
            threat_type_l3=''
        )

        queryset = AviationAnnotation.objects.with_threat_type('Weather')

        self.assertIn(aviation1, queryset)
        self.assertNotIn(aviation2, queryset)

    def test_with_threat_type_l3(self):
        annotation1 = AnnotationFactory(task=self.task, project=self.project)

        aviation1 = AviationAnnotationFactory(
            annotation=annotation1,
            threat_type_l1='Environmental',
            threat_type_l2='Weather',
            threat_type_l3='Turbulence'
        )

        queryset = AviationAnnotation.objects.with_threat_type('Turbulence')

        self.assertIn(aviation1, queryset)

    def test_with_threat_type_case_insensitive(self):
        annotation1 = AnnotationFactory(task=self.task, project=self.project)

        aviation1 = AviationAnnotationFactory(
            annotation=annotation1,
            threat_type_l1='Environmental'
        )

        queryset = AviationAnnotation.objects.with_threat_type('environmental')

        self.assertIn(aviation1, queryset)

    def test_completed(self):
        annotation1 = AnnotationFactory(task=self.task, project=self.project)
        annotation2 = AnnotationFactory(task=self.task, project=self.project)
        annotation3 = AnnotationFactory(task=self.task, project=self.project)

        aviation1 = AviationAnnotationFactory(
            annotation=annotation1,
            threat_type_l1='Environmental',
            error_type_l1='',
            uas_type_l1=''
        )
        aviation2 = AviationAnnotationFactory(
            annotation=annotation2,
            threat_type_l1='',
            error_type_l1='Procedural',
            uas_type_l1=''
        )
        aviation3 = AviationAnnotationFactory(
            annotation=annotation3,
            threat_type_l1='',
            error_type_l1='',
            uas_type_l1=''
        )

        queryset = AviationAnnotation.objects.completed()

        self.assertIn(aviation1, queryset)
        self.assertIn(aviation2, queryset)
        self.assertNotIn(aviation3, queryset)

    def test_with_training_recommendations(self):
        annotation1 = AnnotationFactory(task=self.task, project=self.project)
        annotation2 = AnnotationFactory(task=self.task, project=self.project)
        annotation3 = AnnotationFactory(task=self.task, project=self.project)

        aviation1 = AviationAnnotationFactory(
            annotation=annotation1,
            threat_training_topics=['Topic A'],
            error_training_topics=[],
            uas_training_topics=[]
        )
        aviation2 = AviationAnnotationFactory(
            annotation=annotation2,
            threat_training_topics=[],
            error_training_topics=['Topic B'],
            uas_training_topics=[]
        )
        aviation3 = AviationAnnotationFactory(
            annotation=annotation3,
            threat_training_topics=[],
            error_training_topics=[],
            uas_training_topics=[]
        )

        queryset = AviationAnnotation.objects.with_training_recommendations()

        self.assertIn(aviation1, queryset)
        self.assertIn(aviation2, queryset)
        self.assertNotIn(aviation3, queryset)

    def test_chaining_queryset_methods(self):
        annotation1 = AnnotationFactory(task=self.task, project=self.project)
        annotation2 = AnnotationFactory(task=self.task, project=self.project)

        aviation1 = AviationAnnotationFactory(
            annotation=annotation1,
            threat_type_l1='Environmental',
            threat_training_topics=['Topic A']
        )
        aviation2 = AviationAnnotationFactory(
            annotation=annotation2,
            threat_type_l1='Operational',
            threat_training_topics=['Topic B']
        )

        queryset = AviationAnnotation.objects.with_threat_type('Environmental').with_training_recommendations()

        self.assertIn(aviation1, queryset)
        self.assertNotIn(aviation2, queryset)

    def test_queryset_with_manager_methods(self):
        queryset = AviationAnnotation.objects.for_organization(self.organization).completed()

        self.assertIsNotNone(queryset)
