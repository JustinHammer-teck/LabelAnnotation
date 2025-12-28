"""
Tests for aviation analytics query functions.

Phase 1: Backend Data Layer - Analytics Query Functions
TDD approach: RED -> GREEN -> REFACTOR
"""
from django.test import TestCase

from organizations.tests.factories import OrganizationFactory
from projects.tests.factories import ProjectFactory
from tasks.tests.factories import TaskFactory, AnnotationFactory
from users.tests.factories import UserFactory

from aviation.models import AviationProject, LabelingItem
from aviation.tests.factories import (
    AviationProjectFactory,
    AviationEventFactory,
    LabelingItemFactory,
)
from aviation.analytics import (
    get_aviation_project_analytics,
    get_core_project_analytics,
)


class TestAviationProjectAnalytics(TestCase):
    """Test analytics for aviation projects."""

    def setUp(self):
        self.organization = OrganizationFactory()
        self.project = ProjectFactory(organization=self.organization)
        self.aviation_project = AviationProjectFactory(project=self.project)
        self.user = UserFactory()

    def test_all_items_approved(self):
        """Test analytics when all labeling items are approved."""
        # Create 2 events, each with approved labeling items
        task1 = TaskFactory(project=self.project)
        task2 = TaskFactory(project=self.project)
        event1 = AviationEventFactory(task=task1)
        event2 = AviationEventFactory(task=task2)

        # Create approved labeling items
        LabelingItemFactory(event=event1, status='approved', created_by=self.user)
        LabelingItemFactory(event=event2, status='approved', created_by=self.user)

        analytics = get_aviation_project_analytics(self.aviation_project.id)

        self.assertIsNotNone(analytics)
        self.assertEqual(analytics['project_id'], self.aviation_project.id)
        self.assertEqual(analytics['project_type'], 'aviation')
        self.assertEqual(analytics['total_events'], 2)
        self.assertEqual(analytics['events_by_status']['completed'], 2)
        self.assertEqual(analytics['events_by_status']['in_progress'], 0)
        self.assertEqual(analytics['labeling_items']['total'], 2)
        self.assertEqual(analytics['labeling_items']['by_status']['approved'], 2)
        self.assertEqual(analytics['labeling_items']['by_status']['draft'], 0)

    def test_mixed_statuses(self):
        """Test analytics with mixed item statuses."""
        # Create events with different status labeling items
        task1 = TaskFactory(project=self.project)
        task2 = TaskFactory(project=self.project)
        task3 = TaskFactory(project=self.project)
        event1 = AviationEventFactory(task=task1)
        event2 = AviationEventFactory(task=task2)
        event3 = AviationEventFactory(task=task3)

        # Event 1: approved (completed)
        LabelingItemFactory(event=event1, status='approved', created_by=self.user)
        # Event 2: draft (in_progress)
        LabelingItemFactory(event=event2, status='draft', created_by=self.user)
        # Event 3: submitted (in_progress)
        LabelingItemFactory(event=event3, status='submitted', created_by=self.user)

        analytics = get_aviation_project_analytics(self.aviation_project.id)

        self.assertIsNotNone(analytics)
        self.assertEqual(analytics['total_events'], 3)
        self.assertEqual(analytics['events_by_status']['completed'], 1)
        self.assertEqual(analytics['events_by_status']['in_progress'], 2)
        self.assertEqual(analytics['labeling_items']['total'], 3)
        self.assertEqual(analytics['labeling_items']['by_status']['approved'], 1)
        self.assertEqual(analytics['labeling_items']['by_status']['draft'], 1)
        self.assertEqual(analytics['labeling_items']['by_status']['submitted'], 1)
        self.assertEqual(analytics['labeling_items']['by_status']['reviewed'], 0)

    def test_empty_project(self):
        """Test analytics for project with no events."""
        analytics = get_aviation_project_analytics(self.aviation_project.id)

        self.assertIsNotNone(analytics)
        self.assertEqual(analytics['project_id'], self.aviation_project.id)
        self.assertEqual(analytics['total_events'], 0)
        self.assertEqual(analytics['events_by_status']['completed'], 0)
        self.assertEqual(analytics['events_by_status']['in_progress'], 0)
        self.assertEqual(analytics['labeling_items']['total'], 0)
        self.assertEqual(analytics['labeling_items']['by_status']['draft'], 0)
        self.assertEqual(analytics['labeling_items']['by_status']['submitted'], 0)
        self.assertEqual(analytics['labeling_items']['by_status']['reviewed'], 0)
        self.assertEqual(analytics['labeling_items']['by_status']['approved'], 0)

    def test_multiple_items_per_event(self):
        """Test event status when event has multiple items."""
        # Create 1 event with 3 items (2 approved, 1 draft)
        # Event should show as 'in_progress' because not ALL items are approved
        task = TaskFactory(project=self.project)
        event = AviationEventFactory(task=task)

        LabelingItemFactory(
            event=event, sequence_number=1, status='approved', created_by=self.user
        )
        LabelingItemFactory(
            event=event, sequence_number=2, status='approved', created_by=self.user
        )
        LabelingItemFactory(
            event=event, sequence_number=3, status='draft', created_by=self.user
        )

        analytics = get_aviation_project_analytics(self.aviation_project.id)

        self.assertIsNotNone(analytics)
        self.assertEqual(analytics['total_events'], 1)
        # Event is in_progress because not all items are approved
        self.assertEqual(analytics['events_by_status']['in_progress'], 1)
        self.assertEqual(analytics['events_by_status']['completed'], 0)
        self.assertEqual(analytics['labeling_items']['total'], 3)
        self.assertEqual(analytics['labeling_items']['by_status']['approved'], 2)
        self.assertEqual(analytics['labeling_items']['by_status']['draft'], 1)

    def test_multiple_items_all_approved(self):
        """Test event status when event has multiple items all approved."""
        task = TaskFactory(project=self.project)
        event = AviationEventFactory(task=task)

        LabelingItemFactory(
            event=event, sequence_number=1, status='approved', created_by=self.user
        )
        LabelingItemFactory(
            event=event, sequence_number=2, status='approved', created_by=self.user
        )
        LabelingItemFactory(
            event=event, sequence_number=3, status='approved', created_by=self.user
        )

        analytics = get_aviation_project_analytics(self.aviation_project.id)

        self.assertEqual(analytics['events_by_status']['completed'], 1)
        self.assertEqual(analytics['events_by_status']['in_progress'], 0)

    def test_event_without_labeling_items(self):
        """Test events without labeling items don't count as in_progress or completed."""
        # Create event without labeling items
        task = TaskFactory(project=self.project)
        AviationEventFactory(task=task)

        analytics = get_aviation_project_analytics(self.aviation_project.id)

        self.assertEqual(analytics['total_events'], 1)
        # Event without items is neither in_progress nor completed
        self.assertEqual(analytics['events_by_status']['in_progress'], 0)
        self.assertEqual(analytics['events_by_status']['completed'], 0)
        self.assertEqual(analytics['labeling_items']['total'], 0)

    def test_nonexistent_project(self):
        """Test analytics returns None for non-existent project."""
        analytics = get_aviation_project_analytics(99999)

        self.assertIsNone(analytics)

    def test_status_breakdown_accuracy(self):
        """Test accurate counting of all status types."""
        # Create items in all 4 statuses
        task1 = TaskFactory(project=self.project)
        task2 = TaskFactory(project=self.project)
        task3 = TaskFactory(project=self.project)
        task4 = TaskFactory(project=self.project)

        event1 = AviationEventFactory(task=task1)
        event2 = AviationEventFactory(task=task2)
        event3 = AviationEventFactory(task=task3)
        event4 = AviationEventFactory(task=task4)

        LabelingItemFactory(event=event1, status='draft', created_by=self.user)
        LabelingItemFactory(event=event2, status='submitted', created_by=self.user)
        LabelingItemFactory(event=event3, status='reviewed', created_by=self.user)
        LabelingItemFactory(event=event4, status='approved', created_by=self.user)

        analytics = get_aviation_project_analytics(self.aviation_project.id)

        self.assertEqual(analytics['labeling_items']['by_status']['draft'], 1)
        self.assertEqual(analytics['labeling_items']['by_status']['submitted'], 1)
        self.assertEqual(analytics['labeling_items']['by_status']['reviewed'], 1)
        self.assertEqual(analytics['labeling_items']['by_status']['approved'], 1)
        self.assertEqual(analytics['labeling_items']['total'], 4)


class TestCoreProjectAnalytics(TestCase):
    """Test analytics for Label Studio core projects."""

    def setUp(self):
        self.organization = OrganizationFactory()
        self.project = ProjectFactory(organization=self.organization)
        self.user = UserFactory()

    def test_all_tasks_labeled(self):
        """Test analytics when all tasks are labeled."""
        # Create labeled tasks
        TaskFactory(project=self.project, is_labeled=True)
        TaskFactory(project=self.project, is_labeled=True)
        TaskFactory(project=self.project, is_labeled=True)

        analytics = get_core_project_analytics(self.project.id)

        self.assertIsNotNone(analytics)
        self.assertEqual(analytics['project_id'], self.project.id)
        self.assertEqual(analytics['project_type'], 'core')
        self.assertEqual(analytics['task_number'], 3)
        self.assertEqual(analytics['finished_task_number'], 3)
        self.assertEqual(analytics['in_progress_tasks'], 0)

    def test_mixed_labeled_tasks(self):
        """Test analytics with mixed task states."""
        # Create mix of labeled and unlabeled tasks
        TaskFactory(project=self.project, is_labeled=True)
        TaskFactory(project=self.project, is_labeled=True)
        TaskFactory(project=self.project, is_labeled=False)
        TaskFactory(project=self.project, is_labeled=False)

        analytics = get_core_project_analytics(self.project.id)

        self.assertEqual(analytics['task_number'], 4)
        self.assertEqual(analytics['finished_task_number'], 2)

    def test_in_progress_tasks(self):
        """Test tasks with annotations but not labeled."""
        # Create tasks with annotations but not labeled (in_progress)
        task1 = TaskFactory(project=self.project, is_labeled=False)
        task2 = TaskFactory(project=self.project, is_labeled=False)
        task3 = TaskFactory(project=self.project, is_labeled=False)

        # Add annotations to task1 and task2 (making them in_progress)
        AnnotationFactory(task=task1, project=self.project)
        AnnotationFactory(task=task2, project=self.project)
        # task3 has no annotations (not in_progress, just unlabeled)

        analytics = get_core_project_analytics(self.project.id)

        self.assertEqual(analytics['task_number'], 3)
        self.assertEqual(analytics['finished_task_number'], 0)
        self.assertEqual(analytics['in_progress_tasks'], 2)

    def test_empty_project(self):
        """Test analytics for project with no tasks."""
        analytics = get_core_project_analytics(self.project.id)

        self.assertIsNotNone(analytics)
        self.assertEqual(analytics['project_id'], self.project.id)
        self.assertEqual(analytics['task_number'], 0)
        self.assertEqual(analytics['finished_task_number'], 0)
        self.assertEqual(analytics['in_progress_tasks'], 0)

    def test_nonexistent_project(self):
        """Test analytics returns None for non-existent project."""
        analytics = get_core_project_analytics(99999)

        self.assertIsNone(analytics)

    def test_labeled_tasks_not_counted_as_in_progress(self):
        """Test that labeled tasks with annotations are not counted as in_progress."""
        # Create task with annotation first, then mark as labeled
        # Note: AnnotationFactory triggers post_save signal that recalculates is_labeled
        # so we need to set is_labeled after annotations are created
        task = TaskFactory(project=self.project, is_labeled=False)
        AnnotationFactory(task=task, project=self.project)
        # Manually mark as labeled (simulating completion criteria met)
        task.is_labeled = True
        task.save(update_fields=['is_labeled'])

        analytics = get_core_project_analytics(self.project.id)

        self.assertEqual(analytics['task_number'], 1)
        self.assertEqual(analytics['finished_task_number'], 1)
        # Labeled task should NOT be counted as in_progress
        self.assertEqual(analytics['in_progress_tasks'], 0)

    def test_complex_scenario(self):
        """Test complex scenario with various task states."""
        # 2 labeled tasks (finished) - one with annotation, one without
        # Note: Creating annotations triggers signals that recalculate is_labeled
        task1 = TaskFactory(project=self.project, is_labeled=False)
        AnnotationFactory(task=task1, project=self.project)
        task1.is_labeled = True
        task1.save(update_fields=['is_labeled'])

        task2 = TaskFactory(project=self.project, is_labeled=True)  # No annotation, just marked labeled

        # 3 unlabeled tasks with annotations (in_progress)
        task3 = TaskFactory(project=self.project, is_labeled=False)
        task4 = TaskFactory(project=self.project, is_labeled=False)
        task5 = TaskFactory(project=self.project, is_labeled=False)
        AnnotationFactory(task=task3, project=self.project)
        AnnotationFactory(task=task4, project=self.project)
        AnnotationFactory(task=task5, project=self.project)

        # 2 unlabeled tasks without annotations (just unlabeled)
        TaskFactory(project=self.project, is_labeled=False)
        TaskFactory(project=self.project, is_labeled=False)

        analytics = get_core_project_analytics(self.project.id)

        self.assertEqual(analytics['task_number'], 7)
        self.assertEqual(analytics['finished_task_number'], 2)
        self.assertEqual(analytics['in_progress_tasks'], 3)
