"""
Tests for Review Notification System.

TDD Phase: RED - Tests written before implementation.
These tests define the expected behavior for the aviation review notification system:
- Notifications sent to annotator on approve/reject/revision
- Notifications sent to reviewer on resubmit
- Correct notification paths and messages
"""

import pytest
from unittest.mock import patch, MagicMock
from django.test import TestCase
from django.contrib.auth import get_user_model

from organizations.tests.factories import OrganizationFactory
from projects.tests.factories import ProjectFactory
from tasks.tests.factories import TaskFactory

from aviation.models import (
    LabelingItem,
    ReviewDecision,
    AviationProject,
)
from aviation.tests.factories import (
    AviationEventFactory,
    AviationProjectFactory,
    LabelingItemFactory,
    ReviewDecisionFactory,
)


User = get_user_model()


class TestReviewNotifications(TestCase):
    """Test cases for review notification system."""

    def setUp(self):
        """Set up test fixtures."""
        self.organization = OrganizationFactory()
        self.project = ProjectFactory(organization=self.organization)
        self.aviation_project = AviationProject.objects.create(project=self.project)

        # Create reviewer user
        self.reviewer = User.objects.create_user(
            email='reviewer@test.com',
            password='testpass123'
        )
        self.reviewer.active_organization = self.organization
        self.reviewer.save()

        # Create annotator user
        self.annotator = User.objects.create_user(
            email='annotator@test.com',
            password='testpass123'
        )
        self.annotator.active_organization = self.organization
        self.annotator.save()

        # Create test data
        self.task = TaskFactory(project=self.project)
        self.event = AviationEventFactory(task=self.task)
        self.labeling_item = LabelingItemFactory(
            event=self.event,
            status='submitted',
            created_by=self.annotator
        )

    @patch('notifications.services.NotificationService')
    def test_approval_sends_notification_to_annotator(self, mock_notification_service):
        """Approving item notifies the annotator."""
        from aviation.services import send_review_notification

        # Create the review decision
        decision = ReviewDecision.objects.create(
            labeling_item=self.labeling_item,
            status='approved',
            reviewer=self.reviewer,
            reviewer_comment='Well done!'
        )

        # Mock the notification service
        mock_instance = MagicMock()
        mock_notification_service.return_value = mock_instance

        # Call the notification function
        send_review_notification(decision)

        # Verify notification was sent to the annotator
        mock_instance.send_notification_sync.assert_called_once()
        call_kwargs = mock_instance.send_notification_sync.call_args[1]
        self.assertEqual(call_kwargs['receive_user'], self.annotator)
        self.assertIn('approved', call_kwargs['message'].lower())

    @patch('notifications.services.NotificationService')
    def test_rejection_sends_notification_to_annotator(self, mock_notification_service):
        """Rejecting item notifies the annotator."""
        from aviation.services import send_review_notification

        # Create the review decision
        decision = ReviewDecision.objects.create(
            labeling_item=self.labeling_item,
            status='rejected_partial',
            reviewer=self.reviewer,
            reviewer_comment='Please fix the threat type'
        )

        # Mock the notification service
        mock_instance = MagicMock()
        mock_notification_service.return_value = mock_instance

        # Call the notification function
        send_review_notification(decision)

        # Verify notification was sent to the annotator
        mock_instance.send_notification_sync.assert_called_once()
        call_kwargs = mock_instance.send_notification_sync.call_args[1]
        self.assertEqual(call_kwargs['receive_user'], self.annotator)
        self.assertIn('rejected', call_kwargs['message'].lower())

    @patch('notifications.services.NotificationService')
    def test_revision_request_sends_notification_to_annotator(self, mock_notification_service):
        """Requesting revision notifies the annotator."""
        from aviation.services import send_review_notification

        # Create the review decision
        decision = ReviewDecision.objects.create(
            labeling_item=self.labeling_item,
            status='revision_requested',
            reviewer=self.reviewer,
            reviewer_comment='Please clarify the error description'
        )

        # Mock the notification service
        mock_instance = MagicMock()
        mock_notification_service.return_value = mock_instance

        # Call the notification function
        send_review_notification(decision)

        # Verify notification was sent to the annotator
        mock_instance.send_notification_sync.assert_called_once()
        call_kwargs = mock_instance.send_notification_sync.call_args[1]
        self.assertEqual(call_kwargs['receive_user'], self.annotator)
        self.assertIn('revision', call_kwargs['message'].lower())

    @patch('notifications.services.NotificationService')
    def test_resubmit_sends_notification_to_reviewer(self, mock_notification_service):
        """Resubmitting item notifies the last reviewer."""
        from aviation.services import send_resubmit_notification

        # Create a previous review decision
        previous_decision = ReviewDecision.objects.create(
            labeling_item=self.labeling_item,
            status='revision_requested',
            reviewer=self.reviewer,
            reviewer_comment='Please fix this'
        )

        # Mock the notification service
        mock_instance = MagicMock()
        mock_notification_service.return_value = mock_instance

        # Call the resubmit notification function
        send_resubmit_notification(self.labeling_item, self.annotator)

        # Verify notification was sent to the reviewer (not the annotator)
        mock_instance.send_notification_sync.assert_called_once()
        call_kwargs = mock_instance.send_notification_sync.call_args[1]
        self.assertEqual(call_kwargs['receive_user'], self.reviewer)
        self.assertIn('resubmit', call_kwargs['message'].lower())

    @patch('notifications.services.NotificationService')
    def test_notification_includes_correct_path(self, mock_notification_service):
        """Notification path links to the labeling item."""
        from aviation.services import send_review_notification

        # Create the review decision
        decision = ReviewDecision.objects.create(
            labeling_item=self.labeling_item,
            status='approved',
            reviewer=self.reviewer
        )

        # Mock the notification service
        mock_instance = MagicMock()
        mock_notification_service.return_value = mock_instance

        # Call the notification function
        send_review_notification(decision)

        # Verify the path is correct
        mock_instance.send_notification_sync.assert_called_once()
        call_kwargs = mock_instance.send_notification_sync.call_args[1]
        path = call_kwargs['path']

        # Path should include aviation project ID, event ID, and item ID
        self.assertIn(str(self.aviation_project.id), path)
        self.assertIn(str(self.event.id), path)
        self.assertIn(str(self.labeling_item.id), path)

    @patch('notifications.services.NotificationService')
    def test_notification_skips_if_no_recipient(self, mock_notification_service):
        """No error if created_by is null."""
        from aviation.services import send_review_notification

        # Create labeling item without created_by
        item_no_owner = LabelingItemFactory(
            event=self.event,
            status='submitted',
            created_by=None
        )

        # Create the review decision
        decision = ReviewDecision.objects.create(
            labeling_item=item_no_owner,
            status='approved',
            reviewer=self.reviewer
        )

        # Mock the notification service
        mock_instance = MagicMock()
        mock_notification_service.return_value = mock_instance

        # Call the notification function - should not raise error
        send_review_notification(decision)

        # Verify notification was NOT sent (no recipient)
        mock_instance.send_notification_sync.assert_not_called()


class TestNotificationEventTypes(TestCase):
    """Test that notification event types are properly defined."""

    def test_review_approved_event_type_exists(self):
        """REVIEW_APPROVED event type should exist."""
        from notifications.models import NotificationEventType

        self.assertTrue(hasattr(NotificationEventType, 'REVIEW_APPROVED'))

    def test_review_rejected_event_type_exists(self):
        """REVIEW_REJECTED event type should exist."""
        from notifications.models import NotificationEventType

        self.assertTrue(hasattr(NotificationEventType, 'REVIEW_REJECTED'))

    def test_review_revision_requested_event_type_exists(self):
        """REVIEW_REVISION_REQUESTED event type should exist."""
        from notifications.models import NotificationEventType

        self.assertTrue(hasattr(NotificationEventType, 'REVIEW_REVISION_REQUESTED'))

    def test_review_resubmitted_event_type_exists(self):
        """REVIEW_RESUBMITTED event type should exist."""
        from notifications.models import NotificationEventType

        self.assertTrue(hasattr(NotificationEventType, 'REVIEW_RESUBMITTED'))


class TestNotificationIntegration(TestCase):
    """Test notification integration with review API endpoints."""

    def setUp(self):
        """Set up test fixtures."""
        self.organization = OrganizationFactory()
        self.project = ProjectFactory(organization=self.organization)
        self.aviation_project = AviationProject.objects.create(project=self.project)

        # Create reviewer user
        self.reviewer = User.objects.create_user(
            email='reviewer@test.com',
            password='testpass123'
        )
        self.reviewer.active_organization = self.organization
        self.reviewer.save()

        # Create annotator user
        self.annotator = User.objects.create_user(
            email='annotator@test.com',
            password='testpass123'
        )
        self.annotator.active_organization = self.organization
        self.annotator.save()

        # Create test data
        self.task = TaskFactory(project=self.project)
        self.event = AviationEventFactory(task=self.task)
        self.labeling_item = LabelingItemFactory(
            event=self.event,
            status='submitted',
            created_by=self.annotator
        )

    @patch('aviation.services.send_review_notification')
    def test_approve_api_triggers_notification(self, mock_send_notification):
        """ReviewApproveAPI calls send_review_notification."""
        from django.urls import reverse
        from rest_framework.test import APIClient
        from rest_framework import status

        client = APIClient()
        client.force_authenticate(user=self.reviewer)

        url = reverse('aviation:item-approve', kwargs={'pk': self.labeling_item.pk})
        response = client.post(url, {}, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        mock_send_notification.assert_called_once()

    @patch('aviation.services.send_review_notification')
    def test_reject_api_triggers_notification(self, mock_send_notification):
        """ReviewRejectAPI calls send_review_notification."""
        from django.urls import reverse
        from rest_framework.test import APIClient
        from rest_framework import status

        client = APIClient()
        client.force_authenticate(user=self.reviewer)

        url = reverse('aviation:item-reject', kwargs={'pk': self.labeling_item.pk})
        response = client.post(
            url,
            {
                'status': 'rejected_partial',
                'comment': 'Issues found',
                'field_feedbacks': [
                    {
                        'field_name': 'threat_type_l1',
                        'feedback_type': 'partial',
                        'feedback_comment': 'Wrong category'
                    }
                ]
            },
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        mock_send_notification.assert_called_once()

    @patch('aviation.services.send_review_notification')
    def test_revision_api_triggers_notification(self, mock_send_notification):
        """ReviewRevisionAPI calls send_review_notification."""
        from django.urls import reverse
        from rest_framework.test import APIClient
        from rest_framework import status

        client = APIClient()
        client.force_authenticate(user=self.reviewer)

        url = reverse('aviation:item-revision', kwargs={'pk': self.labeling_item.pk})
        response = client.post(
            url,
            {
                'comment': 'Please clarify',
                'field_feedbacks': [
                    {
                        'field_name': 'error_description',
                        'feedback_type': 'revision',
                        'feedback_comment': 'Need more detail'
                    }
                ]
            },
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        mock_send_notification.assert_called_once()

    @patch('aviation.services.send_resubmit_notification')
    def test_resubmit_api_triggers_notification(self, mock_send_notification):
        """ReviewResubmitAPI calls send_resubmit_notification."""
        from django.urls import reverse
        from rest_framework.test import APIClient
        from rest_framework import status

        # First create a review decision so there's a reviewer to notify
        ReviewDecision.objects.create(
            labeling_item=self.labeling_item,
            status='revision_requested',
            reviewer=self.reviewer,
            reviewer_comment='Please fix'
        )

        # Update item status to reviewed (after revision request)
        self.labeling_item.status = 'reviewed'
        self.labeling_item.save()

        client = APIClient()
        client.force_authenticate(user=self.annotator)

        url = reverse('aviation:item-resubmit', kwargs={'pk': self.labeling_item.pk})
        response = client.post(url, {}, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        mock_send_notification.assert_called_once()
