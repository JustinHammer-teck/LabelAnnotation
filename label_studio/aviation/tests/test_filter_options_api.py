"""
Tests for FilterOptionsAPI endpoint.

TDD Red Phase: Tests written FIRST, expected to FAIL initially.

Endpoint: GET /api/aviation/projects/<pk>/filter-options/
Returns distinct filter option arrays for aviation analytics dashboard.
"""
import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from aviation.models import AviationEvent, AviationProject, ResultPerformance
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
def other_organization(db):
    """Create another organization for isolation tests."""
    return Organization.objects.create(title="Other Org")


@pytest.fixture
def other_user(db, other_organization):
    """Create a user from a different organization."""
    user = User.objects.create(username="other@example.com", email="other@example.com")
    user.active_organization = other_organization
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


@pytest.fixture
def other_ls_project(db, other_organization, other_user):
    """Create a Label Studio project in other organization."""
    return Project.objects.create(
        title="Other Project",
        organization=other_organization,
        created_by=other_user
    )


@pytest.fixture
def other_aviation_project(db, other_ls_project):
    """Create an aviation project in a different organization."""
    return AviationProject.objects.create(project=other_ls_project)


def get_filter_options_url(pk):
    """Return the URL for filter options endpoint."""
    return reverse('aviation:project-filter-options', kwargs={'pk': pk})


def create_event(project, event_number, **kwargs):
    """Helper to create an AviationEvent."""
    task = Task.objects.create(project=project, data={'event': event_number})
    defaults = {
        'task': task,
        'event_number': event_number,
        'date': '2025-01-01',
    }
    defaults.update(kwargs)
    return AviationEvent.objects.create(**defaults)


@pytest.mark.django_db
class TestFilterOptionsAPI:
    """Test suite for /api/aviation/projects/<pk>/filter-options/ endpoint."""

    def test_endpoint_requires_authentication(self, api_client, aviation_project):
        """MUST return 401 for unauthenticated requests."""
        url = get_filter_options_url(aviation_project.id)
        response = api_client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_returns_empty_arrays_for_project_with_no_data(
        self, api_client, user, aviation_project
    ):
        """MUST return empty arrays when project has no events."""
        api_client.force_authenticate(user=user)
        url = get_filter_options_url(aviation_project.id)
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        assert data['aircraft'] == []
        assert data['airports'] == []
        assert data['eventTypes'] == []
        assert data['flightPhases'] == []
        assert data['trainingTopics'] == []

    def test_returns_distinct_aircraft_types(self, api_client, user, aviation_project):
        """MUST return unique aircraft types from events."""
        api_client.force_authenticate(user=user)

        # Create events with aircraft types (including duplicates)
        create_event(aviation_project.project, 'E001', aircraft_type='A320')
        create_event(aviation_project.project, 'E002', aircraft_type='B737')
        create_event(aviation_project.project, 'E003', aircraft_type='A320')  # Duplicate
        create_event(aviation_project.project, 'E004', aircraft_type='')  # Empty - should be excluded

        url = get_filter_options_url(aviation_project.id)
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        # Should have unique, sorted aircraft types
        assert data['aircraft'] == ['A320', 'B737']

    def test_returns_distinct_airports(self, api_client, user, aviation_project):
        """MUST return unique airports from departure/arrival/actual_landing."""
        api_client.force_authenticate(user=user)

        # Create events with various airport fields
        create_event(
            aviation_project.project, 'E001',
            departure_airport='ZBAA',
            arrival_airport='ZSPD',
            actual_landing_airport='ZSPD'  # Same as arrival
        )
        create_event(
            aviation_project.project, 'E002',
            departure_airport='ZGGG',
            arrival_airport='ZBAA',  # Same as first departure
            actual_landing_airport='ZUUU'
        )
        create_event(
            aviation_project.project, 'E003',
            departure_airport='',  # Empty - should be excluded
            arrival_airport='',
            actual_landing_airport=''
        )

        url = get_filter_options_url(aviation_project.id)
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        # Should have unique, sorted airports from all three fields
        assert data['airports'] == ['ZBAA', 'ZGGG', 'ZSPD', 'ZUUU']

    def test_returns_distinct_event_types(self, api_client, user, aviation_project):
        """MUST return unique event types from result performances."""
        api_client.force_authenticate(user=user)

        # Create events and result performances with event types
        event1 = create_event(aviation_project.project, 'E001')
        event2 = create_event(aviation_project.project, 'E002')

        ResultPerformance.objects.create(
            aviation_project=aviation_project,
            event=event1,
            event_type='incident'
        )
        ResultPerformance.objects.create(
            aviation_project=aviation_project,
            event=event2,
            event_type='accident'
        )
        ResultPerformance.objects.create(
            aviation_project=aviation_project,
            event=event2,
            event_type='incident'  # Duplicate
        )
        ResultPerformance.objects.create(
            aviation_project=aviation_project,
            event=event2,
            event_type=''  # Empty - should be excluded
        )

        url = get_filter_options_url(aviation_project.id)
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        # Should have unique, sorted event types
        assert data['eventTypes'] == ['accident', 'incident']

    def test_returns_distinct_flight_phases(self, api_client, user, aviation_project):
        """MUST return unique flight phases from events."""
        api_client.force_authenticate(user=user)

        # Create events with flight phases
        create_event(aviation_project.project, 'E001', flight_phase='takeoff')
        create_event(aviation_project.project, 'E002', flight_phase='cruise')
        create_event(aviation_project.project, 'E003', flight_phase='takeoff')  # Duplicate
        create_event(aviation_project.project, 'E004', flight_phase='')  # Empty - should be excluded

        url = get_filter_options_url(aviation_project.id)
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        # Should have unique, sorted flight phases
        assert data['flightPhases'] == ['cruise', 'takeoff']

    def test_returns_distinct_training_topics(self, api_client, user, aviation_project):
        """MUST return unique training topics from result performances."""
        api_client.force_authenticate(user=user)

        # Create events and result performances with training topics (JSONField arrays)
        event1 = create_event(aviation_project.project, 'E001')
        event2 = create_event(aviation_project.project, 'E002')

        ResultPerformance.objects.create(
            aviation_project=aviation_project,
            event=event1,
            training_topics=['CRM', 'Communication']
        )
        ResultPerformance.objects.create(
            aviation_project=aviation_project,
            event=event2,
            training_topics=['Situational Awareness', 'CRM']  # CRM is duplicate
        )
        ResultPerformance.objects.create(
            aviation_project=aviation_project,
            event=event2,
            training_topics=[]  # Empty array
        )

        url = get_filter_options_url(aviation_project.id)
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        # Should have unique, sorted training topics (flattened from all arrays)
        assert data['trainingTopics'] == ['CRM', 'Communication', 'Situational Awareness']

    def test_filters_by_organization(
        self, api_client, user, aviation_project, other_aviation_project
    ):
        """MUST only return data from user's organization."""
        api_client.force_authenticate(user=user)

        # Create data in user's project
        create_event(aviation_project.project, 'E001', aircraft_type='A320')

        # Create data in OTHER organization's project
        create_event(other_aviation_project.project, 'E002', aircraft_type='B777')

        url = get_filter_options_url(aviation_project.id)
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        # Should only see A320 from user's organization
        assert 'A320' in data['aircraft']
        assert 'B777' not in data['aircraft']

    def test_404_for_nonexistent_project(self, api_client, user):
        """MUST return 404 for invalid project ID."""
        api_client.force_authenticate(user=user)
        url = get_filter_options_url(99999)
        response = api_client.get(url)

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_404_for_unauthorized_organization(
        self, api_client, user, other_aviation_project
    ):
        """MUST return 404 for project in different organization (security via obscurity)."""
        api_client.force_authenticate(user=user)

        # Try to access project from OTHER organization
        url = get_filter_options_url(other_aviation_project.id)
        response = api_client.get(url)

        # Should return 404 (not 403) to hide existence of the project
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_response_schema_matches_serializer(self, api_client, user, aviation_project):
        """MUST return JSON with aircraft, airports, eventTypes, flightPhases, trainingTopics arrays."""
        api_client.force_authenticate(user=user)
        url = get_filter_options_url(aviation_project.id)
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        # Verify all required keys are present
        required_keys = ['aircraft', 'airports', 'eventTypes', 'flightPhases', 'trainingTopics']
        for key in required_keys:
            assert key in data, f"Missing key: {key}"
            assert isinstance(data[key], list), f"{key} should be a list"

    def test_combined_filter_options(self, api_client, user, aviation_project):
        """MUST return all filter options combined in single response."""
        api_client.force_authenticate(user=user)

        # Create comprehensive test data
        event = create_event(
            aviation_project.project, 'E001',
            aircraft_type='A350',
            departure_airport='VHHH',
            arrival_airport='RKSI',
            actual_landing_airport='RKSI',
            flight_phase='approach'
        )

        ResultPerformance.objects.create(
            aviation_project=aviation_project,
            event=event,
            event_type='near_miss',
            training_topics=['Emergency Procedures', 'Decision Making']
        )

        url = get_filter_options_url(aviation_project.id)
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        # Verify all data is present
        assert 'A350' in data['aircraft']
        assert 'VHHH' in data['airports']
        assert 'RKSI' in data['airports']
        assert 'approach' in data['flightPhases']
        assert 'near_miss' in data['eventTypes']
        assert 'Emergency Procedures' in data['trainingTopics']
        assert 'Decision Making' in data['trainingTopics']

    def test_null_values_excluded(self, api_client, user, aviation_project):
        """MUST exclude null values from all arrays."""
        api_client.force_authenticate(user=user)

        # Create event with valid aircraft type
        event = create_event(
            aviation_project.project, 'E001',
            aircraft_type='ValidType'
        )

        # Create ResultPerformance with None training_topics
        # Model default is list, but we test the handling
        ResultPerformance.objects.create(
            aviation_project=aviation_project,
            event=event,
            training_topics=[]
        )

        url = get_filter_options_url(aviation_project.id)
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        # All arrays should not contain None
        for key in ['aircraft', 'airports', 'eventTypes', 'flightPhases', 'trainingTopics']:
            assert None not in data[key], f"{key} should not contain None"

    def test_sorted_alphabetically(self, api_client, user, aviation_project):
        """MUST return arrays sorted alphabetically."""
        api_client.force_authenticate(user=user)

        # Create events with unsorted aircraft types
        create_event(aviation_project.project, 'E001', aircraft_type='C919')
        create_event(aviation_project.project, 'E002', aircraft_type='A320')
        create_event(aviation_project.project, 'E003', aircraft_type='B737')

        url = get_filter_options_url(aviation_project.id)
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        # Should be sorted alphabetically
        assert data['aircraft'] == sorted(data['aircraft'])

    def test_post_method_not_allowed(self, api_client, user, aviation_project):
        """Test that POST is not allowed."""
        api_client.force_authenticate(user=user)
        url = get_filter_options_url(aviation_project.id)
        response = api_client.post(url, {})
        assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED
