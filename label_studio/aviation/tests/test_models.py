from datetime import date, time
from decimal import Decimal
from django.test import TestCase
from django.db import IntegrityError

from organizations.tests.factories import OrganizationFactory
from projects.tests.factories import ProjectFactory
from tasks.tests.factories import TaskFactory

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
from aviation.tests.factories import (
    AviationProjectFactory,
    AviationEventFactory,
    TypeHierarchyFactory,
    LabelingItemFactory,
    ResultPerformanceFactory,
    LabelingItemPerformanceFactory,
    ReviewDecisionFactory,
    FieldFeedbackFactory,
)
from users.tests.factories import UserFactory


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
        expected = f'AviationProject({self.project.id})'
        self.assertEqual(str(aviation_project), expected)

    def test_default_mappings(self):
        project = ProjectFactory(organization=self.organization)
        aviation_project = AviationProject.objects.create(project=project)

        self.assertEqual(aviation_project.threat_mapping, {})
        self.assertEqual(aviation_project.error_mapping, {})
        self.assertEqual(aviation_project.uas_mapping, {})

    def test_has_permission(self):
        aviation_project = AviationProjectFactory(project=self.project)
        user = self.organization.created_by

        self.assertTrue(aviation_project.has_permission(user))


class AviationEventModelTest(TestCase):
    def setUp(self):
        self.organization = OrganizationFactory()
        self.project = ProjectFactory(organization=self.organization)
        self.task = TaskFactory(project=self.project)

    def test_create_aviation_event(self):
        event = AviationEventFactory(task=self.task)

        self.assertIsNotNone(event.id)
        self.assertEqual(event.task, self.task)
        self.assertIsInstance(event.event_number, str)
        self.assertIsInstance(event.date, date)

    def test_string_representation(self):
        event = AviationEventFactory(
            task=self.task,
            event_number='EVT-12345'
        )
        expected = 'AviationEvent(EVT-12345)'
        self.assertEqual(str(event), expected)

    def test_optional_fields(self):
        event = AviationEvent.objects.create(
            task=self.task,
            event_number='TEST-001',
            event_description='Test description',
            date=date(2024, 1, 1)
        )

        self.assertIsNone(event.time)
        self.assertEqual(event.location, '')
        self.assertEqual(event.airport, '')
        self.assertEqual(event.flight_phase, '')

    def test_one_to_one_with_task(self):
        event = AviationEventFactory(task=self.task)

        with self.assertRaises(IntegrityError):
            AviationEventFactory(task=self.task)


class TypeHierarchyModelTest(TestCase):
    def test_create_type_hierarchy(self):
        th = TypeHierarchyFactory(
            category='threat',
            level=1,
            code='ENV',
            label='Environmental'
        )

        self.assertIsNotNone(th.id)
        self.assertEqual(th.category, 'threat')
        self.assertEqual(th.level, 1)
        self.assertEqual(th.code, 'ENV')
        self.assertEqual(th.label, 'Environmental')
        self.assertTrue(th.is_active)

    def test_hierarchical_relationship(self):
        parent = TypeHierarchyFactory(
            category='threat',
            level=1,
            code='ENV',
            label='Environmental'
        )

        child = TypeHierarchyFactory(
            category='threat',
            level=2,
            parent=parent,
            code='WX',
            label='Weather'
        )

        self.assertEqual(child.parent, parent)
        self.assertIn(child, parent.children.all())

    def test_three_level_hierarchy(self):
        l1 = TypeHierarchyFactory(category='threat', level=1, code='L1')
        l2 = TypeHierarchyFactory(category='threat', level=2, code='L2', parent=l1)
        l3 = TypeHierarchyFactory(category='threat', level=3, code='L3', parent=l2)

        self.assertIsNone(l1.parent)
        self.assertEqual(l2.parent, l1)
        self.assertEqual(l3.parent, l2)

        self.assertEqual(l1.children.count(), 1)
        self.assertEqual(l2.children.count(), 1)
        self.assertEqual(l3.children.count(), 0)

    def test_unique_together_constraint(self):
        TypeHierarchyFactory(
            category='threat',
            level=1,
            code='TEST'
        )

        with self.assertRaises(IntegrityError):
            TypeHierarchyFactory(
                category='threat',
                level=1,
                code='TEST'
            )

    def test_string_representation(self):
        th = TypeHierarchyFactory(
            category='threat',
            code='WX'
        )
        expected = 'threat:WX'
        self.assertEqual(str(th), expected)

    def test_training_topics_json_field(self):
        th = TypeHierarchyFactory(
            training_topics=['Topic A', 'Topic B', 'Topic C']
        )

        self.assertEqual(len(th.training_topics), 3)
        self.assertIn('Topic A', th.training_topics)


class LabelingItemModelTest(TestCase):
    def setUp(self):
        self.organization = OrganizationFactory()
        self.project = ProjectFactory(organization=self.organization)
        self.task = TaskFactory(project=self.project)
        self.event = AviationEventFactory(task=self.task)
        self.user = UserFactory()

    def test_create_labeling_item(self):
        item = LabelingItemFactory(event=self.event, created_by=self.user)

        self.assertIsNotNone(item.id)
        self.assertEqual(item.event, self.event)
        self.assertEqual(item.created_by, self.user)
        self.assertEqual(item.status, 'draft')

    def test_string_representation(self):
        item = LabelingItemFactory(event=self.event, sequence_number=1)
        expected = f'LabelingItem({self.event.event_number}:1)'
        self.assertEqual(str(item), expected)

    def test_unique_together_constraint(self):
        LabelingItemFactory(event=self.event, sequence_number=1)

        with self.assertRaises(IntegrityError):
            LabelingItemFactory(event=self.event, sequence_number=1)

    def test_type_hierarchy_relationships(self):
        threat_l1 = TypeHierarchyFactory(category='threat', level=1, code='T1')
        threat_l2 = TypeHierarchyFactory(category='threat', level=2, code='T2', parent=threat_l1)
        threat_l3 = TypeHierarchyFactory(category='threat', level=3, code='T3', parent=threat_l2)

        item = LabelingItemFactory(
            event=self.event,
            threat_type_l1=threat_l1,
            threat_type_l2=threat_l2,
            threat_type_l3=threat_l3,
        )

        self.assertEqual(item.threat_type_l1, threat_l1)
        self.assertEqual(item.threat_type_l2, threat_l2)
        self.assertEqual(item.threat_type_l3, threat_l3)


class ResultPerformanceModelTest(TestCase):
    def setUp(self):
        self.organization = OrganizationFactory()
        self.project = ProjectFactory(organization=self.organization)
        self.aviation_project = AviationProjectFactory(project=self.project)
        self.task = TaskFactory(project=self.project)
        self.event = AviationEventFactory(task=self.task)
        self.user = UserFactory()

    def test_create_result_performance(self):
        rp = ResultPerformanceFactory(
            aviation_project=self.aviation_project,
            event=self.event,
            created_by=self.user
        )

        self.assertIsNotNone(rp.id)
        self.assertEqual(rp.aviation_project, self.aviation_project)
        self.assertEqual(rp.event, self.event)
        self.assertEqual(rp.created_by, self.user)
        self.assertEqual(rp.status, 'draft')

    def test_string_representation(self):
        rp = ResultPerformanceFactory(
            aviation_project=self.aviation_project,
            event=self.event
        )
        expected = f'ResultPerformance({rp.id})'
        self.assertEqual(str(rp), expected)


class LabelingItemPerformanceModelTest(TestCase):
    def setUp(self):
        self.organization = OrganizationFactory()
        self.project = ProjectFactory(organization=self.organization)
        self.aviation_project = AviationProjectFactory(project=self.project)
        self.task = TaskFactory(project=self.project)
        self.event = AviationEventFactory(task=self.task)
        self.labeling_item = LabelingItemFactory(event=self.event)
        self.result_performance = ResultPerformanceFactory(
            aviation_project=self.aviation_project,
            event=self.event
        )

    def test_create_labeling_item_performance(self):
        lip = LabelingItemPerformanceFactory(
            labeling_item=self.labeling_item,
            result_performance=self.result_performance
        )

        self.assertIsNotNone(lip.id)
        self.assertEqual(lip.labeling_item, self.labeling_item)
        self.assertEqual(lip.result_performance, self.result_performance)
        self.assertEqual(lip.contribution_weight, Decimal('1.00'))

    def test_string_representation(self):
        lip = LabelingItemPerformanceFactory(
            labeling_item=self.labeling_item,
            result_performance=self.result_performance
        )
        expected = f'LabelingItemPerformance({self.labeling_item.id}:{self.result_performance.id})'
        self.assertEqual(str(lip), expected)

    def test_unique_together_constraint(self):
        LabelingItemPerformanceFactory(
            labeling_item=self.labeling_item,
            result_performance=self.result_performance
        )

        with self.assertRaises(IntegrityError):
            LabelingItemPerformanceFactory(
                labeling_item=self.labeling_item,
                result_performance=self.result_performance
            )


class ReviewDecisionModelTest(TestCase):
    def setUp(self):
        self.organization = OrganizationFactory()
        self.project = ProjectFactory(organization=self.organization)
        self.task = TaskFactory(project=self.project)
        self.event = AviationEventFactory(task=self.task)
        self.labeling_item = LabelingItemFactory(event=self.event)
        self.reviewer = UserFactory()

    def test_create_review_decision(self):
        decision = ReviewDecisionFactory(
            labeling_item=self.labeling_item,
            status='approved',
            reviewer=self.reviewer
        )

        self.assertIsNotNone(decision.id)
        self.assertEqual(decision.labeling_item, self.labeling_item)
        self.assertEqual(decision.status, 'approved')
        self.assertEqual(decision.reviewer, self.reviewer)

    def test_string_representation(self):
        decision = ReviewDecisionFactory(
            labeling_item=self.labeling_item,
            status='approved'
        )
        expected = f'ReviewDecision({decision.id}:approved)'
        self.assertEqual(str(decision), expected)

    def test_status_choices(self):
        valid_statuses = ['approved', 'rejected_partial', 'rejected_full', 'revision_requested']
        for status in valid_statuses:
            decision = ReviewDecisionFactory(
                labeling_item=self.labeling_item,
                status=status
            )
            self.assertEqual(decision.status, status)


class FieldFeedbackModelTest(TestCase):
    def setUp(self):
        self.organization = OrganizationFactory()
        self.project = ProjectFactory(organization=self.organization)
        self.task = TaskFactory(project=self.project)
        self.event = AviationEventFactory(task=self.task)
        self.labeling_item = LabelingItemFactory(event=self.event)
        self.review_decision = ReviewDecisionFactory(labeling_item=self.labeling_item)
        self.reviewer = UserFactory()

    def test_create_field_feedback(self):
        feedback = FieldFeedbackFactory(
            review_decision=self.review_decision,
            labeling_item=self.labeling_item,
            field_name='threat_type_l1',
            feedback_type='partial',
            reviewed_by=self.reviewer
        )

        self.assertIsNotNone(feedback.id)
        self.assertEqual(feedback.review_decision, self.review_decision)
        self.assertEqual(feedback.labeling_item, self.labeling_item)
        self.assertEqual(feedback.field_name, 'threat_type_l1')
        self.assertEqual(feedback.feedback_type, 'partial')
        self.assertEqual(feedback.reviewed_by, self.reviewer)

    def test_string_representation(self):
        feedback = FieldFeedbackFactory(
            review_decision=self.review_decision,
            labeling_item=self.labeling_item,
            field_name='threat_type_l1',
            feedback_type='partial'
        )
        expected = 'FieldFeedback(threat_type_l1:partial)'
        self.assertEqual(str(feedback), expected)

    def test_feedback_type_choices(self):
        valid_types = ['partial', 'full', 'revision']
        for feedback_type in valid_types:
            feedback = FieldFeedbackFactory(
                review_decision=self.review_decision,
                labeling_item=self.labeling_item,
                feedback_type=feedback_type
            )
            self.assertEqual(feedback.feedback_type, feedback_type)
