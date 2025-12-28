"""
Tests for aviation analytics API endpoint.

Phase 2: API View and Serializer Implementation
Tests the REST API layer for analytics retrieval.
"""
import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from aviation.models import AviationEvent, AviationProject, LabelingItem
from organizations.models import Organization
from projects.models import Project
from tasks.models import Task
from users.models import User


@pytest.fixture
def api_client():
    """Return an API client instance."""
    return APIClient()


@pytest.fixture
def organization(db):
    """Create a test organization."""
    return Organization.objects.create(title="Test Org")


@pytest.fixture
def user(db, organization):
    """Create a test user with active organization."""
    user = User.objects.create(username="test@example.com", email="test@example.com")
    user.active_organization = organization
    user.save()
    return user


@pytest.fixture
def other_org_user(db):
    """Create a user from a different organization."""
    other_org = Organization.objects.create(title="Other Org")
    user = User.objects.create(username="other@example.com", email="other@example.com")
    user.active_organization = other_org
    user.save()
    return user


@pytest.fixture
def ls_project(db, organization, user):
    """Create a Label Studio project."""
    return Project.objects.create(
        title="Test Project",
        organization=organization,
        created_by=user
    )


@pytest.fixture
def aviation_project(db, ls_project):
    """Create an aviation project wrapper."""
    return AviationProject.objects.create(project=ls_project)


@pytest.mark.django_db
class TestAviationProjectAnalyticsAPI:
    """Test the analytics API endpoint."""

    def test_get_analytics_success(self, api_client, user, aviation_project):
        """Test successful analytics retrieval for aviation project."""
        # Setup: Create events and items
        task = Task.objects.create(
            project=aviation_project.project,
            data={'test': 'data'}
        )
        event = AviationEvent.objects.create(
            task=task,
            event_number='E001',
            date='2025-01-01'
        )
        LabelingItem.objects.create(
            event=event,
            sequence_number=1,
            status='approved',
            created_by=user
        )

        # Act: Call endpoint
        api_client.force_authenticate(user=user)
        url = reverse('aviation:project-analytics', kwargs={'pk': aviation_project.pk})
        response = api_client.get(url)

        # Assert: Success response with correct data
        assert response.status_code == status.HTTP_200_OK
        assert response.data['project_id'] == aviation_project.id
        assert response.data['project_type'] == 'aviation'
        assert response.data['total_events'] == 1
        assert response.data['events_by_status']['completed'] == 1

    def test_get_analytics_unauthenticated(self, api_client, aviation_project):
        """Test that unauthenticated requests are rejected."""
        url = reverse('aviation:project-analytics', kwargs={'pk': aviation_project.pk})
        response = api_client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_get_analytics_wrong_organization(self, api_client, other_org_user, aviation_project):
        """Test that users from different organizations cannot access analytics."""
        api_client.force_authenticate(user=other_org_user)
        url = reverse('aviation:project-analytics', kwargs={'pk': aviation_project.pk})
        response = api_client.get(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_get_analytics_non_existent_project(self, api_client, user):
        """Test 404 for non-existent project."""
        api_client.force_authenticate(user=user)
        url = reverse('aviation:project-analytics', kwargs={'pk': 99999})
        response = api_client.get(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_get_analytics_empty_project(self, api_client, user, aviation_project):
        """Test analytics for project with no events."""
        api_client.force_authenticate(user=user)
        url = reverse('aviation:project-analytics', kwargs={'pk': aviation_project.pk})
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['total_events'] == 0
        assert response.data['events_by_status']['completed'] == 0
        assert response.data['events_by_status']['in_progress'] == 0

    def test_get_analytics_mixed_statuses(self, api_client, user, aviation_project):
        """Test analytics with items in different statuses."""
        # Setup: Create multiple events with different item statuses
        task1 = Task.objects.create(project=aviation_project.project, data={})
        event1 = AviationEvent.objects.create(task=task1, event_number='E001', date='2025-01-01')
        LabelingItem.objects.create(event=event1, sequence_number=1, status='approved', created_by=user)
        LabelingItem.objects.create(event=event1, sequence_number=2, status='approved', created_by=user)

        task2 = Task.objects.create(project=aviation_project.project, data={})
        event2 = AviationEvent.objects.create(task=task2, event_number='E002', date='2025-01-02')
        LabelingItem.objects.create(event=event2, sequence_number=1, status='draft', created_by=user)
        LabelingItem.objects.create(event=event2, sequence_number=2, status='submitted', created_by=user)

        # Act
        api_client.force_authenticate(user=user)
        url = reverse('aviation:project-analytics', kwargs={'pk': aviation_project.pk})
        response = api_client.get(url)

        # Assert
        assert response.status_code == status.HTTP_200_OK
        assert response.data['total_events'] == 2
        assert response.data['events_by_status']['completed'] == 1  # event1
        assert response.data['events_by_status']['in_progress'] == 1  # event2
        assert response.data['labeling_items']['total'] == 4
        assert response.data['labeling_items']['by_status']['draft'] == 1
        assert response.data['labeling_items']['by_status']['submitted'] == 1
        assert response.data['labeling_items']['by_status']['approved'] == 2

    def test_post_method_not_allowed(self, api_client, user, aviation_project):
        """Test that POST is not allowed."""
        api_client.force_authenticate(user=user)
        url = reverse('aviation:project-analytics', kwargs={'pk': aviation_project.pk})
        response = api_client.post(url, {})
        assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED

    def test_get_analytics_labeling_items_all_statuses(self, api_client, user, aviation_project):
        """Test that all labeling item statuses are correctly counted."""
        # Setup: Create event with items in all statuses
        task = Task.objects.create(project=aviation_project.project, data={})
        event = AviationEvent.objects.create(task=task, event_number='E001', date='2025-01-01')

        LabelingItem.objects.create(event=event, sequence_number=1, status='draft', created_by=user)
        LabelingItem.objects.create(event=event, sequence_number=2, status='submitted', created_by=user)
        LabelingItem.objects.create(event=event, sequence_number=3, status='reviewed', created_by=user)
        LabelingItem.objects.create(event=event, sequence_number=4, status='approved', created_by=user)

        # Act
        api_client.force_authenticate(user=user)
        url = reverse('aviation:project-analytics', kwargs={'pk': aviation_project.pk})
        response = api_client.get(url)

        # Assert
        assert response.status_code == status.HTTP_200_OK
        assert response.data['labeling_items']['total'] == 4
        assert response.data['labeling_items']['by_status']['draft'] == 1
        assert response.data['labeling_items']['by_status']['submitted'] == 1
        assert response.data['labeling_items']['by_status']['reviewed'] == 1
        assert response.data['labeling_items']['by_status']['approved'] == 1
        # Event is in_progress since not all items are approved
        assert response.data['events_by_status']['in_progress'] == 1
        assert response.data['events_by_status']['completed'] == 0

    def test_get_analytics_response_structure(self, api_client, user, aviation_project):
        """Test that response has correct structure."""
        api_client.force_authenticate(user=user)
        url = reverse('aviation:project-analytics', kwargs={'pk': aviation_project.pk})
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK

        # Verify top-level fields exist
        assert 'project_id' in response.data
        assert 'project_type' in response.data
        assert 'total_events' in response.data
        assert 'events_by_status' in response.data
        assert 'labeling_items' in response.data

        # Verify nested structure
        assert 'in_progress' in response.data['events_by_status']
        assert 'completed' in response.data['events_by_status']
        assert 'total' in response.data['labeling_items']
        assert 'by_status' in response.data['labeling_items']
        assert 'draft' in response.data['labeling_items']['by_status']
        assert 'submitted' in response.data['labeling_items']['by_status']
        assert 'reviewed' in response.data['labeling_items']['by_status']
        assert 'approved' in response.data['labeling_items']['by_status']
