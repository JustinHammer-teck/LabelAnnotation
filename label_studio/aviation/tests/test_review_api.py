"""
Tests for Review API endpoints.

TDD Phase: RED - Tests written before implementation.
These tests define the expected behavior for the aviation review API endpoints:
- ReviewApproveAPI: POST /api/aviation/items/<pk>/approve/
- ReviewRejectAPI: POST /api/aviation/items/<pk>/reject/
- ReviewRevisionAPI: POST /api/aviation/items/<pk>/revision/
- ReviewResubmitAPI: POST /api/aviation/items/<pk>/resubmit/
- ReviewHistoryAPI: GET /api/aviation/items/<pk>/review-history/
"""

import pytest
from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient

from organizations.tests.factories import OrganizationFactory
from projects.tests.factories import ProjectFactory
from tasks.tests.factories import TaskFactory

from aviation.models import (
    LabelingItem,
    ReviewDecision,
    FieldFeedback,
)
from aviation.tests.factories import (
    AviationEventFactory,
    LabelingItemFactory,
)


User = get_user_model()


class TestReviewApproveAPI(TestCase):
    """Test cases for ReviewApproveAPI endpoint."""

    def setUp(self):
        """Set up test fixtures."""
        self.organization = OrganizationFactory()
        self.project = ProjectFactory(organization=self.organization)

        # Create admin/reviewer user
        self.reviewer = User.objects.create_user(
            email='reviewer@test.com',
            password='testpass123'
        )
        self.reviewer.active_organization = self.organization
        self.reviewer.save()

        # Create annotator user (no review permissions)
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

        self.client = APIClient()
        self.url = reverse('aviation:item-approve', kwargs={'pk': self.labeling_item.pk})

    def test_approve_requires_authentication(self):
        """Unauthenticated request returns 401."""
        response = self.client.post(self.url, {})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_approve_creates_review_decision(self):
        """Successful approval creates ReviewDecision with status 'approved'."""
        self.client.force_authenticate(user=self.reviewer)

        response = self.client.post(self.url, {}, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify ReviewDecision was created
        decision = ReviewDecision.objects.filter(
            labeling_item=self.labeling_item,
            status='approved'
        ).first()
        self.assertIsNotNone(decision)
        self.assertEqual(decision.reviewer, self.reviewer)

    def test_approve_updates_labeling_item_status(self):
        """Approval sets LabelingItem.status to 'approved'."""
        self.client.force_authenticate(user=self.reviewer)

        response = self.client.post(self.url, {}, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Refresh from database
        self.labeling_item.refresh_from_db()
        self.assertEqual(self.labeling_item.status, 'approved')
        self.assertEqual(self.labeling_item.reviewed_by, self.reviewer)
        self.assertIsNotNone(self.labeling_item.reviewed_at)

    def test_approve_with_comment(self):
        """Comment is saved in reviewer_comment."""
        self.client.force_authenticate(user=self.reviewer)

        response = self.client.post(
            self.url,
            {'comment': 'Excellent work!'},
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        decision = ReviewDecision.objects.filter(
            labeling_item=self.labeling_item
        ).first()
        self.assertEqual(decision.reviewer_comment, 'Excellent work!')

    def test_approve_returns_review_decision(self):
        """Response contains the created ReviewDecision data."""
        self.client.force_authenticate(user=self.reviewer)

        response = self.client.post(self.url, {}, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('id', response.data)
        self.assertIn('status', response.data)
        self.assertEqual(response.data['status'], 'approved')

    def test_approve_nonexistent_item_returns_404(self):
        """Approving a nonexistent item returns 404."""
        self.client.force_authenticate(user=self.reviewer)
        url = reverse('aviation:item-approve', kwargs={'pk': 99999})

        response = self.client.post(url, {}, format='json')

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class TestReviewRejectAPI(TestCase):
    """Test cases for ReviewRejectAPI endpoint."""

    def setUp(self):
        """Set up test fixtures."""
        self.organization = OrganizationFactory()
        self.project = ProjectFactory(organization=self.organization)

        self.reviewer = User.objects.create_user(
            email='reviewer@test.com',
            password='testpass123'
        )
        self.reviewer.active_organization = self.organization
        self.reviewer.save()

        self.task = TaskFactory(project=self.project)
        self.event = AviationEventFactory(task=self.task)
        self.labeling_item = LabelingItemFactory(
            event=self.event,
            status='submitted'
        )

        self.client = APIClient()
        self.url = reverse('aviation:item-reject', kwargs={'pk': self.labeling_item.pk})

    def test_reject_requires_authentication(self):
        """Unauthenticated request returns 401."""
        response = self.client.post(self.url, {})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_reject_requires_field_feedbacks(self):
        """Rejection without field_feedbacks returns 400."""
        self.client.force_authenticate(user=self.reviewer)

        response = self.client.post(
            self.url,
            {'status': 'rejected_partial', 'comment': 'Needs work'},
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('field_feedbacks', str(response.data).lower())

    def test_reject_creates_field_feedback_records(self):
        """Rejection creates FieldFeedback for each field."""
        self.client.force_authenticate(user=self.reviewer)

        response = self.client.post(
            self.url,
            {
                'status': 'rejected_partial',
                'comment': 'Some issues found',
                'field_feedbacks': [
                    {
                        'field_name': 'threat_type_l1',
                        'feedback_type': 'partial',
                        'feedback_comment': 'Wrong category'
                    },
                    {
                        'field_name': 'error_management',
                        'feedback_type': 'full',
                        'feedback_comment': 'Completely incorrect'
                    }
                ]
            },
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify FieldFeedback records were created
        feedbacks = FieldFeedback.objects.filter(labeling_item=self.labeling_item)
        self.assertEqual(feedbacks.count(), 2)

        field_names = list(feedbacks.values_list('field_name', flat=True))
        self.assertIn('threat_type_l1', field_names)
        self.assertIn('error_management', field_names)

    def test_reject_sets_pending_revision_status(self):
        """Rejection sets LabelingItem.status to 'reviewed'."""
        self.client.force_authenticate(user=self.reviewer)

        response = self.client.post(
            self.url,
            {
                'status': 'rejected_partial',
                'comment': 'Needs revision',
                'field_feedbacks': [
                    {
                        'field_name': 'threat_type_l1',
                        'feedback_type': 'partial',
                        'feedback_comment': 'Check again'
                    }
                ]
            },
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.labeling_item.refresh_from_db()
        self.assertEqual(self.labeling_item.status, 'reviewed')

    def test_reject_creates_review_decision(self):
        """Rejection creates ReviewDecision with correct status."""
        self.client.force_authenticate(user=self.reviewer)

        response = self.client.post(
            self.url,
            {
                'status': 'rejected_full',
                'comment': 'Complete redo needed',
                'field_feedbacks': [
                    {
                        'field_name': 'threat_type_l1',
                        'feedback_type': 'full',
                        'feedback_comment': 'All wrong'
                    }
                ]
            },
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        decision = ReviewDecision.objects.filter(
            labeling_item=self.labeling_item
        ).first()
        self.assertIsNotNone(decision)
        self.assertEqual(decision.status, 'rejected_full')
        self.assertEqual(decision.reviewer_comment, 'Complete redo needed')

    def test_reject_links_feedbacks_to_decision(self):
        """Field feedbacks are linked to the review decision."""
        self.client.force_authenticate(user=self.reviewer)

        response = self.client.post(
            self.url,
            {
                'status': 'rejected_partial',
                'comment': 'Issues found',
                'field_feedbacks': [
                    {
                        'field_name': 'threat_type_l1',
                        'feedback_type': 'partial',
                        'feedback_comment': 'Review this'
                    }
                ]
            },
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        decision = ReviewDecision.objects.filter(
            labeling_item=self.labeling_item
        ).first()
        feedbacks = decision.field_feedbacks.all()
        self.assertEqual(feedbacks.count(), 1)
        self.assertEqual(feedbacks.first().field_name, 'threat_type_l1')


class TestReviewRevisionAPI(TestCase):
    """Test cases for ReviewRevisionAPI endpoint."""

    def setUp(self):
        """Set up test fixtures."""
        self.organization = OrganizationFactory()
        self.project = ProjectFactory(organization=self.organization)

        self.reviewer = User.objects.create_user(
            email='reviewer@test.com',
            password='testpass123'
        )
        self.reviewer.active_organization = self.organization
        self.reviewer.save()

        self.task = TaskFactory(project=self.project)
        self.event = AviationEventFactory(task=self.task)
        self.labeling_item = LabelingItemFactory(
            event=self.event,
            status='submitted'
        )

        self.client = APIClient()
        self.url = reverse('aviation:item-revision', kwargs={'pk': self.labeling_item.pk})

    def test_revision_requires_authentication(self):
        """Unauthenticated request returns 401."""
        response = self.client.post(self.url, {})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_revision_creates_decision(self):
        """Revision request creates ReviewDecision with status 'revision_requested'."""
        self.client.force_authenticate(user=self.reviewer)

        response = self.client.post(
            self.url,
            {
                'comment': 'Please clarify the threat type',
                'field_feedbacks': [
                    {
                        'field_name': 'threat_description',
                        'feedback_type': 'revision',
                        'feedback_comment': 'Need more detail'
                    }
                ]
            },
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        decision = ReviewDecision.objects.filter(
            labeling_item=self.labeling_item
        ).first()
        self.assertIsNotNone(decision)
        self.assertEqual(decision.status, 'revision_requested')
        self.assertEqual(decision.reviewer_comment, 'Please clarify the threat type')

    def test_revision_creates_field_feedbacks(self):
        """Revision request creates FieldFeedback records."""
        self.client.force_authenticate(user=self.reviewer)

        response = self.client.post(
            self.url,
            {
                'comment': 'Clarification needed',
                'field_feedbacks': [
                    {
                        'field_name': 'error_description',
                        'feedback_type': 'revision',
                        'feedback_comment': 'What caused this error?'
                    }
                ]
            },
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        feedbacks = FieldFeedback.objects.filter(labeling_item=self.labeling_item)
        self.assertEqual(feedbacks.count(), 1)
        self.assertEqual(feedbacks.first().feedback_type, 'revision')

    def test_revision_updates_item_status(self):
        """Revision request sets LabelingItem.status to 'reviewed'."""
        self.client.force_authenticate(user=self.reviewer)

        response = self.client.post(
            self.url,
            {
                'comment': 'Please review',
                'field_feedbacks': [
                    {
                        'field_name': 'threat_type_l1',
                        'feedback_type': 'revision',
                        'feedback_comment': 'Confirm category'
                    }
                ]
            },
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.labeling_item.refresh_from_db()
        self.assertEqual(self.labeling_item.status, 'reviewed')


class TestReviewResubmitAPI(TestCase):
    """Test cases for ReviewResubmitAPI endpoint."""

    def setUp(self):
        """Set up test fixtures."""
        self.organization = OrganizationFactory()
        self.project = ProjectFactory(organization=self.organization)

        self.annotator = User.objects.create_user(
            email='annotator@test.com',
            password='testpass123'
        )
        self.annotator.active_organization = self.organization
        self.annotator.save()

        self.task = TaskFactory(project=self.project)
        self.event = AviationEventFactory(task=self.task)
        self.labeling_item = LabelingItemFactory(
            event=self.event,
            status='reviewed',  # Item has been reviewed and needs resubmission
            created_by=self.annotator
        )

        self.client = APIClient()
        self.url = reverse('aviation:item-resubmit', kwargs={'pk': self.labeling_item.pk})

    def test_resubmit_requires_authentication(self):
        """Unauthenticated request returns 401."""
        response = self.client.post(self.url, {})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_resubmit_changes_status_to_submitted(self):
        """Resubmit sets status back to 'submitted'."""
        self.client.force_authenticate(user=self.annotator)

        response = self.client.post(self.url, {}, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.labeling_item.refresh_from_db()
        self.assertEqual(self.labeling_item.status, 'submitted')

    def test_resubmit_with_comment(self):
        """Resubmit can include an optional comment."""
        self.client.force_authenticate(user=self.annotator)

        response = self.client.post(
            self.url,
            {'comment': 'Fixed the issues mentioned'},
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_resubmit_returns_labeling_item(self):
        """Response contains the updated LabelingItem data."""
        self.client.force_authenticate(user=self.annotator)

        response = self.client.post(self.url, {}, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('id', response.data)
        self.assertIn('status', response.data)
        self.assertEqual(response.data['status'], 'submitted')


class TestReviewHistoryAPI(TestCase):
    """Test cases for ReviewHistoryAPI endpoint."""

    def setUp(self):
        """Set up test fixtures."""
        self.organization = OrganizationFactory()
        self.project = ProjectFactory(organization=self.organization)

        self.user = User.objects.create_user(
            email='user@test.com',
            password='testpass123'
        )
        self.user.active_organization = self.organization
        self.user.save()

        self.task = TaskFactory(project=self.project)
        self.event = AviationEventFactory(task=self.task)
        self.labeling_item = LabelingItemFactory(
            event=self.event,
            status='reviewed'
        )

        self.client = APIClient()
        self.url = reverse('aviation:item-review-history', kwargs={'pk': self.labeling_item.pk})

    def test_history_requires_authentication(self):
        """Unauthenticated request returns 401."""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_history_returns_all_decisions(self):
        """Returns all review decisions for item."""
        self.client.force_authenticate(user=self.user)

        # Create multiple review decisions
        ReviewDecision.objects.create(
            labeling_item=self.labeling_item,
            status='revision_requested',
            reviewer=self.user,
            reviewer_comment='First review'
        )
        ReviewDecision.objects.create(
            labeling_item=self.labeling_item,
            status='approved',
            reviewer=self.user,
            reviewer_comment='Approved on second review'
        )

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('decisions', response.data)
        self.assertEqual(len(response.data['decisions']), 2)

    def test_history_includes_field_feedbacks(self):
        """Each decision includes nested field_feedbacks."""
        self.client.force_authenticate(user=self.user)

        decision = ReviewDecision.objects.create(
            labeling_item=self.labeling_item,
            status='rejected_partial',
            reviewer=self.user,
            reviewer_comment='Some issues'
        )
        FieldFeedback.objects.create(
            review_decision=decision,
            labeling_item=self.labeling_item,
            field_name='threat_type_l1',
            feedback_type='partial',
            feedback_comment='Check this',
            reviewed_by=self.user
        )
        FieldFeedback.objects.create(
            review_decision=decision,
            labeling_item=self.labeling_item,
            field_name='error_management',
            feedback_type='full',
            feedback_comment='Redo this',
            reviewed_by=self.user
        )

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['decisions']), 1)
        decision_data = response.data['decisions'][0]
        self.assertIn('field_feedbacks', decision_data)
        self.assertEqual(len(decision_data['field_feedbacks']), 2)

    def test_history_includes_pending_fields(self):
        """Response includes pending_revision_fields."""
        self.client.force_authenticate(user=self.user)

        decision = ReviewDecision.objects.create(
            labeling_item=self.labeling_item,
            status='revision_requested',
            reviewer=self.user
        )
        FieldFeedback.objects.create(
            review_decision=decision,
            labeling_item=self.labeling_item,
            field_name='threat_type_l1',
            feedback_type='revision',
            reviewed_by=self.user
        )
        FieldFeedback.objects.create(
            review_decision=decision,
            labeling_item=self.labeling_item,
            field_name='error_description',
            feedback_type='revision',
            reviewed_by=self.user
        )

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('pending_revision_fields', response.data)
        pending_fields = response.data['pending_revision_fields']
        self.assertIn('threat_type_l1', pending_fields)
        self.assertIn('error_description', pending_fields)

    def test_history_includes_current_status(self):
        """Response includes current_status from labeling item."""
        self.client.force_authenticate(user=self.user)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('current_status', response.data)
        self.assertEqual(response.data['current_status'], 'reviewed')

    def test_history_empty_for_new_item(self):
        """Returns empty decisions list for item with no reviews."""
        self.client.force_authenticate(user=self.user)

        # Create a fresh labeling item with no reviews
        new_item = LabelingItemFactory(event=self.event, status='submitted')
        url = reverse('aviation:item-review-history', kwargs={'pk': new_item.pk})

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['decisions']), 0)
        self.assertEqual(response.data['pending_revision_fields'], [])

    def test_history_nonexistent_item_returns_404(self):
        """Getting history for nonexistent item returns 404."""
        self.client.force_authenticate(user=self.user)
        url = reverse('aviation:item-review-history', kwargs={'pk': 99999})

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
