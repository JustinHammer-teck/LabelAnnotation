"""
Tests for organization-wide aviation events analytics API endpoints.

This module tests the AllEventsAnalyticsAPI and AllFilterOptionsAPI endpoints
which provide data aggregated across ALL aviation projects in the user's organization.

Test categories:
- Basic endpoint tests (authentication, organization filtering)
- Cross-project aggregation tests
- Pagination tests
- Filter integration tests
- AllFilterOptionsAPI tests
"""
import pytest
from datetime import date, time
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from aviation.models import (
    AviationEvent,
    AviationProject,
    LabelingItem,
    ResultPerformance,
    TypeHierarchy,
)
from aviation.tests.factories import (
    AviationEventFactory,
    AviationProjectFactory,
    LabelingItemFactory,
    ResultPerformanceFactory,
    TypeHierarchyFactory,
)
from users.tests.factories import UserFactory
from organizations.tests.factories import OrganizationFactory


@pytest.fixture
def api_client():
    """Create an API client for testing."""
    return APIClient()


@pytest.fixture
def organization(db):
    """Create an organization for testing."""
    return OrganizationFactory()


@pytest.fixture
def user(organization):
    """Create a user in the organization."""
    return UserFactory(active_organization=organization)


@pytest.fixture
def authenticated_client(api_client, user):
    """Create an authenticated API client."""
    api_client.force_authenticate(user=user)
    return api_client


@pytest.fixture
def aviation_project_1(organization):
    """Create first aviation project in the user's organization."""
    return AviationProjectFactory(project__organization=organization)


@pytest.fixture
def aviation_project_2(organization):
    """Create second aviation project in the user's organization."""
    return AviationProjectFactory(project__organization=organization)


@pytest.fixture
def other_organization(db):
    """Create another organization."""
    return OrganizationFactory()


@pytest.fixture
def other_aviation_project(other_organization):
    """Create an aviation project in a different organization."""
    return AviationProjectFactory(project__organization=other_organization)


def get_all_events_analytics_url():
    """Get the URL for the all events analytics endpoint."""
    return reverse('aviation:all-events-analytics')


def get_all_filter_options_url():
    """Get the URL for the all filter options endpoint."""
    return reverse('aviation:all-filter-options')


# =============================================================================
# BASIC ENDPOINT TESTS - AllEventsAnalyticsAPI
# =============================================================================


@pytest.mark.django_db
class TestAllEventsAnalyticsAuthentication:
    """Tests for AllEventsAnalyticsAPI authentication requirements."""

    def test_endpoint_requires_authentication(self, api_client):
        """Unauthenticated requests return 401."""
        url = get_all_events_analytics_url()
        response = api_client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_endpoint_returns_200_for_authenticated_user(self, authenticated_client):
        """Authenticated user gets 200."""
        url = get_all_events_analytics_url()
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK

    def test_returns_empty_results_for_user_with_no_projects(
        self, authenticated_client
    ):
        """Returns empty results when user has no aviation projects."""
        url = get_all_events_analytics_url()
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 0
        assert response.data['results'] == []


# =============================================================================
# CROSS-PROJECT AGGREGATION TESTS
# =============================================================================


@pytest.mark.django_db
class TestCrossProjectAggregation:
    """Tests for aggregating events across multiple projects."""

    def test_returns_events_from_all_org_projects(
        self, authenticated_client, aviation_project_1, aviation_project_2
    ):
        """Returns events from all aviation projects in user's organization."""
        # Create events in both projects
        event1 = AviationEventFactory(
            task__project=aviation_project_1.project,
            event_number='EVT-PROJ1-001',
        )
        event2 = AviationEventFactory(
            task__project=aviation_project_2.project,
            event_number='EVT-PROJ2-001',
        )

        url = get_all_events_analytics_url()
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 2

        event_ids = [r['eventId'] for r in response.data['results']]
        assert 'EVT-PROJ1-001' in event_ids
        assert 'EVT-PROJ2-001' in event_ids

    def test_excludes_events_from_other_organizations(
        self, authenticated_client, aviation_project_1, other_aviation_project
    ):
        """Only returns events from user's organization, not other orgs."""
        # Create events in both organizations
        AviationEventFactory(
            task__project=aviation_project_1.project,
            event_number='EVT-MY-ORG',
        )
        AviationEventFactory(
            task__project=other_aviation_project.project,
            event_number='EVT-OTHER-ORG',
        )

        url = get_all_events_analytics_url()
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1
        assert response.data['results'][0]['eventId'] == 'EVT-MY-ORG'

    def test_returns_multiple_events_per_project(
        self, authenticated_client, aviation_project_1, aviation_project_2
    ):
        """Correctly aggregates multiple events from each project."""
        # Create 3 events in project 1
        for i in range(3):
            AviationEventFactory(
                task__project=aviation_project_1.project,
                event_number=f'EVT-P1-{i:03d}',
            )
        # Create 2 events in project 2
        for i in range(2):
            AviationEventFactory(
                task__project=aviation_project_2.project,
                event_number=f'EVT-P2-{i:03d}',
            )

        url = get_all_events_analytics_url()
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 5


# =============================================================================
# PAGINATION TESTS
# =============================================================================


@pytest.mark.django_db
class TestAllEventsAnalyticsPagination:
    """Tests for pagination of cross-project events."""

    def test_default_pagination(
        self, authenticated_client, aviation_project_1, aviation_project_2
    ):
        """Returns 50 items by default."""
        # Create 30 events in each project (60 total)
        for i in range(30):
            AviationEventFactory(
                task__project=aviation_project_1.project,
                event_number=f'EVT-P1-{i:05d}',
            )
        for i in range(30):
            AviationEventFactory(
                task__project=aviation_project_2.project,
                event_number=f'EVT-P2-{i:05d}',
            )

        url = get_all_events_analytics_url()
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 50
        assert response.data['count'] == 60

    def test_pagination_metadata(
        self, authenticated_client, aviation_project_1
    ):
        """Response includes count, next, previous."""
        # Create 60 events
        for i in range(60):
            AviationEventFactory(
                task__project=aviation_project_1.project,
                event_number=f'EVT-{i:05d}',
            )

        url = get_all_events_analytics_url()
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert 'count' in response.data
        assert 'next' in response.data
        assert 'previous' in response.data
        assert 'results' in response.data

        assert response.data['count'] == 60
        assert response.data['next'] is not None
        assert response.data['previous'] is None


# =============================================================================
# RESPONSE FORMAT TESTS
# =============================================================================


@pytest.mark.django_db
class TestAllEventsAnalyticsResponseFormat:
    """Tests for response format matching per-project API."""

    def test_response_includes_basic_info(
        self, authenticated_client, aviation_project_1
    ):
        """Each event has basic info with Chinese field names."""
        event = AviationEventFactory(
            task__project=aviation_project_1.project,
            event_number='EVT-00001',
            date=date(2023, 10, 27),
            time=time(14, 30, 0),
            aircraft_type='A330',
        )

        url = get_all_events_analytics_url()
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        result = response.data['results'][0]

        # Check Chinese field names in basic info
        basic_info = result['基本信息']
        assert basic_info['事件编号'] == 'EVT-00001'
        assert basic_info['日期'] == '2023-10-27'
        assert basic_info['时间'] == '14:30:00'
        assert basic_info['机型'] == 'A330'

    def test_response_includes_labeling_items(
        self, authenticated_client, aviation_project_1
    ):
        """Each event has nested labeling items list."""
        event = AviationEventFactory(task__project=aviation_project_1.project)
        labeling_item = LabelingItemFactory(
            event=event,
            notes='Test end state description',
        )

        url = get_all_events_analytics_url()
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        result = response.data['results'][0]

        assert '标签标注列表' in result
        assert len(result['标签标注列表']) == 1
        assert result['标签标注列表'][0]['结束状态描述'] == 'Test end state description'

    def test_response_includes_result_performances(
        self, authenticated_client, aviation_project_1
    ):
        """Each event has nested result performances list."""
        event = AviationEventFactory(task__project=aviation_project_1.project)
        result_perf = ResultPerformanceFactory(
            aviation_project=aviation_project_1,
            event=event,
            event_type='incident',
        )

        url = get_all_events_analytics_url()
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        result = response.data['results'][0]

        assert '结果绩效列表' in result
        assert len(result['结果绩效列表']) == 1
        assert result['结果绩效列表'][0]['事件类型'] == 'incident'


# =============================================================================
# FILTER INTEGRATION TESTS
# =============================================================================


@pytest.mark.django_db
class TestAllEventsAnalyticsFilters:
    """Tests for filter integration across all projects."""

    def test_date_filter_across_projects(
        self, authenticated_client, aviation_project_1, aviation_project_2
    ):
        """Date filters work across projects."""
        # Create events in both projects with different dates
        AviationEventFactory(
            task__project=aviation_project_1.project,
            date=date(2023, 1, 15),
            event_number='P1-JAN',
        )
        AviationEventFactory(
            task__project=aviation_project_2.project,
            date=date(2023, 6, 15),
            event_number='P2-JUN',
        )

        url = get_all_events_analytics_url()
        response = authenticated_client.get(url, {
            'date_start': '2023-03-01',
            'date_end': '2023-09-01',
        })

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1
        assert response.data['results'][0]['eventId'] == 'P2-JUN'

    def test_aircraft_filter_across_projects(
        self, authenticated_client, aviation_project_1, aviation_project_2
    ):
        """Aircraft filters work across projects."""
        AviationEventFactory(
            task__project=aviation_project_1.project,
            aircraft_type='A320',
        )
        AviationEventFactory(
            task__project=aviation_project_2.project,
            aircraft_type='B737',
        )

        url = get_all_events_analytics_url()
        response = authenticated_client.get(url, {'aircraft': 'A320'})

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1
        assert response.data['results'][0]['基本信息']['机型'] == 'A320'

    def test_airport_filter_across_projects(
        self, authenticated_client, aviation_project_1, aviation_project_2
    ):
        """Airport filters work across projects."""
        AviationEventFactory(
            task__project=aviation_project_1.project,
            departure_airport='KJFK',
        )
        AviationEventFactory(
            task__project=aviation_project_2.project,
            departure_airport='KLAX',
        )

        url = get_all_events_analytics_url()
        response = authenticated_client.get(url, {'airport': 'KJFK'})

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1
        assert response.data['results'][0]['基本信息']['起飞机场'] == 'KJFK'

    def test_event_type_filter_across_projects(
        self, authenticated_client, aviation_project_1, aviation_project_2
    ):
        """Event type filters work across projects."""
        event1 = AviationEventFactory(task__project=aviation_project_1.project)
        event2 = AviationEventFactory(task__project=aviation_project_2.project)

        ResultPerformanceFactory(
            aviation_project=aviation_project_1,
            event=event1,
            event_type='incident',
        )
        ResultPerformanceFactory(
            aviation_project=aviation_project_2,
            event=event2,
            event_type='accident',
        )

        url = get_all_events_analytics_url()
        response = authenticated_client.get(url, {'event_type': 'incident'})

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1

    def test_threat_hierarchy_filter_across_projects(
        self, authenticated_client, aviation_project_1, aviation_project_2
    ):
        """Threat hierarchy filters work across projects."""
        event1 = AviationEventFactory(task__project=aviation_project_1.project)
        event2 = AviationEventFactory(task__project=aviation_project_2.project)

        threat_l1 = TypeHierarchyFactory(
            category='threat', level=1, code='THR-ENV'
        )

        LabelingItemFactory(event=event1, threat_type_l1=threat_l1)
        LabelingItemFactory(event=event2)  # No threat type

        url = get_all_events_analytics_url()
        response = authenticated_client.get(url, {'threat_l1': 'THR-ENV'})

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1


# =============================================================================
# ALL FILTER OPTIONS API TESTS
# =============================================================================


@pytest.mark.django_db
class TestAllFilterOptionsAuthentication:
    """Tests for AllFilterOptionsAPI authentication."""

    def test_endpoint_requires_authentication(self, api_client):
        """Unauthenticated requests return 401."""
        url = get_all_filter_options_url()
        response = api_client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_endpoint_returns_200_for_authenticated_user(self, authenticated_client):
        """Authenticated user gets 200."""
        url = get_all_filter_options_url()
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestAllFilterOptionsAggregation:
    """Tests for aggregating filter options across all projects."""

    def test_aggregates_aircraft_from_all_projects(
        self, authenticated_client, aviation_project_1, aviation_project_2
    ):
        """Returns aircraft types from all org projects."""
        AviationEventFactory(
            task__project=aviation_project_1.project,
            aircraft_type='A320',
        )
        AviationEventFactory(
            task__project=aviation_project_2.project,
            aircraft_type='B737',
        )

        url = get_all_filter_options_url()
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert 'A320' in response.data['aircraft']
        assert 'B737' in response.data['aircraft']

    def test_aggregates_airports_from_all_projects(
        self, authenticated_client, aviation_project_1, aviation_project_2
    ):
        """Returns airports from all org projects."""
        AviationEventFactory(
            task__project=aviation_project_1.project,
            departure_airport='KJFK',
            arrival_airport='KLAX',
        )
        AviationEventFactory(
            task__project=aviation_project_2.project,
            departure_airport='KORD',
            arrival_airport='KSFO',
        )

        url = get_all_filter_options_url()
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        airports = response.data['airports']
        assert 'KJFK' in airports
        assert 'KLAX' in airports
        assert 'KORD' in airports
        assert 'KSFO' in airports

    def test_aggregates_event_types_from_all_projects(
        self, authenticated_client, aviation_project_1, aviation_project_2
    ):
        """Returns event types from all org projects."""
        event1 = AviationEventFactory(task__project=aviation_project_1.project)
        event2 = AviationEventFactory(task__project=aviation_project_2.project)

        ResultPerformanceFactory(
            aviation_project=aviation_project_1,
            event=event1,
            event_type='incident',
        )
        ResultPerformanceFactory(
            aviation_project=aviation_project_2,
            event=event2,
            event_type='accident',
        )

        url = get_all_filter_options_url()
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert 'incident' in response.data['eventTypes']
        assert 'accident' in response.data['eventTypes']

    def test_aggregates_flight_phases_from_all_projects(
        self, authenticated_client, aviation_project_1, aviation_project_2
    ):
        """Returns flight phases from all org projects."""
        AviationEventFactory(
            task__project=aviation_project_1.project,
            flight_phase='takeoff',
        )
        AviationEventFactory(
            task__project=aviation_project_2.project,
            flight_phase='landing',
        )

        url = get_all_filter_options_url()
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert 'takeoff' in response.data['flightPhases']
        assert 'landing' in response.data['flightPhases']

    def test_aggregates_training_topics_from_all_projects(
        self, authenticated_client, aviation_project_1, aviation_project_2
    ):
        """Returns training topics from all org projects."""
        event1 = AviationEventFactory(task__project=aviation_project_1.project)
        event2 = AviationEventFactory(task__project=aviation_project_2.project)

        ResultPerformanceFactory(
            aviation_project=aviation_project_1,
            event=event1,
            training_topics=['CRM', 'Situational Awareness'],
        )
        ResultPerformanceFactory(
            aviation_project=aviation_project_2,
            event=event2,
            training_topics=['Decision Making', 'Communication'],
        )

        url = get_all_filter_options_url()
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        topics = response.data['trainingTopics']
        assert 'CRM' in topics
        assert 'Situational Awareness' in topics
        assert 'Decision Making' in topics
        assert 'Communication' in topics

    def test_deduplicates_values_across_projects(
        self, authenticated_client, aviation_project_1, aviation_project_2
    ):
        """Returns unique values when same value exists in multiple projects."""
        # Create same aircraft type in both projects
        AviationEventFactory(
            task__project=aviation_project_1.project,
            aircraft_type='A320',
        )
        AviationEventFactory(
            task__project=aviation_project_2.project,
            aircraft_type='A320',
        )

        url = get_all_filter_options_url()
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        # Should only have one A320, not duplicated
        assert response.data['aircraft'].count('A320') == 1

    def test_excludes_data_from_other_organizations(
        self, authenticated_client, aviation_project_1, other_aviation_project
    ):
        """Only returns filter options from user's organization."""
        AviationEventFactory(
            task__project=aviation_project_1.project,
            aircraft_type='A320',
        )
        AviationEventFactory(
            task__project=other_aviation_project.project,
            aircraft_type='B777',
        )

        url = get_all_filter_options_url()
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert 'A320' in response.data['aircraft']
        assert 'B777' not in response.data['aircraft']

    def test_response_structure(self, authenticated_client):
        """Response includes all expected fields."""
        url = get_all_filter_options_url()
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert 'aircraft' in response.data
        assert 'airports' in response.data
        assert 'eventTypes' in response.data
        assert 'flightPhases' in response.data
        assert 'trainingTopics' in response.data

    def test_returns_empty_arrays_when_no_data(self, authenticated_client):
        """Returns empty arrays when no aviation projects exist."""
        url = get_all_filter_options_url()
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['aircraft'] == []
        assert response.data['airports'] == []
        assert response.data['eventTypes'] == []
        assert response.data['flightPhases'] == []
        assert response.data['trainingTopics'] == []

    def test_values_are_sorted_alphabetically(
        self, authenticated_client, aviation_project_1
    ):
        """Filter option values are sorted alphabetically."""
        # Create events with unordered aircraft types
        AviationEventFactory(
            task__project=aviation_project_1.project,
            aircraft_type='Zebra',
        )
        AviationEventFactory(
            task__project=aviation_project_1.project,
            aircraft_type='Alpha',
        )
        AviationEventFactory(
            task__project=aviation_project_1.project,
            aircraft_type='Beta',
        )

        url = get_all_filter_options_url()
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        aircraft = response.data['aircraft']
        assert aircraft == ['Alpha', 'Beta', 'Zebra']
