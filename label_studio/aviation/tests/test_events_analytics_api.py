"""
Tests for aviation events analytics API endpoint.

This module tests the AviationProjectEventsAnalyticsAPI endpoint which provides
paginated, filterable event data for analytics/Sankey visualization.

Phase 2: Backend Pagination + API Endpoint

Test categories:
- Basic endpoint tests (authentication, organization filtering)
- Pagination tests (default, custom page size, max page size)
- Response format tests (Chinese field names, nested structures)
- Filter integration tests (all 10 filter types via query params)
- Edge cases (empty project, invalid project ID)
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
    org = OrganizationFactory()
    # The created_by user is already set up with active_organization
    return org


@pytest.fixture
def user(organization):
    """Create a user in the organization."""
    # Use the user that was automatically created with the organization
    # or create a new one with active_organization set
    user = UserFactory(active_organization=organization)
    return user


@pytest.fixture
def authenticated_client(api_client, user):
    """Create an authenticated API client."""
    api_client.force_authenticate(user=user)
    return api_client


@pytest.fixture
def aviation_project(organization):
    """Create an aviation project in the user's organization."""
    return AviationProjectFactory(
        project__organization=organization
    )


@pytest.fixture
def other_organization(db):
    """Create another organization."""
    return OrganizationFactory()


@pytest.fixture
def other_aviation_project(other_organization):
    """Create an aviation project in a different organization."""
    return AviationProjectFactory(
        project__organization=other_organization
    )


def get_events_analytics_url(pk):
    """Get the URL for the events analytics endpoint."""
    return reverse('aviation:project-events-analytics', kwargs={'pk': pk})


# =============================================================================
# BASIC ENDPOINT TESTS
# =============================================================================


@pytest.mark.django_db
class TestEndpointAuthentication:
    """Tests for endpoint authentication requirements."""

    def test_endpoint_requires_authentication(self, api_client, aviation_project):
        """Unauthenticated requests return 401."""
        url = get_events_analytics_url(aviation_project.id)
        response = api_client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_endpoint_returns_200_for_authenticated_user(
        self, authenticated_client, aviation_project
    ):
        """Authenticated user gets 200."""
        url = get_events_analytics_url(aviation_project.id)
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK

    def test_endpoint_filters_by_organization(
        self, authenticated_client, aviation_project, other_aviation_project
    ):
        """Only returns events from user's organization."""
        # Create events in both projects
        AviationEventFactory(task__project=aviation_project.project)
        AviationEventFactory(task__project=other_aviation_project.project)

        # Request events from the other project (different org)
        url = get_events_analytics_url(other_aviation_project.id)
        response = authenticated_client.get(url)

        # Should return 404 because project is in different org
        assert response.status_code == status.HTTP_404_NOT_FOUND


# =============================================================================
# PAGINATION TESTS
# =============================================================================


@pytest.mark.django_db
class TestPagination:
    """Tests for pagination functionality."""

    def test_default_pagination(self, authenticated_client, aviation_project):
        """Returns 50 items by default."""
        # Create 60 events
        for i in range(60):
            AviationEventFactory(
                task__project=aviation_project.project,
                event_number=f'EVT-{i:05d}',
            )

        url = get_events_analytics_url(aviation_project.id)
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 50
        assert response.data['count'] == 60

    def test_custom_page_size(self, authenticated_client, aviation_project):
        """Respects page_size parameter."""
        # Create 30 events
        for i in range(30):
            AviationEventFactory(
                task__project=aviation_project.project,
                event_number=f'EVT-{i:05d}',
            )

        url = get_events_analytics_url(aviation_project.id)
        response = authenticated_client.get(url, {'page_size': 10})

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 10
        assert response.data['count'] == 30

    def test_max_page_size_enforced(self, authenticated_client, aviation_project):
        """Caps page_size at 100."""
        # Create 150 events
        for i in range(150):
            AviationEventFactory(
                task__project=aviation_project.project,
                event_number=f'EVT-{i:05d}',
            )

        url = get_events_analytics_url(aviation_project.id)
        response = authenticated_client.get(url, {'page_size': 200})

        assert response.status_code == status.HTTP_200_OK
        # Should cap at max_page_size (100)
        assert len(response.data['results']) == 100

    def test_pagination_metadata(self, authenticated_client, aviation_project):
        """Response includes count, next, previous."""
        # Create 60 events
        for i in range(60):
            AviationEventFactory(
                task__project=aviation_project.project,
                event_number=f'EVT-{i:05d}',
            )

        url = get_events_analytics_url(aviation_project.id)
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert 'count' in response.data
        assert 'next' in response.data
        assert 'previous' in response.data
        assert 'results' in response.data

        assert response.data['count'] == 60
        assert response.data['next'] is not None
        assert response.data['previous'] is None

    def test_second_page(self, authenticated_client, aviation_project):
        """Can navigate to second page."""
        # Create 60 events
        for i in range(60):
            AviationEventFactory(
                task__project=aviation_project.project,
                event_number=f'EVT-{i:05d}',
            )

        url = get_events_analytics_url(aviation_project.id)
        response = authenticated_client.get(url, {'page': 2})

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 10  # 60 - 50 = 10
        assert response.data['previous'] is not None


# =============================================================================
# RESPONSE FORMAT TESTS
# =============================================================================


@pytest.mark.django_db
class TestResponseFormat:
    """Tests for response format and Chinese field names."""

    def test_response_includes_event_id(self, authenticated_client, aviation_project):
        """Each event has eventId field."""
        event = AviationEventFactory(
            task__project=aviation_project.project,
            event_number='EVT-00001',
        )

        url = get_events_analytics_url(aviation_project.id)
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 1
        assert response.data['results'][0]['eventId'] == 'EVT-00001'

    def test_response_includes_basic_info(self, authenticated_client, aviation_project):
        """Each event has basic info with Chinese field names."""
        event = AviationEventFactory(
            task__project=aviation_project.project,
            event_number='EVT-00001',
            date=date(2023, 10, 27),
            time=time(14, 30, 0),
            aircraft_type='A330',
            departure_airport='SHHQ',
            arrival_airport='ZGGG',
            actual_landing_airport='ZGGG',
            location='Test Location',
            weather_conditions='Clear',
        )

        url = get_events_analytics_url(aviation_project.id)
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        result = response.data['results'][0]

        # Check Chinese field names in basic info
        basic_info = result['基本信息']
        assert basic_info['事件编号'] == 'EVT-00001'
        assert basic_info['日期'] == '2023-10-27'
        assert basic_info['时间'] == '14:30:00'
        assert basic_info['机型'] == 'A330'
        assert basic_info['起飞机场'] == 'SHHQ'
        assert basic_info['落地机场'] == 'ZGGG'
        assert basic_info['实际降落'] == 'ZGGG'
        assert basic_info['报告单位'] == 'Test Location'
        assert basic_info['备注'] == 'Clear'

    def test_response_includes_event_description(
        self, authenticated_client, aviation_project
    ):
        """Each event has event description."""
        event = AviationEventFactory(
            task__project=aviation_project.project,
            event_description='Test event description',
        )

        url = get_events_analytics_url(aviation_project.id)
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        result = response.data['results'][0]
        assert result['事件描述'] == 'Test event description'

    def test_response_includes_result_performances(
        self, authenticated_client, aviation_project
    ):
        """Each event has nested result performances list."""
        event = AviationEventFactory(task__project=aviation_project.project)
        result_perf = ResultPerformanceFactory(
            aviation_project=aviation_project,
            event=event,
            event_type='incident',
            flight_phase='takeoff',
            likelihood='possible',
            severity='major',
            training_effect='significant',
            training_plan='Test training plan',
            training_topics=['CRM', 'Situational Awareness'],
            training_goals='Test training goals',
        )

        url = get_events_analytics_url(aviation_project.id)
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        result = response.data['results'][0]

        assert '结果绩效列表' in result
        assert len(result['结果绩效列表']) == 1

        perf = result['结果绩效列表'][0]
        assert perf['id'] == result_perf.id
        assert perf['事件类型'] == 'incident'
        assert perf['飞行阶段'] == 'takeoff'
        assert perf['可能性'] == 'possible'
        assert perf['严重程度'] == 'major'
        assert perf['训练效果'] == 'significant'
        assert perf['训练方案设想'] == 'Test training plan'
        assert perf['训练主题'] == ['CRM', 'Situational Awareness']
        assert perf['所需达到的目标'] == 'Test training goals'

    def test_response_includes_labeling_items(
        self, authenticated_client, aviation_project
    ):
        """Each event has nested labeling items list."""
        event = AviationEventFactory(task__project=aviation_project.project)
        labeling_item = LabelingItemFactory(
            event=event,
            notes='Test end state description',
        )

        url = get_events_analytics_url(aviation_project.id)
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        result = response.data['results'][0]

        assert '标签标注列表' in result
        assert len(result['标签标注列表']) == 1

        item = result['标签标注列表'][0]
        assert item['id'] == labeling_item.id
        assert item['结束状态描述'] == 'Test end state description'

    def test_labeling_item_has_threat_list(
        self, authenticated_client, aviation_project
    ):
        """Labeling items include threat list with hierarchy."""
        event = AviationEventFactory(task__project=aviation_project.project)

        # Create threat hierarchy
        threat_l1 = TypeHierarchyFactory(
            category='threat', level=1, code='TE-ENV', label='Environment',
            label_zh='TE环境'
        )
        threat_l2 = TypeHierarchyFactory(
            category='threat', level=2, code='TEW', label='Weather',
            label_zh='TEW 天气', parent=threat_l1
        )
        threat_l3 = TypeHierarchyFactory(
            category='threat', level=3, code='TEW-01', label='Severe weather',
            label_zh='TEW 01 恶劣天气', parent=threat_l2
        )

        labeling_item = LabelingItemFactory(
            event=event,
            threat_type_l1=threat_l1,
            threat_type_l2=threat_l2,
            threat_type_l3=threat_l3,
            threat_management={'value': 'managed'},
            threat_impact={'value': 'minor'},
            threat_coping_abilities={'values': ['KNO.1', 'PRO.1']},
            threat_description='Threat description text',
        )

        url = get_events_analytics_url(aviation_project.id)
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        result = response.data['results'][0]
        item = result['标签标注列表'][0]

        assert '威胁列表' in item
        threat_list = item['威胁列表']
        assert threat_list['level1'] == 'TE环境'
        assert threat_list['level2'] == 'TEW 天气'
        assert threat_list['level3'] == 'TEW 01 恶劣天气'
        assert threat_list['管理'] == {'value': 'managed'}
        assert threat_list['影响'] == {'value': 'minor'}
        assert threat_list['应对能力'] == {'values': ['KNO.1', 'PRO.1']}
        assert threat_list['描述'] == 'Threat description text'

    def test_labeling_item_has_error_list(
        self, authenticated_client, aviation_project
    ):
        """Labeling items include error list with hierarchy."""
        event = AviationEventFactory(task__project=aviation_project.project)

        # Create error hierarchy
        error_l1 = TypeHierarchyFactory(
            category='error', level=1, code='ERR-COMM', label='Communication',
            label_zh='差错通讯'
        )
        error_l2 = TypeHierarchyFactory(
            category='error', level=2, code='ERR-ATC', label='ATC',
            label_zh='ATC差错', parent=error_l1
        )
        error_l3 = TypeHierarchyFactory(
            category='error', level=3, code='ERR-RDB', label='Readback',
            label_zh='复述差错', parent=error_l2
        )

        labeling_item = LabelingItemFactory(
            event=event,
            error_type_l1=error_l1,
            error_type_l2=error_l2,
            error_type_l3=error_l3,
            error_management={'value': 'unmanaged'},
            error_impact={'value': 'major'},
            error_coping_abilities={'values': ['PRO.2']},
            error_description='Error description text',
        )

        url = get_events_analytics_url(aviation_project.id)
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        result = response.data['results'][0]
        item = result['标签标注列表'][0]

        assert '差错列表' in item
        error_list = item['差错列表']
        assert error_list['level1'] == '差错通讯'
        assert error_list['level2'] == 'ATC差错'
        assert error_list['level3'] == '复述差错'
        assert error_list['管理'] == {'value': 'unmanaged'}
        assert error_list['影响'] == {'value': 'major'}
        assert error_list['应对能力'] == {'values': ['PRO.2']}
        assert error_list['描述'] == 'Error description text'

    def test_labeling_item_has_uas_list(
        self, authenticated_client, aviation_project
    ):
        """Labeling items include UAS list with hierarchy."""
        event = AviationEventFactory(task__project=aviation_project.project)

        # Create UAS hierarchy
        uas_l1 = TypeHierarchyFactory(
            category='uas', level=1, code='UAS-CTRL', label='Control',
            label_zh='UAS控制'
        )
        uas_l2 = TypeHierarchyFactory(
            category='uas', level=2, code='UAS-FLT', label='Flight',
            label_zh='UAS飞行', parent=uas_l1
        )
        uas_l3 = TypeHierarchyFactory(
            category='uas', level=3, code='UAS-PITCH', label='Pitch',
            label_zh='UAS俯仰', parent=uas_l2
        )

        labeling_item = LabelingItemFactory(
            event=event,
            uas_type_l1=uas_l1,
            uas_type_l2=uas_l2,
            uas_type_l3=uas_l3,
            uas_management={'value': 'managed'},
            uas_impact={'value': 'minor'},
            uas_coping_abilities={'values': ['KNO.3']},
            uas_description='UAS description text',
        )

        url = get_events_analytics_url(aviation_project.id)
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        result = response.data['results'][0]
        item = result['标签标注列表'][0]

        assert 'UAS列表' in item
        uas_list = item['UAS列表']
        assert uas_list['level1'] == 'UAS控制'
        assert uas_list['level2'] == 'UAS飞行'
        assert uas_list['level3'] == 'UAS俯仰'
        assert uas_list['管理'] == {'value': 'managed'}
        assert uas_list['影响'] == {'value': 'minor'}
        assert uas_list['应对能力'] == {'values': ['KNO.3']}
        assert uas_list['描述'] == 'UAS description text'

    def test_labeling_item_has_linked_result_id(
        self, authenticated_client, aviation_project
    ):
        """Labeling items include linked result performance ID."""
        event = AviationEventFactory(task__project=aviation_project.project)
        result_perf = ResultPerformanceFactory(
            aviation_project=aviation_project,
            event=event,
        )
        labeling_item = LabelingItemFactory(
            event=event,
            linked_result=result_perf,
        )

        url = get_events_analytics_url(aviation_project.id)
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        result = response.data['results'][0]
        item = result['标签标注列表'][0]

        assert item['关联事件类型ID'] == result_perf.id


# =============================================================================
# FILTER INTEGRATION TESTS
# =============================================================================


@pytest.mark.django_db
class TestFilterIntegration:
    """Tests for filter integration via query parameters."""

    def test_date_filter_params(self, authenticated_client, aviation_project):
        """date_start and date_end query params work."""
        event1 = AviationEventFactory(
            task__project=aviation_project.project,
            date=date(2023, 1, 15),
        )
        event2 = AviationEventFactory(
            task__project=aviation_project.project,
            date=date(2023, 6, 15),
        )
        event3 = AviationEventFactory(
            task__project=aviation_project.project,
            date=date(2023, 12, 15),
        )

        url = get_events_analytics_url(aviation_project.id)
        response = authenticated_client.get(url, {
            'date_start': '2023-03-01',
            'date_end': '2023-09-01',
        })

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1
        assert response.data['results'][0]['eventId'] == event2.event_number

    def test_aircraft_filter_params(self, authenticated_client, aviation_project):
        """aircraft query param filters results."""
        event1 = AviationEventFactory(
            task__project=aviation_project.project,
            aircraft_type='A320',
        )
        event2 = AviationEventFactory(
            task__project=aviation_project.project,
            aircraft_type='B737',
        )

        url = get_events_analytics_url(aviation_project.id)
        response = authenticated_client.get(url, {
            'aircraft': 'A320',
        })

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1
        assert response.data['results'][0]['基本信息']['机型'] == 'A320'

    def test_multiple_aircraft_filter_params(
        self, authenticated_client, aviation_project
    ):
        """Multiple aircraft values work."""
        event1 = AviationEventFactory(
            task__project=aviation_project.project,
            aircraft_type='A320',
        )
        event2 = AviationEventFactory(
            task__project=aviation_project.project,
            aircraft_type='B737',
        )
        event3 = AviationEventFactory(
            task__project=aviation_project.project,
            aircraft_type='E190',
        )

        url = get_events_analytics_url(aviation_project.id)
        response = authenticated_client.get(url, {
            'aircraft': 'A320,B737',
        })

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 2

    def test_airport_filter_params(self, authenticated_client, aviation_project):
        """airport query param filters results."""
        event1 = AviationEventFactory(
            task__project=aviation_project.project,
            departure_airport='KJFK',
        )
        event2 = AviationEventFactory(
            task__project=aviation_project.project,
            arrival_airport='KLAX',
        )

        url = get_events_analytics_url(aviation_project.id)
        response = authenticated_client.get(url, {
            'airport': 'KJFK',
        })

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1
        assert response.data['results'][0]['基本信息']['起飞机场'] == 'KJFK'

    def test_event_type_filter_params(self, authenticated_client, aviation_project):
        """event_type query param filters results."""
        event1 = AviationEventFactory(task__project=aviation_project.project)
        event2 = AviationEventFactory(task__project=aviation_project.project)

        ResultPerformanceFactory(
            aviation_project=aviation_project,
            event=event1,
            event_type='incident',
        )
        ResultPerformanceFactory(
            aviation_project=aviation_project,
            event=event2,
            event_type='accident',
        )

        url = get_events_analytics_url(aviation_project.id)
        response = authenticated_client.get(url, {
            'event_type': 'incident',
        })

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1

    def test_flight_phase_filter_params(self, authenticated_client, aviation_project):
        """flight_phase query param filters results."""
        event1 = AviationEventFactory(task__project=aviation_project.project)
        event2 = AviationEventFactory(task__project=aviation_project.project)

        ResultPerformanceFactory(
            aviation_project=aviation_project,
            event=event1,
            flight_phase='takeoff',
        )
        ResultPerformanceFactory(
            aviation_project=aviation_project,
            event=event2,
            flight_phase='landing',
        )

        url = get_events_analytics_url(aviation_project.id)
        response = authenticated_client.get(url, {
            'flight_phase': 'takeoff',
        })

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1

    def test_threat_hierarchy_filter_params(
        self, authenticated_client, aviation_project
    ):
        """threat_l1, threat_l2, threat_l3 query params filter results."""
        event1 = AviationEventFactory(task__project=aviation_project.project)
        event2 = AviationEventFactory(task__project=aviation_project.project)

        # Create threat hierarchy
        threat_l1 = TypeHierarchyFactory(
            category='threat', level=1, code='THR-ENV'
        )

        LabelingItemFactory(event=event1, threat_type_l1=threat_l1)
        LabelingItemFactory(event=event2)  # No threat type

        url = get_events_analytics_url(aviation_project.id)
        response = authenticated_client.get(url, {
            'threat_l1': 'THR-ENV',
        })

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1

    def test_error_hierarchy_filter_params(
        self, authenticated_client, aviation_project
    ):
        """error_l1, error_l2, error_l3 query params filter results."""
        event1 = AviationEventFactory(task__project=aviation_project.project)
        event2 = AviationEventFactory(task__project=aviation_project.project)

        # Create error hierarchy
        error_l1 = TypeHierarchyFactory(
            category='error', level=1, code='ERR-COMM'
        )

        LabelingItemFactory(event=event1, error_type_l1=error_l1)
        LabelingItemFactory(event=event2)  # No error type

        url = get_events_analytics_url(aviation_project.id)
        response = authenticated_client.get(url, {
            'error_l1': 'ERR-COMM',
        })

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1

    def test_uas_hierarchy_filter_params(
        self, authenticated_client, aviation_project
    ):
        """uas_l1, uas_l2, uas_l3 query params filter results."""
        event1 = AviationEventFactory(task__project=aviation_project.project)
        event2 = AviationEventFactory(task__project=aviation_project.project)

        # Create UAS hierarchy
        uas_l1 = TypeHierarchyFactory(
            category='uas', level=1, code='UAS-CTRL'
        )

        LabelingItemFactory(event=event1, uas_type_l1=uas_l1)
        LabelingItemFactory(event=event2)  # No UAS type

        url = get_events_analytics_url(aviation_project.id)
        response = authenticated_client.get(url, {
            'uas_l1': 'UAS-CTRL',
        })

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1

    def test_all_filter_params(self, authenticated_client, aviation_project):
        """All 10 filter params can be passed via query string."""
        # Create an event that matches all filters
        event = AviationEventFactory(
            task__project=aviation_project.project,
            date=date(2023, 6, 15),
            aircraft_type='A320',
            departure_airport='KJFK',
        )

        # Create hierarchies
        threat_l1 = TypeHierarchyFactory(
            category='threat', level=1, code='THR-ENV'
        )
        error_l1 = TypeHierarchyFactory(
            category='error', level=1, code='ERR-COMM'
        )
        uas_l1 = TypeHierarchyFactory(
            category='uas', level=1, code='UAS-CTRL'
        )

        LabelingItemFactory(
            event=event,
            threat_type_l1=threat_l1,
            error_type_l1=error_l1,
            uas_type_l1=uas_l1,
        )
        ResultPerformanceFactory(
            aviation_project=aviation_project,
            event=event,
            event_type='incident',
            flight_phase='takeoff',
        )

        url = get_events_analytics_url(aviation_project.id)
        response = authenticated_client.get(url, {
            'date_start': '2023-06-01',
            'date_end': '2023-06-30',
            'aircraft': 'A320',
            'airport': 'KJFK',
            'event_type': 'incident',
            'flight_phase': 'takeoff',
            'threat_l1': 'THR-ENV',
            'error_l1': 'ERR-COMM',
            'uas_l1': 'UAS-CTRL',
        })

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1


# =============================================================================
# EDGE CASES
# =============================================================================


@pytest.mark.django_db
class TestEdgeCases:
    """Tests for edge cases."""

    def test_empty_project(self, authenticated_client, aviation_project):
        """Returns empty results for project with no events."""
        url = get_events_analytics_url(aviation_project.id)
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 0
        assert response.data['results'] == []

    def test_invalid_project_id(self, authenticated_client):
        """Returns 404 for non-existent project."""
        url = get_events_analytics_url(99999)
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_event_with_null_time(self, authenticated_client, aviation_project):
        """Handles events with null time field."""
        event = AviationEventFactory(
            task__project=aviation_project.project,
            time=None,
        )

        url = get_events_analytics_url(aviation_project.id)
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['results'][0]['基本信息']['时间'] is None

    def test_event_with_no_labeling_items(
        self, authenticated_client, aviation_project
    ):
        """Handles events with no labeling items."""
        event = AviationEventFactory(task__project=aviation_project.project)

        url = get_events_analytics_url(aviation_project.id)
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['results'][0]['标签标注列表'] == []

    def test_event_with_no_result_performances(
        self, authenticated_client, aviation_project
    ):
        """Handles events with no result performances."""
        event = AviationEventFactory(task__project=aviation_project.project)

        url = get_events_analytics_url(aviation_project.id)
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['results'][0]['结果绩效列表'] == []

    def test_ordering_by_date_desc(self, authenticated_client, aviation_project):
        """Events are ordered by date descending."""
        event1 = AviationEventFactory(
            task__project=aviation_project.project,
            date=date(2023, 1, 1),
            event_number='EVT-001',
        )
        event2 = AviationEventFactory(
            task__project=aviation_project.project,
            date=date(2023, 12, 31),
            event_number='EVT-002',
        )
        event3 = AviationEventFactory(
            task__project=aviation_project.project,
            date=date(2023, 6, 15),
            event_number='EVT-003',
        )

        url = get_events_analytics_url(aviation_project.id)
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        results = response.data['results']
        assert results[0]['eventId'] == 'EVT-002'
        assert results[1]['eventId'] == 'EVT-003'
        assert results[2]['eventId'] == 'EVT-001'

    def test_labeling_item_with_null_hierarchy(
        self, authenticated_client, aviation_project
    ):
        """Handles labeling items with null hierarchy types."""
        event = AviationEventFactory(task__project=aviation_project.project)
        labeling_item = LabelingItemFactory(
            event=event,
            threat_type_l1=None,
            threat_type_l2=None,
            threat_type_l3=None,
            error_type_l1=None,
            error_type_l2=None,
            error_type_l3=None,
            uas_type_l1=None,
            uas_type_l2=None,
            uas_type_l3=None,
        )

        url = get_events_analytics_url(aviation_project.id)
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        item = response.data['results'][0]['标签标注列表'][0]

        # Check that hierarchy levels are empty/null
        assert item['威胁列表']['level1'] is None
        assert item['威胁列表']['level2'] is None
        assert item['威胁列表']['level3'] is None
        assert item['差错列表']['level1'] is None
        assert item['差错列表']['level2'] is None
        assert item['差错列表']['level3'] is None
        assert item['UAS列表']['level1'] is None
        assert item['UAS列表']['level2'] is None
        assert item['UAS列表']['level3'] is None
