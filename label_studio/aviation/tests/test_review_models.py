"""
Tests for ReviewDecision and FieldFeedback models.

TDD Phase: RED - Tests written before implementation.
These tests define the expected behavior for the aviation review system models.
"""

import pytest
from django.test import TestCase
from django.db import IntegrityError
from django.contrib.auth import get_user_model

from organizations.tests.factories import OrganizationFactory
from projects.tests.factories import ProjectFactory
from tasks.tests.factories import TaskFactory

from aviation.models import (
    AviationEvent,
    LabelingItem,
    ReviewDecision,
    FieldFeedback,
)
from aviation.tests.factories import (
    AviationEventFactory,
    LabelingItemFactory,
)


User = get_user_model()


class TestReviewDecisionModel(TestCase):
    """Test cases for ReviewDecision model."""

    def setUp(self):
        """Set up test fixtures."""
        self.organization = OrganizationFactory()
        self.project = ProjectFactory(organization=self.organization)
        self.user = User.objects.create_user(
            email='reviewer@test.com',
            password='testpass123'
        )
        self.task = TaskFactory(project=self.project)
        self.event = AviationEventFactory(task=self.task)
        self.labeling_item = LabelingItemFactory(event=self.event)

    def test_create_review_decision_approved(self):
        """Can create an approved review decision."""
        decision = ReviewDecision.objects.create(
            labeling_item=self.labeling_item,
            status='approved',
            reviewer=self.user,
            reviewer_comment='Looks good!'
        )

        self.assertIsNotNone(decision.id)
        self.assertEqual(decision.status, 'approved')
        self.assertEqual(decision.reviewer, self.user)
        self.assertEqual(decision.reviewer_comment, 'Looks good!')
        self.assertIsNotNone(decision.created_at)

    def test_create_review_decision_rejected_partial(self):
        """Can create a rejected (partial) review decision."""
        decision = ReviewDecision.objects.create(
            labeling_item=self.labeling_item,
            status='rejected_partial',
            reviewer=self.user,
            reviewer_comment='Some fields need revision.'
        )

        self.assertEqual(decision.status, 'rejected_partial')

    def test_create_review_decision_rejected_full(self):
        """Can create a rejected (full) review decision."""
        decision = ReviewDecision.objects.create(
            labeling_item=self.labeling_item,
            status='rejected_full',
            reviewer=self.user,
            reviewer_comment='Needs complete revision.'
        )

        self.assertEqual(decision.status, 'rejected_full')

    def test_create_review_decision_revision_requested(self):
        """Can create a revision requested review decision."""
        decision = ReviewDecision.objects.create(
            labeling_item=self.labeling_item,
            status='revision_requested',
            reviewer=self.user,
            reviewer_comment='Please clarify the threat type.'
        )

        self.assertEqual(decision.status, 'revision_requested')

    def test_review_decision_links_to_labeling_item(self):
        """Review decision has FK to labeling item."""
        decision = ReviewDecision.objects.create(
            labeling_item=self.labeling_item,
            status='approved',
            reviewer=self.user
        )

        self.assertEqual(decision.labeling_item, self.labeling_item)
        self.assertEqual(decision.labeling_item.id, self.labeling_item.id)
        # Test reverse relation
        self.assertIn(decision, self.labeling_item.review_decisions.all())

    def test_review_decision_links_to_reviewer(self):
        """Review decision has FK to reviewer user."""
        decision = ReviewDecision.objects.create(
            labeling_item=self.labeling_item,
            status='approved',
            reviewer=self.user
        )

        self.assertEqual(decision.reviewer, self.user)
        self.assertEqual(decision.reviewer.email, 'reviewer@test.com')

    def test_review_decision_cascade_delete_on_labeling_item(self):
        """Deleting labeling item cascades to review decisions."""
        decision = ReviewDecision.objects.create(
            labeling_item=self.labeling_item,
            status='approved',
            reviewer=self.user
        )
        decision_id = decision.id

        # Delete the labeling item
        self.labeling_item.delete()

        # Review decision should be deleted
        self.assertFalse(ReviewDecision.objects.filter(id=decision_id).exists())

    def test_review_decision_set_null_on_user_delete(self):
        """Deleting reviewer user sets reviewer to null."""
        decision = ReviewDecision.objects.create(
            labeling_item=self.labeling_item,
            status='approved',
            reviewer=self.user
        )
        decision_id = decision.id

        # Delete the user
        self.user.delete()

        # Review decision should still exist with null reviewer
        decision.refresh_from_db()
        self.assertIsNone(decision.reviewer)

    def test_review_decision_empty_comment_allowed(self):
        """Review decision allows empty comment."""
        decision = ReviewDecision.objects.create(
            labeling_item=self.labeling_item,
            status='approved',
            reviewer=self.user,
            reviewer_comment=''
        )

        self.assertEqual(decision.reviewer_comment, '')

    def test_review_decision_default_empty_comment(self):
        """Review decision defaults to empty comment."""
        decision = ReviewDecision.objects.create(
            labeling_item=self.labeling_item,
            status='approved',
            reviewer=self.user
        )

        self.assertEqual(decision.reviewer_comment, '')

    def test_review_decision_str_method(self):
        """Review decision has meaningful string representation."""
        decision = ReviewDecision.objects.create(
            labeling_item=self.labeling_item,
            status='approved',
            reviewer=self.user
        )

        str_repr = str(decision)
        # Should contain meaningful information
        self.assertIn('approved', str_repr.lower())

    def test_multiple_review_decisions_for_same_item(self):
        """Multiple review decisions can exist for same labeling item (audit trail)."""
        decision1 = ReviewDecision.objects.create(
            labeling_item=self.labeling_item,
            status='revision_requested',
            reviewer=self.user,
            reviewer_comment='First review'
        )
        decision2 = ReviewDecision.objects.create(
            labeling_item=self.labeling_item,
            status='approved',
            reviewer=self.user,
            reviewer_comment='Second review - approved'
        )

        self.assertEqual(self.labeling_item.review_decisions.count(), 2)
        self.assertIn(decision1, self.labeling_item.review_decisions.all())
        self.assertIn(decision2, self.labeling_item.review_decisions.all())


class TestFieldFeedbackModel(TestCase):
    """Test cases for FieldFeedback model."""

    def setUp(self):
        """Set up test fixtures."""
        self.organization = OrganizationFactory()
        self.project = ProjectFactory(organization=self.organization)
        self.user = User.objects.create_user(
            email='reviewer@test.com',
            password='testpass123'
        )
        self.task = TaskFactory(project=self.project)
        self.event = AviationEventFactory(task=self.task)
        self.labeling_item = LabelingItemFactory(event=self.event)
        self.review_decision = ReviewDecision.objects.create(
            labeling_item=self.labeling_item,
            status='rejected_partial',
            reviewer=self.user,
            reviewer_comment='Some fields need work.'
        )

    def test_create_field_feedback(self):
        """Can create field feedback for a review decision."""
        feedback = FieldFeedback.objects.create(
            review_decision=self.review_decision,
            labeling_item=self.labeling_item,
            field_name='threat_type_l1',
            feedback_type='partial',
            feedback_comment='Incorrect threat category selected.',
            reviewed_by=self.user
        )

        self.assertIsNotNone(feedback.id)
        self.assertEqual(feedback.field_name, 'threat_type_l1')
        self.assertEqual(feedback.feedback_type, 'partial')
        self.assertEqual(feedback.feedback_comment, 'Incorrect threat category selected.')
        self.assertIsNotNone(feedback.reviewed_at)

    def test_field_feedback_links_to_review_decision(self):
        """Field feedback has FK to review decision."""
        feedback = FieldFeedback.objects.create(
            review_decision=self.review_decision,
            labeling_item=self.labeling_item,
            field_name='error_type_l2',
            feedback_type='full',
            reviewed_by=self.user
        )

        self.assertEqual(feedback.review_decision, self.review_decision)
        # Test reverse relation
        self.assertIn(feedback, self.review_decision.field_feedbacks.all())

    def test_field_feedback_links_to_labeling_item(self):
        """Field feedback has FK to labeling item."""
        feedback = FieldFeedback.objects.create(
            review_decision=self.review_decision,
            labeling_item=self.labeling_item,
            field_name='uas_type_l3',
            feedback_type='revision',
            reviewed_by=self.user
        )

        self.assertEqual(feedback.labeling_item, self.labeling_item)

    def test_field_feedback_cascade_delete_on_review_decision(self):
        """Deleting review decision cascades to field feedbacks."""
        feedback = FieldFeedback.objects.create(
            review_decision=self.review_decision,
            labeling_item=self.labeling_item,
            field_name='threat_management',
            feedback_type='partial',
            reviewed_by=self.user
        )
        feedback_id = feedback.id

        # Delete the review decision
        self.review_decision.delete()

        # Field feedback should be deleted
        self.assertFalse(FieldFeedback.objects.filter(id=feedback_id).exists())

    def test_field_feedback_cascade_delete_on_labeling_item(self):
        """Deleting labeling item cascades to field feedbacks."""
        feedback = FieldFeedback.objects.create(
            review_decision=self.review_decision,
            labeling_item=self.labeling_item,
            field_name='error_impact',
            feedback_type='full',
            reviewed_by=self.user
        )
        feedback_id = feedback.id

        # Delete the labeling item (this also deletes review_decision)
        self.labeling_item.delete()

        # Field feedback should be deleted
        self.assertFalse(FieldFeedback.objects.filter(id=feedback_id).exists())

    def test_field_name_accepts_valid_values(self):
        """Field name accepts valid reviewable field names."""
        valid_field_names = [
            'threat_type_l1', 'threat_type_l2', 'threat_type_l3',
            'threat_management', 'threat_impact', 'threat_coping_abilities',
            'threat_description',
            'error_type_l1', 'error_type_l2', 'error_type_l3',
            'error_relevance', 'error_management', 'error_impact',
            'error_coping_abilities', 'error_description',
            'uas_type_l1', 'uas_type_l2', 'uas_type_l3',
            'uas_relevance', 'uas_management', 'uas_impact',
            'uas_coping_abilities', 'uas_description',
        ]

        for field_name in valid_field_names:
            feedback = FieldFeedback.objects.create(
                review_decision=self.review_decision,
                labeling_item=self.labeling_item,
                field_name=field_name,
                feedback_type='partial',
                reviewed_by=self.user
            )
            self.assertEqual(feedback.field_name, field_name)

    def test_feedback_type_choices(self):
        """Feedback type accepts valid choices."""
        valid_types = ['partial', 'full', 'revision']

        for feedback_type in valid_types:
            feedback = FieldFeedback.objects.create(
                review_decision=self.review_decision,
                labeling_item=self.labeling_item,
                field_name='threat_type_l1',
                feedback_type=feedback_type,
                reviewed_by=self.user
            )
            self.assertEqual(feedback.feedback_type, feedback_type)

    def test_field_feedback_empty_comment_allowed(self):
        """Field feedback allows empty comment."""
        feedback = FieldFeedback.objects.create(
            review_decision=self.review_decision,
            labeling_item=self.labeling_item,
            field_name='threat_type_l1',
            feedback_type='partial',
            feedback_comment='',
            reviewed_by=self.user
        )

        self.assertEqual(feedback.feedback_comment, '')

    def test_field_feedback_default_empty_comment(self):
        """Field feedback defaults to empty comment."""
        feedback = FieldFeedback.objects.create(
            review_decision=self.review_decision,
            labeling_item=self.labeling_item,
            field_name='threat_type_l1',
            feedback_type='partial',
            reviewed_by=self.user
        )

        self.assertEqual(feedback.feedback_comment, '')

    def test_field_feedback_set_null_on_user_delete(self):
        """Deleting reviewed_by user sets to null."""
        feedback = FieldFeedback.objects.create(
            review_decision=self.review_decision,
            labeling_item=self.labeling_item,
            field_name='threat_type_l1',
            feedback_type='partial',
            reviewed_by=self.user
        )
        feedback_id = feedback.id

        # Create new user for review decision before deleting original
        new_user = User.objects.create_user(
            email='newuser@test.com',
            password='testpass123'
        )
        self.review_decision.reviewer = new_user
        self.review_decision.save()

        # Delete the original user
        self.user.delete()

        # Field feedback should still exist with null reviewed_by
        feedback.refresh_from_db()
        self.assertIsNone(feedback.reviewed_by)

    def test_field_feedback_str_method(self):
        """Field feedback has meaningful string representation."""
        feedback = FieldFeedback.objects.create(
            review_decision=self.review_decision,
            labeling_item=self.labeling_item,
            field_name='threat_type_l1',
            feedback_type='partial',
            reviewed_by=self.user
        )

        str_repr = str(feedback)
        # Should contain field name info
        self.assertIn('threat_type_l1', str_repr)

    def test_multiple_field_feedbacks_per_decision(self):
        """Multiple field feedbacks can exist for one review decision."""
        feedback1 = FieldFeedback.objects.create(
            review_decision=self.review_decision,
            labeling_item=self.labeling_item,
            field_name='threat_type_l1',
            feedback_type='partial',
            reviewed_by=self.user
        )
        feedback2 = FieldFeedback.objects.create(
            review_decision=self.review_decision,
            labeling_item=self.labeling_item,
            field_name='error_type_l2',
            feedback_type='full',
            reviewed_by=self.user
        )
        feedback3 = FieldFeedback.objects.create(
            review_decision=self.review_decision,
            labeling_item=self.labeling_item,
            field_name='uas_description',
            feedback_type='revision',
            reviewed_by=self.user
        )

        self.assertEqual(self.review_decision.field_feedbacks.count(), 3)
        self.assertIn(feedback1, self.review_decision.field_feedbacks.all())
        self.assertIn(feedback2, self.review_decision.field_feedbacks.all())
        self.assertIn(feedback3, self.review_decision.field_feedbacks.all())


class TestReviewDecisionWithFieldFeedbackIntegration(TestCase):
    """Integration tests for ReviewDecision with FieldFeedback."""

    def setUp(self):
        """Set up test fixtures."""
        self.organization = OrganizationFactory()
        self.project = ProjectFactory(organization=self.organization)
        self.user = User.objects.create_user(
            email='reviewer@test.com',
            password='testpass123'
        )
        self.task = TaskFactory(project=self.project)
        self.event = AviationEventFactory(task=self.task)
        self.labeling_item = LabelingItemFactory(event=self.event)

    def test_create_decision_with_multiple_feedbacks(self):
        """Can create a review decision with multiple field feedbacks."""
        decision = ReviewDecision.objects.create(
            labeling_item=self.labeling_item,
            status='rejected_partial',
            reviewer=self.user,
            reviewer_comment='Multiple fields need revision.'
        )

        feedback1 = FieldFeedback.objects.create(
            review_decision=decision,
            labeling_item=self.labeling_item,
            field_name='threat_type_l1',
            feedback_type='partial',
            feedback_comment='Wrong category',
            reviewed_by=self.user
        )
        feedback2 = FieldFeedback.objects.create(
            review_decision=decision,
            labeling_item=self.labeling_item,
            field_name='error_management',
            feedback_type='full',
            feedback_comment='Management assessment incorrect',
            reviewed_by=self.user
        )

        # Verify relationships
        self.assertEqual(decision.field_feedbacks.count(), 2)
        self.assertEqual(feedback1.review_decision, decision)
        self.assertEqual(feedback2.review_decision, decision)

    def test_decision_deletion_cascades_to_all_feedbacks(self):
        """Deleting decision cascades to all associated feedbacks."""
        decision = ReviewDecision.objects.create(
            labeling_item=self.labeling_item,
            status='rejected_partial',
            reviewer=self.user
        )

        feedback_ids = []
        for field_name in ['threat_type_l1', 'error_type_l2', 'uas_description']:
            feedback = FieldFeedback.objects.create(
                review_decision=decision,
                labeling_item=self.labeling_item,
                field_name=field_name,
                feedback_type='partial',
                reviewed_by=self.user
            )
            feedback_ids.append(feedback.id)

        # Delete decision
        decision.delete()

        # All feedbacks should be deleted
        for feedback_id in feedback_ids:
            self.assertFalse(FieldFeedback.objects.filter(id=feedback_id).exists())

    def test_approved_decision_without_feedbacks(self):
        """Approved decision typically has no field feedbacks."""
        decision = ReviewDecision.objects.create(
            labeling_item=self.labeling_item,
            status='approved',
            reviewer=self.user,
            reviewer_comment='All fields look good!'
        )

        self.assertEqual(decision.field_feedbacks.count(), 0)
        self.assertEqual(decision.status, 'approved')
