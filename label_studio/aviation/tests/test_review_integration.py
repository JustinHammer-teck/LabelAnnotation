"""
Integration tests for the Aviation Review System.

Phase 5: End-to-End Tests

These tests cover complete user flows and integration scenarios for the
aviation review system, including:
- Complete approval workflows
- Rejection and revision cycles
- Permission enforcement
- Edge cases and error handling
- Data integrity and cascade behavior
"""

import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from organizations.tests.factories import OrganizationFactory
from projects.tests.factories import ProjectFactory
from tasks.tests.factories import TaskFactory

from aviation.models import (
    FieldFeedback,
    LabelingItem,
    ReviewDecision,
)
from aviation.tests.factories import (
    AviationEventFactory,
    FieldFeedbackFactory,
    LabelingItemFactory,
    ReviewDecisionFactory,
)


User = get_user_model()


@pytest.fixture
def api_client():
    """Return a fresh APIClient instance."""
    return APIClient()


@pytest.fixture
def organization():
    """Create a test organization."""
    return OrganizationFactory()


@pytest.fixture
def project(organization):
    """Create a test project."""
    return ProjectFactory(organization=organization)


@pytest.fixture
def annotator_user(organization):
    """Create an annotator user."""
    user = User.objects.create_user(
        email='annotator@test.com',
        password='testpass123'
    )
    user.active_organization = organization
    user.save()
    return user


@pytest.fixture
def reviewer_user(organization):
    """Create a reviewer user."""
    user = User.objects.create_user(
        email='reviewer@test.com',
        password='testpass123'
    )
    user.active_organization = organization
    user.save()
    return user


@pytest.fixture
def second_reviewer_user(organization):
    """Create a second reviewer user."""
    user = User.objects.create_user(
        email='reviewer2@test.com',
        password='testpass123'
    )
    user.active_organization = organization
    user.save()
    return user


@pytest.fixture
def task(project):
    """Create a test task."""
    return TaskFactory(project=project)


@pytest.fixture
def aviation_event(task):
    """Create a test aviation event."""
    return AviationEventFactory(task=task)


@pytest.fixture
def submitted_labeling_item(aviation_event, annotator_user):
    """Create a submitted labeling item."""
    return LabelingItemFactory(
        event=aviation_event,
        status='submitted',
        created_by=annotator_user
    )


@pytest.fixture
def reviewed_labeling_item(aviation_event, annotator_user):
    """Create a reviewed labeling item (pending revision)."""
    return LabelingItemFactory(
        event=aviation_event,
        status='reviewed',
        created_by=annotator_user
    )


# =============================================================================
# Scenario 1: Complete Approval Flow
# =============================================================================


@pytest.mark.django_db
class TestScenario1CompleteApprovalFlow:
    """
    Test the complete approval workflow from submission to approval.

    Steps:
    1. Create LabelingItem with annotator
    2. Reviewer approves the item
    3. Verify item status becomes 'approved'
    4. Verify review history shows approval decision
    5. Test approval with and without comment
    """

    def test_complete_approval_flow_creates_decision(
        self, api_client, reviewer_user, submitted_labeling_item
    ):
        """Complete approval flow creates ReviewDecision with correct status."""
        api_client.force_authenticate(user=reviewer_user)
        url = reverse('aviation:item-approve', kwargs={'pk': submitted_labeling_item.pk})

        response = api_client.post(url, {}, format='json')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'approved'

        # Verify ReviewDecision was created
        decision = ReviewDecision.objects.filter(
            labeling_item=submitted_labeling_item
        ).first()
        assert decision is not None
        assert decision.status == 'approved'
        assert decision.reviewer == reviewer_user

    def test_complete_approval_flow_updates_item_status(
        self, api_client, reviewer_user, submitted_labeling_item
    ):
        """Approval updates LabelingItem status to 'approved'."""
        api_client.force_authenticate(user=reviewer_user)
        url = reverse('aviation:item-approve', kwargs={'pk': submitted_labeling_item.pk})

        response = api_client.post(url, {}, format='json')

        assert response.status_code == status.HTTP_200_OK

        submitted_labeling_item.refresh_from_db()
        assert submitted_labeling_item.status == 'approved'
        assert submitted_labeling_item.reviewed_by == reviewer_user
        assert submitted_labeling_item.reviewed_at is not None

    def test_complete_approval_flow_shows_in_history(
        self, api_client, reviewer_user, submitted_labeling_item
    ):
        """Approval appears in review history."""
        api_client.force_authenticate(user=reviewer_user)

        # First approve
        approve_url = reverse('aviation:item-approve', kwargs={'pk': submitted_labeling_item.pk})
        api_client.post(approve_url, {'comment': 'Well done!'}, format='json')

        # Then check history
        history_url = reverse('aviation:item-review-history', kwargs={'pk': submitted_labeling_item.pk})
        response = api_client.get(history_url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['current_status'] == 'approved'
        assert len(response.data['decisions']) == 1
        assert response.data['decisions'][0]['status'] == 'approved'
        assert response.data['decisions'][0]['reviewer_comment'] == 'Well done!'

    def test_approval_without_comment(
        self, api_client, reviewer_user, submitted_labeling_item
    ):
        """Approval works without a comment."""
        api_client.force_authenticate(user=reviewer_user)
        url = reverse('aviation:item-approve', kwargs={'pk': submitted_labeling_item.pk})

        response = api_client.post(url, {}, format='json')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['reviewer_comment'] == ''

    def test_approval_with_comment(
        self, api_client, reviewer_user, submitted_labeling_item
    ):
        """Approval properly saves the comment."""
        api_client.force_authenticate(user=reviewer_user)
        url = reverse('aviation:item-approve', kwargs={'pk': submitted_labeling_item.pk})

        response = api_client.post(
            url,
            {'comment': 'Excellent annotation work!'},
            format='json'
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data['reviewer_comment'] == 'Excellent annotation work!'

        decision = ReviewDecision.objects.get(labeling_item=submitted_labeling_item)
        assert decision.reviewer_comment == 'Excellent annotation work!'


# =============================================================================
# Scenario 2: Rejection and Revision Flow
# =============================================================================


@pytest.mark.django_db
class TestScenario2RejectionRevisionFlow:
    """
    Test the complete rejection and revision workflow.

    Steps:
    1. Annotator submits item
    2. Reviewer rejects with field-level feedback
    3. Annotator makes changes and resubmits
    4. Reviewer approves revised item
    5. Verify full audit trail in review history
    """

    def test_rejection_creates_decision_with_feedbacks(
        self, api_client, reviewer_user, submitted_labeling_item
    ):
        """Rejection creates ReviewDecision and FieldFeedback records."""
        api_client.force_authenticate(user=reviewer_user)
        url = reverse('aviation:item-reject', kwargs={'pk': submitted_labeling_item.pk})

        response = api_client.post(
            url,
            {
                'status': 'rejected_partial',
                'comment': 'Some issues found',
                'field_feedbacks': [
                    {
                        'field_name': 'threat_type_l1',
                        'feedback_type': 'partial',
                        'feedback_comment': 'Wrong category selected'
                    }
                ]
            },
            format='json'
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'rejected_partial'

        # Verify FieldFeedback was created
        feedbacks = FieldFeedback.objects.filter(labeling_item=submitted_labeling_item)
        assert feedbacks.count() == 1
        assert feedbacks.first().field_name == 'threat_type_l1'

    def test_rejection_updates_item_status_to_reviewed(
        self, api_client, reviewer_user, submitted_labeling_item
    ):
        """Rejection sets LabelingItem status to 'reviewed'."""
        api_client.force_authenticate(user=reviewer_user)
        url = reverse('aviation:item-reject', kwargs={'pk': submitted_labeling_item.pk})

        api_client.post(
            url,
            {
                'status': 'rejected_partial',
                'comment': 'Issues found',
                'field_feedbacks': [
                    {
                        'field_name': 'error_management',
                        'feedback_type': 'full',
                        'feedback_comment': 'Redo this field'
                    }
                ]
            },
            format='json'
        )

        submitted_labeling_item.refresh_from_db()
        assert submitted_labeling_item.status == 'reviewed'

    def test_complete_rejection_resubmit_approve_flow(
        self, api_client, reviewer_user, annotator_user, submitted_labeling_item
    ):
        """Complete flow: reject -> resubmit -> approve."""
        # Step 1: Reviewer rejects
        api_client.force_authenticate(user=reviewer_user)
        reject_url = reverse('aviation:item-reject', kwargs={'pk': submitted_labeling_item.pk})
        response = api_client.post(
            reject_url,
            {
                'status': 'rejected_partial',
                'comment': 'Please fix the threat type',
                'field_feedbacks': [
                    {
                        'field_name': 'threat_type_l1',
                        'feedback_type': 'partial',
                        'feedback_comment': 'Wrong threat category'
                    }
                ]
            },
            format='json'
        )
        assert response.status_code == status.HTTP_200_OK

        # Step 2: Annotator resubmits
        api_client.force_authenticate(user=annotator_user)
        resubmit_url = reverse('aviation:item-resubmit', kwargs={'pk': submitted_labeling_item.pk})
        response = api_client.post(
            resubmit_url,
            {'comment': 'Fixed the issue'},
            format='json'
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'submitted'

        # Step 3: Reviewer approves
        api_client.force_authenticate(user=reviewer_user)
        approve_url = reverse('aviation:item-approve', kwargs={'pk': submitted_labeling_item.pk})
        response = api_client.post(
            approve_url,
            {'comment': 'Looks good now'},
            format='json'
        )
        assert response.status_code == status.HTTP_200_OK

        # Verify final status
        submitted_labeling_item.refresh_from_db()
        assert submitted_labeling_item.status == 'approved'

    def test_full_audit_trail_in_review_history(
        self, api_client, reviewer_user, annotator_user, submitted_labeling_item
    ):
        """Review history shows complete audit trail of all decisions."""
        # Reject first
        api_client.force_authenticate(user=reviewer_user)
        reject_url = reverse('aviation:item-reject', kwargs={'pk': submitted_labeling_item.pk})
        api_client.post(
            reject_url,
            {
                'status': 'rejected_partial',
                'comment': 'Fix the threat',
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

        # Resubmit
        api_client.force_authenticate(user=annotator_user)
        resubmit_url = reverse('aviation:item-resubmit', kwargs={'pk': submitted_labeling_item.pk})
        api_client.post(resubmit_url, {}, format='json')

        # Approve
        api_client.force_authenticate(user=reviewer_user)
        approve_url = reverse('aviation:item-approve', kwargs={'pk': submitted_labeling_item.pk})
        api_client.post(approve_url, {'comment': 'Good now'}, format='json')

        # Check history
        history_url = reverse('aviation:item-review-history', kwargs={'pk': submitted_labeling_item.pk})
        response = api_client.get(history_url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['current_status'] == 'approved'
        # Should have 2 decisions: rejection and approval
        assert len(response.data['decisions']) == 2

        # Decisions are ordered by -created_at, so most recent first
        assert response.data['decisions'][0]['status'] == 'approved'
        assert response.data['decisions'][1]['status'] == 'rejected_partial'

    def test_revision_request_flow(
        self, api_client, reviewer_user, submitted_labeling_item
    ):
        """Revision request creates decision with status 'revision_requested'."""
        api_client.force_authenticate(user=reviewer_user)
        url = reverse('aviation:item-revision', kwargs={'pk': submitted_labeling_item.pk})

        response = api_client.post(
            url,
            {
                'comment': 'Need clarification',
                'field_feedbacks': [
                    {
                        'field_name': 'threat_description',
                        'feedback_type': 'revision',
                        'feedback_comment': 'Please provide more detail'
                    }
                ]
            },
            format='json'
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'revision_requested'

        submitted_labeling_item.refresh_from_db()
        assert submitted_labeling_item.status == 'reviewed'

    def test_multiple_field_feedbacks_in_rejection(
        self, api_client, reviewer_user, submitted_labeling_item
    ):
        """Rejection can include multiple field feedbacks."""
        api_client.force_authenticate(user=reviewer_user)
        url = reverse('aviation:item-reject', kwargs={'pk': submitted_labeling_item.pk})

        response = api_client.post(
            url,
            {
                'status': 'rejected_full',
                'comment': 'Multiple issues',
                'field_feedbacks': [
                    {
                        'field_name': 'threat_type_l1',
                        'feedback_type': 'full',
                        'feedback_comment': 'Completely wrong'
                    },
                    {
                        'field_name': 'error_management',
                        'feedback_type': 'partial',
                        'feedback_comment': 'Needs revision'
                    },
                    {
                        'field_name': 'uas_description',
                        'feedback_type': 'revision',
                        'feedback_comment': 'Clarify this'
                    }
                ]
            },
            format='json'
        )

        assert response.status_code == status.HTTP_200_OK

        feedbacks = FieldFeedback.objects.filter(labeling_item=submitted_labeling_item)
        assert feedbacks.count() == 3

        field_names = list(feedbacks.values_list('field_name', flat=True))
        assert 'threat_type_l1' in field_names
        assert 'error_management' in field_names
        assert 'uas_description' in field_names


# =============================================================================
# Scenario 3: Permission Enforcement
# =============================================================================


@pytest.mark.django_db
class TestScenario3PermissionEnforcement:
    """
    Test permission enforcement for review operations.

    Tests:
    1. Unauthenticated users get 401
    2. Annotator actions (resubmit allowed)
    3. Reviewer actions (approve/reject/revision allowed)
    4. All authenticated users can view history
    """

    def test_unauthenticated_approve_returns_401(
        self, api_client, submitted_labeling_item
    ):
        """Unauthenticated approve request returns 401."""
        url = reverse('aviation:item-approve', kwargs={'pk': submitted_labeling_item.pk})
        response = api_client.post(url, {}, format='json')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_unauthenticated_reject_returns_401(
        self, api_client, submitted_labeling_item
    ):
        """Unauthenticated reject request returns 401."""
        url = reverse('aviation:item-reject', kwargs={'pk': submitted_labeling_item.pk})
        response = api_client.post(url, {}, format='json')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_unauthenticated_revision_returns_401(
        self, api_client, submitted_labeling_item
    ):
        """Unauthenticated revision request returns 401."""
        url = reverse('aviation:item-revision', kwargs={'pk': submitted_labeling_item.pk})
        response = api_client.post(url, {}, format='json')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_unauthenticated_resubmit_returns_401(
        self, api_client, reviewed_labeling_item
    ):
        """Unauthenticated resubmit request returns 401."""
        url = reverse('aviation:item-resubmit', kwargs={'pk': reviewed_labeling_item.pk})
        response = api_client.post(url, {}, format='json')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_unauthenticated_history_returns_401(
        self, api_client, submitted_labeling_item
    ):
        """Unauthenticated history request returns 401."""
        url = reverse('aviation:item-review-history', kwargs={'pk': submitted_labeling_item.pk})
        response = api_client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_authenticated_user_can_view_history(
        self, api_client, annotator_user, submitted_labeling_item
    ):
        """Any authenticated user can view review history."""
        api_client.force_authenticate(user=annotator_user)
        url = reverse('aviation:item-review-history', kwargs={'pk': submitted_labeling_item.pk})

        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert 'current_status' in response.data
        assert 'decisions' in response.data

    def test_annotator_can_approve(
        self, api_client, annotator_user, submitted_labeling_item
    ):
        """Annotator can approve items (no role-based restriction currently)."""
        api_client.force_authenticate(user=annotator_user)
        url = reverse('aviation:item-approve', kwargs={'pk': submitted_labeling_item.pk})

        response = api_client.post(url, {}, format='json')

        # Currently the API allows any authenticated user to approve
        # This test documents current behavior
        assert response.status_code == status.HTTP_200_OK

    def test_annotator_can_resubmit(
        self, api_client, annotator_user, reviewed_labeling_item
    ):
        """Annotator can resubmit reviewed items."""
        api_client.force_authenticate(user=annotator_user)
        url = reverse('aviation:item-resubmit', kwargs={'pk': reviewed_labeling_item.pk})

        response = api_client.post(url, {}, format='json')

        assert response.status_code == status.HTTP_200_OK
        reviewed_labeling_item.refresh_from_db()
        assert reviewed_labeling_item.status == 'submitted'

    def test_reviewer_can_approve(
        self, api_client, reviewer_user, submitted_labeling_item
    ):
        """Reviewer can approve items."""
        api_client.force_authenticate(user=reviewer_user)
        url = reverse('aviation:item-approve', kwargs={'pk': submitted_labeling_item.pk})

        response = api_client.post(url, {}, format='json')

        assert response.status_code == status.HTTP_200_OK

    def test_reviewer_can_reject(
        self, api_client, reviewer_user, submitted_labeling_item
    ):
        """Reviewer can reject items."""
        api_client.force_authenticate(user=reviewer_user)
        url = reverse('aviation:item-reject', kwargs={'pk': submitted_labeling_item.pk})

        response = api_client.post(
            url,
            {
                'status': 'rejected_partial',
                'comment': 'Issues',
                'field_feedbacks': [
                    {
                        'field_name': 'threat_type_l1',
                        'feedback_type': 'partial',
                        'feedback_comment': 'Check this'
                    }
                ]
            },
            format='json'
        )

        assert response.status_code == status.HTTP_200_OK

    def test_reviewer_can_request_revision(
        self, api_client, reviewer_user, submitted_labeling_item
    ):
        """Reviewer can request revision."""
        api_client.force_authenticate(user=reviewer_user)
        url = reverse('aviation:item-revision', kwargs={'pk': submitted_labeling_item.pk})

        response = api_client.post(
            url,
            {
                'comment': 'Clarify please',
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

        assert response.status_code == status.HTTP_200_OK

    def test_user_from_different_organization_cannot_access_item(
        self, api_client, submitted_labeling_item
    ):
        """User from different organization gets 404 for item."""
        # Create user in different organization
        other_org = OrganizationFactory()
        other_user = User.objects.create_user(
            email='other@test.com',
            password='testpass123'
        )
        other_user.active_organization = other_org
        other_user.save()

        api_client.force_authenticate(user=other_user)
        url = reverse('aviation:item-approve', kwargs={'pk': submitted_labeling_item.pk})

        response = api_client.post(url, {}, format='json')

        assert response.status_code == status.HTTP_404_NOT_FOUND


# =============================================================================
# Scenario 4: Edge Cases
# =============================================================================


@pytest.mark.django_db
class TestScenario4EdgeCases:
    """
    Test edge cases and error handling.

    Tests:
    1. Approve item with no comment
    2. Reject with empty field_feedbacks array (should fail with 400)
    3. Review item that doesn't exist (404)
    4. Review history for new item (empty list)
    5. Multiple reviews create multiple history entries
    """

    def test_approve_with_empty_body(
        self, api_client, reviewer_user, submitted_labeling_item
    ):
        """Approval works with empty request body."""
        api_client.force_authenticate(user=reviewer_user)
        url = reverse('aviation:item-approve', kwargs={'pk': submitted_labeling_item.pk})

        response = api_client.post(url, {}, format='json')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'approved'

    def test_reject_without_field_feedbacks_returns_400(
        self, api_client, reviewer_user, submitted_labeling_item
    ):
        """Rejection without field_feedbacks returns 400."""
        api_client.force_authenticate(user=reviewer_user)
        url = reverse('aviation:item-reject', kwargs={'pk': submitted_labeling_item.pk})

        response = api_client.post(
            url,
            {
                'status': 'rejected_partial',
                'comment': 'Issues found'
            },
            format='json'
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'field_feedbacks' in str(response.data).lower()

    def test_reject_with_empty_field_feedbacks_returns_400(
        self, api_client, reviewer_user, submitted_labeling_item
    ):
        """Rejection with empty field_feedbacks array returns 400."""
        api_client.force_authenticate(user=reviewer_user)
        url = reverse('aviation:item-reject', kwargs={'pk': submitted_labeling_item.pk})

        response = api_client.post(
            url,
            {
                'status': 'rejected_partial',
                'comment': 'Issues found',
                'field_feedbacks': []
            },
            format='json'
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_approve_nonexistent_item_returns_404(
        self, api_client, reviewer_user
    ):
        """Approving nonexistent item returns 404."""
        api_client.force_authenticate(user=reviewer_user)
        url = reverse('aviation:item-approve', kwargs={'pk': 99999})

        response = api_client.post(url, {}, format='json')

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_reject_nonexistent_item_returns_404(
        self, api_client, reviewer_user
    ):
        """Rejecting nonexistent item returns 404."""
        api_client.force_authenticate(user=reviewer_user)
        url = reverse('aviation:item-reject', kwargs={'pk': 99999})

        response = api_client.post(
            url,
            {
                'status': 'rejected_partial',
                'field_feedbacks': [
                    {
                        'field_name': 'threat_type_l1',
                        'feedback_type': 'partial',
                        'feedback_comment': 'Check'
                    }
                ]
            },
            format='json'
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_revision_nonexistent_item_returns_404(
        self, api_client, reviewer_user
    ):
        """Requesting revision on nonexistent item returns 404."""
        api_client.force_authenticate(user=reviewer_user)
        url = reverse('aviation:item-revision', kwargs={'pk': 99999})

        response = api_client.post(
            url,
            {
                'comment': 'Clarify',
                'field_feedbacks': [
                    {
                        'field_name': 'threat_type_l1',
                        'feedback_type': 'revision',
                        'feedback_comment': 'Check'
                    }
                ]
            },
            format='json'
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_resubmit_nonexistent_item_returns_404(
        self, api_client, annotator_user
    ):
        """Resubmitting nonexistent item returns 404."""
        api_client.force_authenticate(user=annotator_user)
        url = reverse('aviation:item-resubmit', kwargs={'pk': 99999})

        response = api_client.post(url, {}, format='json')

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_history_nonexistent_item_returns_404(
        self, api_client, reviewer_user
    ):
        """Getting history for nonexistent item returns 404."""
        api_client.force_authenticate(user=reviewer_user)
        url = reverse('aviation:item-review-history', kwargs={'pk': 99999})

        response = api_client.get(url)

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_history_for_new_item_returns_empty_list(
        self, api_client, reviewer_user, submitted_labeling_item
    ):
        """History for new item returns empty decisions list."""
        api_client.force_authenticate(user=reviewer_user)
        url = reverse('aviation:item-review-history', kwargs={'pk': submitted_labeling_item.pk})

        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['current_status'] == 'submitted'
        assert len(response.data['decisions']) == 0
        assert response.data['pending_revision_fields'] == []

    def test_multiple_reviews_create_multiple_history_entries(
        self, api_client, reviewer_user, second_reviewer_user, submitted_labeling_item
    ):
        """Multiple reviews by different reviewers create separate history entries."""
        # First reviewer rejects
        api_client.force_authenticate(user=reviewer_user)
        reject_url = reverse('aviation:item-reject', kwargs={'pk': submitted_labeling_item.pk})
        api_client.post(
            reject_url,
            {
                'status': 'rejected_partial',
                'comment': 'First reviewer feedback',
                'field_feedbacks': [
                    {
                        'field_name': 'threat_type_l1',
                        'feedback_type': 'partial',
                        'feedback_comment': 'Check this'
                    }
                ]
            },
            format='json'
        )

        # Resubmit
        resubmit_url = reverse('aviation:item-resubmit', kwargs={'pk': submitted_labeling_item.pk})
        api_client.post(resubmit_url, {}, format='json')

        # Second reviewer approves
        api_client.force_authenticate(user=second_reviewer_user)
        approve_url = reverse('aviation:item-approve', kwargs={'pk': submitted_labeling_item.pk})
        api_client.post(
            approve_url,
            {'comment': 'Second reviewer approved'},
            format='json'
        )

        # Check history
        history_url = reverse('aviation:item-review-history', kwargs={'pk': submitted_labeling_item.pk})
        response = api_client.get(history_url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['decisions']) == 2

    def test_pending_revision_fields_after_rejection(
        self, api_client, reviewer_user, submitted_labeling_item
    ):
        """Pending revision fields are populated after rejection."""
        api_client.force_authenticate(user=reviewer_user)
        reject_url = reverse('aviation:item-reject', kwargs={'pk': submitted_labeling_item.pk})
        api_client.post(
            reject_url,
            {
                'status': 'rejected_partial',
                'comment': 'Issues',
                'field_feedbacks': [
                    {
                        'field_name': 'threat_type_l1',
                        'feedback_type': 'partial',
                        'feedback_comment': 'Check'
                    },
                    {
                        'field_name': 'error_management',
                        'feedback_type': 'full',
                        'feedback_comment': 'Redo'
                    }
                ]
            },
            format='json'
        )

        history_url = reverse('aviation:item-review-history', kwargs={'pk': submitted_labeling_item.pk})
        response = api_client.get(history_url)

        assert response.status_code == status.HTTP_200_OK
        pending_fields = response.data['pending_revision_fields']
        assert 'threat_type_l1' in pending_fields
        assert 'error_management' in pending_fields

    def test_pending_revision_fields_cleared_after_approval(
        self, api_client, reviewer_user, submitted_labeling_item
    ):
        """Pending revision fields are cleared after approval."""
        api_client.force_authenticate(user=reviewer_user)

        # First reject
        reject_url = reverse('aviation:item-reject', kwargs={'pk': submitted_labeling_item.pk})
        api_client.post(
            reject_url,
            {
                'status': 'rejected_partial',
                'comment': 'Issues',
                'field_feedbacks': [
                    {
                        'field_name': 'threat_type_l1',
                        'feedback_type': 'partial',
                        'feedback_comment': 'Check'
                    }
                ]
            },
            format='json'
        )

        # Resubmit
        resubmit_url = reverse('aviation:item-resubmit', kwargs={'pk': submitted_labeling_item.pk})
        api_client.post(resubmit_url, {}, format='json')

        # Then approve
        approve_url = reverse('aviation:item-approve', kwargs={'pk': submitted_labeling_item.pk})
        api_client.post(approve_url, {}, format='json')

        # Check history
        history_url = reverse('aviation:item-review-history', kwargs={'pk': submitted_labeling_item.pk})
        response = api_client.get(history_url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['pending_revision_fields'] == []


# =============================================================================
# Data Integrity Tests
# =============================================================================


@pytest.mark.django_db
class TestDataIntegrity:
    """
    Test data integrity and cascade delete behavior.

    Tests:
    1. ReviewDecision deletion cascades to FieldFeedback
    2. LabelingItem deletion cascades to ReviewDecision and FieldFeedback
    """

    def test_review_decision_delete_cascades_to_feedbacks(
        self, api_client, reviewer_user, submitted_labeling_item
    ):
        """Deleting ReviewDecision cascades to FieldFeedback."""
        api_client.force_authenticate(user=reviewer_user)

        # Create a rejection with feedbacks
        reject_url = reverse('aviation:item-reject', kwargs={'pk': submitted_labeling_item.pk})
        api_client.post(
            reject_url,
            {
                'status': 'rejected_partial',
                'comment': 'Issues',
                'field_feedbacks': [
                    {
                        'field_name': 'threat_type_l1',
                        'feedback_type': 'partial',
                        'feedback_comment': 'Check'
                    },
                    {
                        'field_name': 'error_management',
                        'feedback_type': 'full',
                        'feedback_comment': 'Redo'
                    }
                ]
            },
            format='json'
        )

        # Verify feedbacks exist
        assert FieldFeedback.objects.filter(labeling_item=submitted_labeling_item).count() == 2

        # Delete the decision
        decision = ReviewDecision.objects.get(labeling_item=submitted_labeling_item)
        decision.delete()

        # Verify feedbacks are gone
        assert FieldFeedback.objects.filter(labeling_item=submitted_labeling_item).count() == 0

    def test_labeling_item_delete_cascades_to_decisions(
        self, api_client, reviewer_user, submitted_labeling_item
    ):
        """Deleting LabelingItem cascades to ReviewDecision."""
        api_client.force_authenticate(user=reviewer_user)

        # Create an approval
        approve_url = reverse('aviation:item-approve', kwargs={'pk': submitted_labeling_item.pk})
        api_client.post(approve_url, {'comment': 'Good'}, format='json')

        # Verify decision exists
        item_id = submitted_labeling_item.pk
        assert ReviewDecision.objects.filter(labeling_item_id=item_id).exists()

        # Delete the labeling item
        submitted_labeling_item.delete()

        # Verify decisions are gone
        assert not ReviewDecision.objects.filter(labeling_item_id=item_id).exists()

    def test_labeling_item_delete_cascades_to_feedbacks(
        self, api_client, reviewer_user, submitted_labeling_item
    ):
        """Deleting LabelingItem cascades to FieldFeedback through ReviewDecision."""
        api_client.force_authenticate(user=reviewer_user)

        # Create a rejection with feedbacks
        reject_url = reverse('aviation:item-reject', kwargs={'pk': submitted_labeling_item.pk})
        api_client.post(
            reject_url,
            {
                'status': 'rejected_full',
                'comment': 'Redo',
                'field_feedbacks': [
                    {
                        'field_name': 'threat_type_l1',
                        'feedback_type': 'full',
                        'feedback_comment': 'Wrong'
                    }
                ]
            },
            format='json'
        )

        # Verify feedbacks exist
        item_id = submitted_labeling_item.pk
        assert FieldFeedback.objects.filter(labeling_item_id=item_id).exists()

        # Delete the labeling item
        submitted_labeling_item.delete()

        # Verify feedbacks are gone (cascaded through decision)
        assert not FieldFeedback.objects.filter(labeling_item_id=item_id).exists()

    def test_review_decision_stores_reviewer_info(
        self, api_client, reviewer_user, submitted_labeling_item
    ):
        """ReviewDecision correctly stores reviewer information."""
        api_client.force_authenticate(user=reviewer_user)
        url = reverse('aviation:item-approve', kwargs={'pk': submitted_labeling_item.pk})

        api_client.post(url, {'comment': 'Good work'}, format='json')

        decision = ReviewDecision.objects.get(labeling_item=submitted_labeling_item)
        assert decision.reviewer == reviewer_user
        assert decision.reviewer_comment == 'Good work'
        assert decision.created_at is not None

    def test_field_feedback_stores_reviewer_info(
        self, api_client, reviewer_user, submitted_labeling_item
    ):
        """FieldFeedback correctly stores reviewer information."""
        api_client.force_authenticate(user=reviewer_user)
        url = reverse('aviation:item-reject', kwargs={'pk': submitted_labeling_item.pk})

        api_client.post(
            url,
            {
                'status': 'rejected_partial',
                'field_feedbacks': [
                    {
                        'field_name': 'threat_type_l1',
                        'feedback_type': 'partial',
                        'feedback_comment': 'Check this field'
                    }
                ]
            },
            format='json'
        )

        feedback = FieldFeedback.objects.get(labeling_item=submitted_labeling_item)
        assert feedback.reviewed_by == reviewer_user
        assert feedback.field_name == 'threat_type_l1'
        assert feedback.feedback_type == 'partial'
        assert feedback.feedback_comment == 'Check this field'
        assert feedback.reviewed_at is not None


# =============================================================================
# Factory-Based Tests
# =============================================================================


@pytest.mark.django_db
class TestFactoryBasedScenarios:
    """
    Test scenarios using factory-created data.

    Tests integration between factories and API behavior.
    """

    def test_review_decision_factory_creates_valid_decision(
        self, api_client, reviewer_user, submitted_labeling_item
    ):
        """ReviewDecisionFactory creates valid ReviewDecision instances."""
        decision = ReviewDecisionFactory(
            labeling_item=submitted_labeling_item,
            reviewer=reviewer_user,
            status='approved'
        )

        assert decision.pk is not None
        assert decision.labeling_item == submitted_labeling_item
        assert decision.reviewer == reviewer_user
        assert decision.status == 'approved'

        # Verify it appears in history
        api_client.force_authenticate(user=reviewer_user)
        url = reverse('aviation:item-review-history', kwargs={'pk': submitted_labeling_item.pk})
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['decisions']) == 1

    def test_field_feedback_factory_creates_valid_feedback(
        self, api_client, reviewer_user, submitted_labeling_item
    ):
        """FieldFeedbackFactory creates valid FieldFeedback instances."""
        decision = ReviewDecisionFactory(
            labeling_item=submitted_labeling_item,
            reviewer=reviewer_user,
            status='rejected_partial'
        )
        feedback = FieldFeedbackFactory(
            review_decision=decision,
            labeling_item=submitted_labeling_item,
            reviewed_by=reviewer_user,
            field_name='error_management',
            feedback_type='partial'
        )

        assert feedback.pk is not None
        assert feedback.review_decision == decision
        assert feedback.labeling_item == submitted_labeling_item
        assert feedback.field_name == 'error_management'

        # Verify it appears in history
        api_client.force_authenticate(user=reviewer_user)
        url = reverse('aviation:item-review-history', kwargs={'pk': submitted_labeling_item.pk})
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['decisions']) == 1
        assert len(response.data['decisions'][0]['field_feedbacks']) == 1

    def test_history_includes_field_feedbacks_from_decision(
        self, api_client, reviewer_user, submitted_labeling_item
    ):
        """Review history includes nested field_feedbacks from decision."""
        decision = ReviewDecisionFactory(
            labeling_item=submitted_labeling_item,
            reviewer=reviewer_user,
            status='rejected_full',
            reviewer_comment='Multiple issues found'
        )
        FieldFeedbackFactory(
            review_decision=decision,
            labeling_item=submitted_labeling_item,
            reviewed_by=reviewer_user,
            field_name='threat_type_l1',
            feedback_type='full',
            feedback_comment='Completely wrong'
        )
        FieldFeedbackFactory(
            review_decision=decision,
            labeling_item=submitted_labeling_item,
            reviewed_by=reviewer_user,
            field_name='error_type_l2',
            feedback_type='partial',
            feedback_comment='Needs revision'
        )

        api_client.force_authenticate(user=reviewer_user)
        url = reverse('aviation:item-review-history', kwargs={'pk': submitted_labeling_item.pk})
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        decision_data = response.data['decisions'][0]
        assert decision_data['status'] == 'rejected_full'
        assert len(decision_data['field_feedbacks']) == 2

        feedback_fields = [f['field_name'] for f in decision_data['field_feedbacks']]
        assert 'threat_type_l1' in feedback_fields
        assert 'error_type_l2' in feedback_fields
