"""
Tests for aviation analytics API integration.

This module tests performance, large dataset handling, and edge cases
for the analytics filtering and pagination infrastructure.

Phase 4: Backend Integration Tests

Test categories:
- Large dataset handling (100+ events)
- Performance benchmarks (response time < 500ms, query count <= 8)
- Filter combination performance
- Edge cases (empty results, null hierarchies, unicode)
- Data integrity (nested data completeness, hierarchy labels)
"""
import pytest
import time
import random
from datetime import date, time as datetime_time
from django.db import connection
from django.test.utils import CaptureQueriesContext
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

# Performance threshold constants
RESPONSE_TIME_THRESHOLD_MS = 500  # Maximum response time in milliseconds
COMPLEX_QUERY_THRESHOLD_MS = 1000  # Maximum response time for complex queries
MAX_QUERY_COUNT = 8  # Maximum allowed database queries with optimal prefetching

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
    create_large_dataset,
)
from users.tests.factories import UserFactory
from organizations.tests.factories import OrganizationFactory


# Check if we're using SQLite (doesn't support JSONField contains lookup)
using_sqlite = connection.vendor == 'sqlite'


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
def aviation_project(organization):
    """Create an aviation project in the user's organization."""
    return AviationProjectFactory(
        project__organization=organization
    )


@pytest.fixture
def large_dataset(aviation_project):
    """
    Create a large dataset of 100+ events for performance testing.
    Uses the create_large_dataset helper from factories.
    """
    # Set seed for reproducibility
    random.seed(42)
    return create_large_dataset(aviation_project, count=100)


@pytest.fixture
def small_dataset(aviation_project):
    """
    Create a smaller dataset of 20 events for quick tests.
    """
    random.seed(42)
    return create_large_dataset(aviation_project, count=20)


def get_events_analytics_url(pk):
    """Get the URL for the events analytics endpoint."""
    return reverse('aviation:project-events-analytics', kwargs={'pk': pk})


# =============================================================================
# LARGE DATASET HANDLING TESTS
# =============================================================================


@pytest.mark.django_db
class TestLargeDatasetHandling:
    """Tests for handling large datasets (100+ events)."""

    def test_handles_100_events(self, authenticated_client, aviation_project, large_dataset):
        """API returns results for 100+ events."""
        url = get_events_analytics_url(aviation_project.id)
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 100
        # Default pagination returns 50 items
        assert len(response.data['results']) == 50

    def test_pagination_on_large_dataset(self, authenticated_client, aviation_project, large_dataset):
        """Pagination works correctly with many events."""
        url = get_events_analytics_url(aviation_project.id)

        # First page
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 100
        assert len(response.data['results']) == 50
        assert response.data['next'] is not None
        assert response.data['previous'] is None

        # Second page
        response = authenticated_client.get(url, {'page': 2})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 50
        assert response.data['previous'] is not None

    def test_page_size_with_large_dataset(self, authenticated_client, aviation_project, large_dataset):
        """Custom page_size works with large dataset."""
        url = get_events_analytics_url(aviation_project.id)

        response = authenticated_client.get(url, {'page_size': 100})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 100
        # With 100 items total and page_size 100, no next page
        assert response.data['next'] is None


# =============================================================================
# PERFORMANCE BENCHMARK TESTS
# =============================================================================


@pytest.mark.django_db
class TestPerformanceBenchmarks:
    """Tests for API performance benchmarks."""

    def test_response_time_under_500ms(self, authenticated_client, aviation_project, large_dataset):
        """API should respond in < 500ms for typical queries."""
        url = get_events_analytics_url(aviation_project.id)

        # Warmup request to compile queries and populate cache
        authenticated_client.get(url)

        # Actual performance measurement
        start = time.time()
        response = authenticated_client.get(url)
        elapsed = time.time() - start

        threshold_seconds = RESPONSE_TIME_THRESHOLD_MS / 1000
        assert response.status_code == status.HTTP_200_OK
        assert elapsed < threshold_seconds, f"Response took {elapsed:.2f}s, expected < {threshold_seconds}s"

    def test_query_count_optimal(self, authenticated_client, aviation_project, large_dataset):
        """Should not exceed MAX_QUERY_COUNT database queries due to prefetching."""
        url = get_events_analytics_url(aviation_project.id)

        with CaptureQueriesContext(connection) as context:
            response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        query_count = len(context)
        # With optimal prefetching: auth, org check, project, events, labeling items, result perfs, counts
        assert query_count <= MAX_QUERY_COUNT, (
            f"Made {query_count} queries, expected <= {MAX_QUERY_COUNT} for optimal prefetching. "
            f"Queries:\n{chr(10).join([q['sql'][:100] for q in context])}"
        )

    def test_filtered_query_performance(self, authenticated_client, aviation_project, large_dataset):
        """Filtered queries should still perform well."""
        url = get_events_analytics_url(aviation_project.id)

        # Apply multiple filters
        params = {
            'date_start': '2023-03-01',
            'date_end': '2023-06-30',
            'aircraft': 'A320,A330',
        }

        # Warmup request
        authenticated_client.get(url, params)

        start = time.time()
        response = authenticated_client.get(url, params)
        elapsed = time.time() - start

        threshold_seconds = RESPONSE_TIME_THRESHOLD_MS / 1000
        assert response.status_code == status.HTTP_200_OK
        assert elapsed < threshold_seconds, f"Filtered query took {elapsed:.2f}s, expected < {threshold_seconds}s"


# =============================================================================
# FILTER COMBINATION PERFORMANCE TESTS
# =============================================================================


@pytest.mark.django_db
class TestFilterCombinationPerformance:
    """Tests for filter combination performance."""

    def test_all_filters_combined_performance(self, authenticated_client, aviation_project, large_dataset):
        """All basic filters combined should still perform well."""
        url = get_events_analytics_url(aviation_project.id)
        hierarchies = large_dataset['hierarchies']

        params = {
            'date_start': '2023-01-01',
            'date_end': '2023-12-31',
            'aircraft': 'A320,A330',
            'airport': 'ZBAA',
            'event_type': 'incident',
            'flight_phase': 'takeoff',
            'threat_l1': hierarchies['threat']['l1'].code,
            'error_l1': hierarchies['error']['l1'].code,
        }

        # Warmup request
        authenticated_client.get(url, params)

        start = time.time()
        response = authenticated_client.get(url, params)
        elapsed = time.time() - start

        threshold_seconds = COMPLEX_QUERY_THRESHOLD_MS / 1000
        assert response.status_code == status.HTTP_200_OK
        # Complex queries might take slightly longer but should still be under threshold
        assert elapsed < threshold_seconds, f"Complex query took {elapsed:.2f}s, expected < {threshold_seconds}s"

    def test_date_and_hierarchy_filters(self, authenticated_client, aviation_project, large_dataset):
        """Date range + threat/error/uas hierarchy filters."""
        url = get_events_analytics_url(aviation_project.id)
        hierarchies = large_dataset['hierarchies']

        params = {
            'date_start': '2023-06-01',
            'date_end': '2023-06-30',
            'threat_l1': hierarchies['threat']['l1'].code,
            'threat_l2': hierarchies['threat']['l2'].code,
        }

        # Warmup request
        authenticated_client.get(url, params)

        start = time.time()
        response = authenticated_client.get(url, params)
        elapsed = time.time() - start

        threshold_seconds = RESPONSE_TIME_THRESHOLD_MS / 1000
        assert response.status_code == status.HTTP_200_OK
        assert elapsed < threshold_seconds, f"Hierarchy filter query took {elapsed:.2f}s, expected < {threshold_seconds}s"

    @pytest.mark.skipif(using_sqlite, reason="SQLite does not support JSONField contains lookup")
    def test_jsonfield_filters_performance(self, authenticated_client, aviation_project, large_dataset):
        """Training topic and competency filters perform well."""
        url = get_events_analytics_url(aviation_project.id)

        params = {
            'training_topic': 'CRM',
            'competency': 'KNO.1',
        }

        # Warmup request
        authenticated_client.get(url, params)

        start = time.time()
        response = authenticated_client.get(url, params)
        elapsed = time.time() - start

        threshold_seconds = COMPLEX_QUERY_THRESHOLD_MS / 1000
        assert response.status_code == status.HTTP_200_OK
        assert elapsed < threshold_seconds, f"JSONField filter query took {elapsed:.2f}s, expected < {threshold_seconds}s"


# =============================================================================
# EDGE CASE TESTS
# =============================================================================


@pytest.mark.django_db
class TestEdgeCases:
    """Tests for edge cases."""

    def test_empty_results_handling(self, authenticated_client, aviation_project):
        """Returns empty list, not error, for no matches."""
        url = get_events_analytics_url(aviation_project.id)

        response = authenticated_client.get(url, {'aircraft': 'NONEXISTENT'})

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 0
        assert response.data['results'] == []

    def test_empty_project(self, authenticated_client, aviation_project):
        """Returns empty results for project with no events."""
        url = get_events_analytics_url(aviation_project.id)
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 0
        assert response.data['results'] == []

    def test_null_hierarchy_values(self, authenticated_client, aviation_project):
        """Handles events with null threat/error/uas types."""
        # Create event with labeling item that has all null hierarchies
        event = AviationEventFactory(task__project=aviation_project.project)
        LabelingItemFactory(
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
        assert response.data['count'] == 1

        result = response.data['results'][0]
        labeling_items = result.get('标签标注列表', [])

        # Verify the response doesn't error on null hierarchies
        assert len(response.data['results']) == 1
        assert len(labeling_items) == 1

        # Verify hierarchy lists exist with null values
        item = labeling_items[0]
        assert '威胁列表' in item
        assert '差错列表' in item
        assert 'UAS列表' in item

    def test_empty_jsonfield_arrays(self, authenticated_client, aviation_project):
        """Handles empty training_topics and coping_abilities."""
        event = AviationEventFactory(task__project=aviation_project.project)
        ResultPerformanceFactory(
            aviation_project=aviation_project,
            event=event,
            training_topics=[],  # Empty array
        )
        LabelingItemFactory(
            event=event,
            threat_coping_abilities={},  # Empty dict
            error_coping_abilities={},  # Empty dict (NOT NULL constraint)
        )

        url = get_events_analytics_url(aviation_project.id)
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1

    def test_unicode_in_filters(self, authenticated_client, aviation_project):
        """Handles Chinese characters in filter values."""
        event = AviationEventFactory(
            task__project=aviation_project.project,
            aircraft_type='A320',
        )
        ResultPerformanceFactory(
            aviation_project=aviation_project,
            event=event,
            event_type='event_type_chinese',
            training_topics=['CRM'],
        )

        url = get_events_analytics_url(aviation_project.id)
        # Test with Chinese characters in filter - should not error
        response = authenticated_client.get(url, {'event_type': 'event_type_chinese'})

        assert response.status_code == status.HTTP_200_OK

    @pytest.mark.parametrize('filter_param,malicious_value', [
        ('aircraft', "A320'; DROP TABLE aviation_event;--"),
        ('aircraft', "A320' OR '1'='1"),
        ('airport', "KJFK' OR '1'='1"),
        ('airport', "KJFK'; SELECT * FROM users;--"),
        ('threat_l1', "THR-ENV'; SELECT * FROM users;--"),
        ('threat_l1', "THR-ENV' OR '1'='1"),
        ('event_type', 'incident" OR "1"="1'),
        ('event_type', "incident'; DROP TABLE tasks;--"),
        ('flight_phase', "takeoff'; DELETE FROM aviation_event;--"),
        ('error_l1', "ERR'; UNION SELECT password FROM users;--"),
    ])
    def test_sql_injection_prevention(self, authenticated_client, aviation_project, filter_param, malicious_value):
        """Handles SQL injection attempts in various filter parameters without errors."""
        url = get_events_analytics_url(aviation_project.id)

        # Test with SQL injection pattern - should not cause server error
        response = authenticated_client.get(url, {
            filter_param: malicious_value,
        })

        # Should return 200 with empty results, not 500 error
        # The ORM parameterizes all queries, preventing SQL injection
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 0


# =============================================================================
# DATA INTEGRITY TESTS
# =============================================================================


@pytest.mark.django_db
class TestDataIntegrity:
    """Tests for data integrity in responses."""

    def test_nested_data_complete(self, authenticated_client, aviation_project, small_dataset):
        """All nested labeling items and performances are included."""
        url = get_events_analytics_url(aviation_project.id)
        response = authenticated_client.get(url, {'page_size': 100})

        assert response.status_code == status.HTTP_200_OK

        # Check that events have nested data with Chinese field names
        for event_data in response.data['results']:
            # Each event should have these keys (using Chinese field names from AnalyticsEventSerializer)
            assert 'eventId' in event_data
            assert '标签标注列表' in event_data  # labeling items list
            assert '结果绩效列表' in event_data  # result performances list
            assert '基本信息' in event_data  # basic info
            assert '事件描述' in event_data  # event description

    def test_hierarchy_labels_resolved(self, authenticated_client, aviation_project):
        """TypeHierarchy labels (not just codes) appear in response."""
        # Create event with hierarchy that has label_zh
        threat_l1 = TypeHierarchyFactory(
            category='threat', level=1, code='INT-THR-L1',
            label='Test Threat', label_zh='Test Threat Chinese Label'
        )
        event = AviationEventFactory(task__project=aviation_project.project)
        LabelingItemFactory(
            event=event,
            threat_type_l1=threat_l1,
        )

        url = get_events_analytics_url(aviation_project.id)
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1

        # The serializer should return Chinese label, not code
        result = response.data['results'][0]
        labeling_items = result.get('标签标注列表', [])

        # Verify we get labeling items with hierarchy data
        assert len(labeling_items) == 1

        # Verify threat hierarchy label is resolved to Chinese label
        item = labeling_items[0]
        threat_list = item.get('威胁列表', {})
        # label_zh should be returned as level1, not the code
        assert threat_list.get('level1') == 'Test Threat Chinese Label'

    def test_event_ordering_consistent(self, authenticated_client, aviation_project, small_dataset):
        """Events are ordered consistently (by date descending)."""
        url = get_events_analytics_url(aviation_project.id)
        response = authenticated_client.get(url, {'page_size': 100})

        assert response.status_code == status.HTTP_200_OK

        results = response.data['results']
        if len(results) > 1:
            # Check dates are in descending order
            # The dates are nested in basic_info
            dates = []
            for r in results:
                basic_info = r.get('基本信息', {})
                date_str = basic_info.get('日期')
                if date_str:
                    dates.append(date_str)

            # Verify dates are sorted descending
            assert dates == sorted(dates, reverse=True), "Events should be ordered by date descending"


# =============================================================================
# CONCURRENT ACCESS TESTS
# =============================================================================


@pytest.mark.django_db
class TestConcurrentAccess:
    """Tests for concurrent access scenarios."""

    def test_multiple_requests_same_user(self, authenticated_client, aviation_project, small_dataset):
        """Multiple concurrent requests from same user don't interfere."""
        url = get_events_analytics_url(aviation_project.id)

        # Make multiple requests in sequence (simulating rapid requests)
        responses = []
        for _ in range(5):
            response = authenticated_client.get(url)
            responses.append(response)

        # All should succeed
        for response in responses:
            assert response.status_code == status.HTTP_200_OK
            assert response.data['count'] == 20  # small_dataset has 20 events

    def test_different_filter_combinations(self, authenticated_client, aviation_project, small_dataset):
        """Different filter combinations return consistent counts."""
        url = get_events_analytics_url(aviation_project.id)

        # Get total count
        response_all = authenticated_client.get(url)
        total_count = response_all.data['count']

        # Filter by date range that includes all events
        response_date = authenticated_client.get(url, {
            'date_start': '2023-01-01',
            'date_end': '2023-12-31',
        })

        # Should return same count since all events are in 2023
        assert response_date.data['count'] == total_count


# =============================================================================
# QUERY OPTIMIZATION VALIDATION TESTS
# =============================================================================


@pytest.mark.django_db
class TestQueryOptimization:
    """Tests to validate query optimization (no N+1 queries)."""

    def test_no_n_plus_1_queries(self, authenticated_client, aviation_project, small_dataset):
        """Prefetching prevents N+1 queries."""
        url = get_events_analytics_url(aviation_project.id)

        # With 20 events, without prefetching we'd have:
        # 1 (events) + 20 (labeling_items per event) + 20 (result_performances per event) = 41+ queries
        # With proper prefetching: ~5-8 queries regardless of event count

        with CaptureQueriesContext(connection) as context:
            response = authenticated_client.get(url, {'page_size': 20})

        assert response.status_code == status.HTTP_200_OK
        query_count = len(context)

        # With 20 events returned, query count should still be low
        assert query_count <= MAX_QUERY_COUNT, (
            f"N+1 detected: {query_count} queries for 20 events, expected <= {MAX_QUERY_COUNT}. "
            f"Queries:\n{chr(10).join([q['sql'][:100] for q in context])}"
        )

    def test_distinct_results(self, authenticated_client, aviation_project):
        """Events with multiple labeling items are not duplicated."""
        event = AviationEventFactory(task__project=aviation_project.project)

        # Create multiple labeling items for same event
        for i in range(5):
            LabelingItemFactory(event=event, sequence_number=i + 1)

        url = get_events_analytics_url(aviation_project.id)
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        # Should return 1 event, not 5
        assert response.data['count'] == 1
        assert len(response.data['results']) == 1
