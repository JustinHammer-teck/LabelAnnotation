"""
Tests for aviation analytics filter functions.

This module tests all 10 filter types for the analytics filtering infrastructure.
Follows TDD approach: tests written FIRST before implementation.

Phase 1: Backend Filtering Infrastructure
"""
import pytest
from datetime import date
from django.db import connection
from django.db.models import QuerySet

# Check if we're using SQLite (doesn't support JSONField contains lookup)
using_sqlite = connection.vendor == 'sqlite'

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

# Import filter functions
from aviation.filters import (
    apply_date_filter,
    apply_aircraft_filter,
    apply_airport_filter,
    apply_event_type_filter,
    apply_flight_phase_filter,
    apply_hierarchy_filter,
    apply_training_topic_filter,
    apply_competency_filter,
    apply_all_filters,
)

# Import analytics function
from aviation.analytics import get_filtered_analytics_queryset


@pytest.fixture
def aviation_project(db):
    """Create an aviation project for testing."""
    return AviationProjectFactory()


@pytest.fixture
def events_with_dates(aviation_project):
    """Create events with different dates."""
    return [
        AviationEventFactory(
            task__project=aviation_project.project,
            date=date(2023, 1, 15),
        ),
        AviationEventFactory(
            task__project=aviation_project.project,
            date=date(2023, 6, 15),
        ),
        AviationEventFactory(
            task__project=aviation_project.project,
            date=date(2023, 12, 15),
        ),
    ]


@pytest.fixture
def events_with_aircraft(aviation_project):
    """Create events with different aircraft types."""
    return [
        AviationEventFactory(
            task__project=aviation_project.project,
            aircraft_type='A320',
        ),
        AviationEventFactory(
            task__project=aviation_project.project,
            aircraft_type='B737',
        ),
        AviationEventFactory(
            task__project=aviation_project.project,
            aircraft_type='A320',
        ),
        AviationEventFactory(
            task__project=aviation_project.project,
            aircraft_type='E190',
        ),
    ]


@pytest.fixture
def events_with_airports(aviation_project):
    """Create events with different airport combinations."""
    return [
        AviationEventFactory(
            task__project=aviation_project.project,
            departure_airport='KJFK',
            arrival_airport='KLAX',
            actual_landing_airport='KLAX',
        ),
        AviationEventFactory(
            task__project=aviation_project.project,
            departure_airport='EGLL',
            arrival_airport='LFPG',
            actual_landing_airport='LFPG',
        ),
        AviationEventFactory(
            task__project=aviation_project.project,
            departure_airport='ZBAA',
            arrival_airport='KJFK',  # KJFK as arrival
            actual_landing_airport='KJFK',
        ),
        AviationEventFactory(
            task__project=aviation_project.project,
            departure_airport='VHHH',
            arrival_airport='RCTP',
            actual_landing_airport='KJFK',  # KJFK as actual landing (diverted)
        ),
    ]


@pytest.fixture
def threat_hierarchy(db):
    """Create a threat type hierarchy for testing."""
    l1 = TypeHierarchyFactory(
        category='threat',
        level=1,
        code='THR-ENV',
        label='Environmental Threat',
    )
    l2 = TypeHierarchyFactory(
        category='threat',
        level=2,
        code='THR-WX',
        label='Weather',
        parent=l1,
    )
    l3 = TypeHierarchyFactory(
        category='threat',
        level=3,
        code='THR-WX-TURB',
        label='Turbulence',
        parent=l2,
    )
    return {'l1': l1, 'l2': l2, 'l3': l3}


@pytest.fixture
def error_hierarchy(db):
    """Create an error type hierarchy for testing."""
    l1 = TypeHierarchyFactory(
        category='error',
        level=1,
        code='ERR-COMM',
        label='Communication Error',
    )
    l2 = TypeHierarchyFactory(
        category='error',
        level=2,
        code='ERR-COMM-ATC',
        label='ATC Communication',
        parent=l1,
    )
    l3 = TypeHierarchyFactory(
        category='error',
        level=3,
        code='ERR-COMM-ATC-READBACK',
        label='Readback Error',
        parent=l2,
    )
    return {'l1': l1, 'l2': l2, 'l3': l3}


@pytest.fixture
def uas_hierarchy(db):
    """Create a UAS type hierarchy for testing."""
    l1 = TypeHierarchyFactory(
        category='uas',
        level=1,
        code='UAS-CTRL',
        label='Aircraft Control',
    )
    l2 = TypeHierarchyFactory(
        category='uas',
        level=2,
        code='UAS-CTRL-FLT',
        label='Flight Control',
        parent=l1,
    )
    l3 = TypeHierarchyFactory(
        category='uas',
        level=3,
        code='UAS-CTRL-FLT-PITCH',
        label='Pitch Control',
        parent=l2,
    )
    return {'l1': l1, 'l2': l2, 'l3': l3}


@pytest.fixture
def events_with_labeling_items(aviation_project, threat_hierarchy, error_hierarchy, uas_hierarchy):
    """Create events with labeling items that have hierarchy types."""
    event1 = AviationEventFactory(task__project=aviation_project.project)
    event2 = AviationEventFactory(task__project=aviation_project.project)
    event3 = AviationEventFactory(task__project=aviation_project.project)

    # Event 1: Has threat hierarchy
    LabelingItemFactory(
        event=event1,
        threat_type_l1=threat_hierarchy['l1'],
        threat_type_l2=threat_hierarchy['l2'],
        threat_type_l3=threat_hierarchy['l3'],
    )

    # Event 2: Has error hierarchy
    LabelingItemFactory(
        event=event2,
        error_type_l1=error_hierarchy['l1'],
        error_type_l2=error_hierarchy['l2'],
        error_type_l3=error_hierarchy['l3'],
    )

    # Event 3: Has UAS hierarchy
    LabelingItemFactory(
        event=event3,
        uas_type_l1=uas_hierarchy['l1'],
        uas_type_l2=uas_hierarchy['l2'],
        uas_type_l3=uas_hierarchy['l3'],
    )

    return [event1, event2, event3]


@pytest.fixture
def events_with_result_performances(aviation_project):
    """Create events with result performances."""
    event1 = AviationEventFactory(task__project=aviation_project.project)
    event2 = AviationEventFactory(task__project=aviation_project.project)
    event3 = AviationEventFactory(task__project=aviation_project.project)

    ResultPerformanceFactory(
        aviation_project=aviation_project,
        event=event1,
        event_type='incident',
        flight_phase='takeoff',
        training_topics=['CRM', 'Communication'],
    )
    ResultPerformanceFactory(
        aviation_project=aviation_project,
        event=event2,
        event_type='accident',
        flight_phase='landing',
        training_topics=['Manual Handling', 'Situational Awareness'],
    )
    ResultPerformanceFactory(
        aviation_project=aviation_project,
        event=event3,
        event_type='incident',
        flight_phase='cruise',
        training_topics=['CRM', 'Decision Making'],
    )

    return [event1, event2, event3]


@pytest.fixture
def events_with_competencies(aviation_project):
    """Create events with labeling items that have competency data."""
    event1 = AviationEventFactory(task__project=aviation_project.project)
    event2 = AviationEventFactory(task__project=aviation_project.project)
    event3 = AviationEventFactory(task__project=aviation_project.project)

    # Event 1: Has KNO competencies in threat
    LabelingItemFactory(
        event=event1,
        threat_coping_abilities={'values': ['KNO.1', 'KNO.2']},
    )

    # Event 2: Has PRO competencies in error
    LabelingItemFactory(
        event=event2,
        error_coping_abilities={'values': ['PRO.1', 'PRO.3']},
    )

    # Event 3: Has both KNO and PRO in UAS
    LabelingItemFactory(
        event=event3,
        uas_coping_abilities={'values': ['KNO.1', 'PRO.2']},
    )

    return [event1, event2, event3]


# =============================================================================
# DATE FILTER TESTS
# =============================================================================


@pytest.mark.django_db
class TestDateFilter:
    """Tests for date range filtering."""

    def test_filter_by_date_range_inclusive(self, events_with_dates):
        """Events within date range are included."""
        queryset = AviationEvent.objects.all()
        filtered = apply_date_filter(
            queryset,
            date_start=date(2023, 3, 1),
            date_end=date(2023, 9, 1),
        )
        assert filtered.count() == 1
        assert filtered.first().date == date(2023, 6, 15)

    def test_filter_by_date_start_only(self, events_with_dates):
        """Filter with only start date works."""
        queryset = AviationEvent.objects.all()
        filtered = apply_date_filter(queryset, date_start=date(2023, 6, 1))
        assert filtered.count() == 2
        dates = sorted([e.date for e in filtered])
        assert dates == [date(2023, 6, 15), date(2023, 12, 15)]

    def test_filter_by_date_end_only(self, events_with_dates):
        """Filter with only end date works."""
        queryset = AviationEvent.objects.all()
        filtered = apply_date_filter(queryset, date_end=date(2023, 6, 30))
        assert filtered.count() == 2
        dates = sorted([e.date for e in filtered])
        assert dates == [date(2023, 1, 15), date(2023, 6, 15)]

    def test_filter_by_date_no_params_returns_all(self, events_with_dates):
        """No date params returns all events."""
        queryset = AviationEvent.objects.all()
        filtered = apply_date_filter(queryset)
        assert filtered.count() == 3

    def test_filter_by_date_boundary_inclusive(self, events_with_dates):
        """Date boundaries are inclusive."""
        queryset = AviationEvent.objects.all()
        # Filter exactly matching one event's date
        filtered = apply_date_filter(
            queryset,
            date_start=date(2023, 6, 15),
            date_end=date(2023, 6, 15),
        )
        assert filtered.count() == 1
        assert filtered.first().date == date(2023, 6, 15)


# =============================================================================
# AIRCRAFT FILTER TESTS
# =============================================================================


@pytest.mark.django_db
class TestAircraftFilter:
    """Tests for aircraft type filtering."""

    def test_filter_by_single_aircraft(self, events_with_aircraft):
        """Filter by single aircraft type."""
        queryset = AviationEvent.objects.all()
        filtered = apply_aircraft_filter(queryset, aircraft=['A320'])
        assert filtered.count() == 2
        assert all(e.aircraft_type == 'A320' for e in filtered)

    def test_filter_by_multiple_aircraft(self, events_with_aircraft):
        """Filter by multiple aircraft types (OR logic)."""
        queryset = AviationEvent.objects.all()
        filtered = apply_aircraft_filter(queryset, aircraft=['A320', 'B737'])
        assert filtered.count() == 3
        aircraft_types = set(e.aircraft_type for e in filtered)
        assert aircraft_types == {'A320', 'B737'}

    def test_filter_by_aircraft_empty_list_returns_all(self, events_with_aircraft):
        """Empty aircraft list returns all events."""
        queryset = AviationEvent.objects.all()
        filtered = apply_aircraft_filter(queryset, aircraft=[])
        assert filtered.count() == 4

    def test_filter_by_aircraft_none_returns_all(self, events_with_aircraft):
        """None aircraft returns all events."""
        queryset = AviationEvent.objects.all()
        filtered = apply_aircraft_filter(queryset, aircraft=None)
        assert filtered.count() == 4

    def test_filter_by_aircraft_no_match(self, events_with_aircraft):
        """Non-existent aircraft returns empty queryset."""
        queryset = AviationEvent.objects.all()
        filtered = apply_aircraft_filter(queryset, aircraft=['C172'])
        assert filtered.count() == 0


# =============================================================================
# AIRPORT FILTER TESTS
# =============================================================================


@pytest.mark.django_db
class TestAirportFilter:
    """Tests for airport filtering (any of departure/arrival/actual_landing)."""

    def test_filter_by_departure_airport(self, events_with_airports):
        """Filter matches departure airport."""
        queryset = AviationEvent.objects.all()
        filtered = apply_airport_filter(queryset, airport='KJFK')
        # KJFK appears as departure (event1), arrival (event3), actual_landing (event3, event4)
        assert filtered.count() == 3

    def test_filter_by_arrival_airport(self, events_with_airports):
        """Filter matches arrival airport."""
        queryset = AviationEvent.objects.all()
        filtered = apply_airport_filter(queryset, airport='LFPG')
        # LFPG appears in event2 as arrival and actual_landing
        assert filtered.count() == 1

    def test_filter_by_actual_landing_airport(self, events_with_airports):
        """Filter matches actual landing airport."""
        queryset = AviationEvent.objects.all()
        filtered = apply_airport_filter(queryset, airport='RCTP')
        # RCTP only appears as arrival in event4
        assert filtered.count() == 1

    def test_filter_by_any_airport(self, events_with_airports):
        """Filter matches any of the three airport fields (OR logic)."""
        queryset = AviationEvent.objects.all()
        # KJFK: departure in event1, arrival in event3, actual_landing in event3 & event4
        filtered = apply_airport_filter(queryset, airport='KJFK')
        assert filtered.count() == 3

    def test_filter_by_airport_none_returns_all(self, events_with_airports):
        """None airport returns all events."""
        queryset = AviationEvent.objects.all()
        filtered = apply_airport_filter(queryset, airport=None)
        assert filtered.count() == 4

    def test_filter_by_airport_empty_returns_all(self, events_with_airports):
        """Empty string airport returns all events."""
        queryset = AviationEvent.objects.all()
        filtered = apply_airport_filter(queryset, airport='')
        assert filtered.count() == 4


# =============================================================================
# EVENT TYPE FILTER TESTS
# =============================================================================


@pytest.mark.django_db
class TestEventTypeFilter:
    """Tests for event type filtering via ResultPerformance."""

    def test_filter_by_event_type(self, events_with_result_performances):
        """Filter by ResultPerformance.event_type."""
        queryset = AviationEvent.objects.all()
        filtered = apply_event_type_filter(queryset, event_types=['incident'])
        assert filtered.count() == 2

    def test_filter_by_multiple_event_types(self, events_with_result_performances):
        """Filter by multiple event types (OR logic)."""
        queryset = AviationEvent.objects.all()
        filtered = apply_event_type_filter(queryset, event_types=['incident', 'accident'])
        assert filtered.count() == 3

    def test_filter_by_event_type_none_returns_all(self, events_with_result_performances):
        """None event_types returns all events."""
        queryset = AviationEvent.objects.all()
        filtered = apply_event_type_filter(queryset, event_types=None)
        assert filtered.count() == 3

    def test_filter_by_event_type_empty_returns_all(self, events_with_result_performances):
        """Empty event_types list returns all events."""
        queryset = AviationEvent.objects.all()
        filtered = apply_event_type_filter(queryset, event_types=[])
        assert filtered.count() == 3

    def test_filter_by_event_type_no_match(self, events_with_result_performances):
        """Non-existent event type returns empty queryset."""
        queryset = AviationEvent.objects.all()
        filtered = apply_event_type_filter(queryset, event_types=['nonexistent'])
        assert filtered.count() == 0


# =============================================================================
# FLIGHT PHASE FILTER TESTS
# =============================================================================


@pytest.mark.django_db
class TestFlightPhaseFilter:
    """Tests for flight phase filtering via ResultPerformance."""

    def test_filter_by_flight_phase(self, events_with_result_performances):
        """Filter by ResultPerformance.flight_phase."""
        queryset = AviationEvent.objects.all()
        filtered = apply_flight_phase_filter(queryset, flight_phases=['takeoff'])
        assert filtered.count() == 1

    def test_filter_by_multiple_flight_phases(self, events_with_result_performances):
        """Filter by multiple flight phases (OR logic)."""
        queryset = AviationEvent.objects.all()
        filtered = apply_flight_phase_filter(queryset, flight_phases=['takeoff', 'landing'])
        assert filtered.count() == 2

    def test_filter_by_flight_phase_none_returns_all(self, events_with_result_performances):
        """None flight_phases returns all events."""
        queryset = AviationEvent.objects.all()
        filtered = apply_flight_phase_filter(queryset, flight_phases=None)
        assert filtered.count() == 3

    def test_filter_by_flight_phase_empty_returns_all(self, events_with_result_performances):
        """Empty flight_phases list returns all events."""
        queryset = AviationEvent.objects.all()
        filtered = apply_flight_phase_filter(queryset, flight_phases=[])
        assert filtered.count() == 3


# =============================================================================
# THREAT HIERARCHY FILTER TESTS
# =============================================================================


@pytest.mark.django_db
class TestThreatHierarchyFilter:
    """Tests for threat type hierarchy filtering."""

    def test_filter_by_threat_l1_only(self, events_with_labeling_items, threat_hierarchy):
        """Filter by threat level 1 only."""
        queryset = AviationEvent.objects.all()
        filtered = apply_hierarchy_filter(
            queryset,
            prefix='threat',
            l1=threat_hierarchy['l1'].code,
        )
        assert filtered.count() == 1

    def test_filter_by_threat_l1_l2(self, events_with_labeling_items, threat_hierarchy):
        """Filter by threat level 1 and 2."""
        queryset = AviationEvent.objects.all()
        filtered = apply_hierarchy_filter(
            queryset,
            prefix='threat',
            l1=threat_hierarchy['l1'].code,
            l2=threat_hierarchy['l2'].code,
        )
        assert filtered.count() == 1

    def test_filter_by_threat_l1_l2_l3(self, events_with_labeling_items, threat_hierarchy):
        """Filter by all three threat levels."""
        queryset = AviationEvent.objects.all()
        filtered = apply_hierarchy_filter(
            queryset,
            prefix='threat',
            l1=threat_hierarchy['l1'].code,
            l2=threat_hierarchy['l2'].code,
            l3=threat_hierarchy['l3'].code,
        )
        assert filtered.count() == 1

    def test_filter_by_threat_no_match(self, events_with_labeling_items):
        """Non-existent threat code returns empty queryset."""
        queryset = AviationEvent.objects.all()
        filtered = apply_hierarchy_filter(
            queryset,
            prefix='threat',
            l1='NONEXISTENT',
        )
        assert filtered.count() == 0


# =============================================================================
# ERROR HIERARCHY FILTER TESTS
# =============================================================================


@pytest.mark.django_db
class TestErrorHierarchyFilter:
    """Tests for error type hierarchy filtering."""

    def test_filter_by_error_l1_only(self, events_with_labeling_items, error_hierarchy):
        """Filter by error level 1 only."""
        queryset = AviationEvent.objects.all()
        filtered = apply_hierarchy_filter(
            queryset,
            prefix='error',
            l1=error_hierarchy['l1'].code,
        )
        assert filtered.count() == 1

    def test_filter_by_error_full_hierarchy(self, events_with_labeling_items, error_hierarchy):
        """Filter by complete error hierarchy."""
        queryset = AviationEvent.objects.all()
        filtered = apply_hierarchy_filter(
            queryset,
            prefix='error',
            l1=error_hierarchy['l1'].code,
            l2=error_hierarchy['l2'].code,
            l3=error_hierarchy['l3'].code,
        )
        assert filtered.count() == 1


# =============================================================================
# UAS HIERARCHY FILTER TESTS
# =============================================================================


@pytest.mark.django_db
class TestUASHierarchyFilter:
    """Tests for UAS type hierarchy filtering."""

    def test_filter_by_uas_l1_only(self, events_with_labeling_items, uas_hierarchy):
        """Filter by UAS level 1 only."""
        queryset = AviationEvent.objects.all()
        filtered = apply_hierarchy_filter(
            queryset,
            prefix='uas',
            l1=uas_hierarchy['l1'].code,
        )
        assert filtered.count() == 1

    def test_filter_by_uas_full_hierarchy(self, events_with_labeling_items, uas_hierarchy):
        """Filter by complete UAS hierarchy."""
        queryset = AviationEvent.objects.all()
        filtered = apply_hierarchy_filter(
            queryset,
            prefix='uas',
            l1=uas_hierarchy['l1'].code,
            l2=uas_hierarchy['l2'].code,
            l3=uas_hierarchy['l3'].code,
        )
        assert filtered.count() == 1


# =============================================================================
# TRAINING TOPIC FILTER TESTS (JSONField)
# =============================================================================


@pytest.mark.django_db
class TestTrainingTopicFilter:
    """Tests for training topic filtering (JSONField array contains)."""

    @pytest.mark.skipif(using_sqlite, reason="SQLite does not support JSONField contains lookup")
    def test_filter_by_single_training_topic(self, events_with_result_performances):
        """Filter by single training topic in JSONField array."""
        queryset = AviationEvent.objects.all()
        filtered = apply_training_topic_filter(queryset, topics=['CRM'])
        assert filtered.count() == 2

    @pytest.mark.skipif(using_sqlite, reason="SQLite does not support JSONField contains lookup")
    def test_filter_by_multiple_training_topics(self, events_with_result_performances):
        """Filter by multiple training topics (OR logic)."""
        queryset = AviationEvent.objects.all()
        filtered = apply_training_topic_filter(queryset, topics=['CRM', 'Manual Handling'])
        assert filtered.count() == 3

    def test_filter_by_training_topic_none_returns_all(self, events_with_result_performances):
        """None topics returns all events."""
        queryset = AviationEvent.objects.all()
        filtered = apply_training_topic_filter(queryset, topics=None)
        assert filtered.count() == 3

    def test_filter_by_training_topic_empty_returns_all(self, events_with_result_performances):
        """Empty topics list returns all events."""
        queryset = AviationEvent.objects.all()
        filtered = apply_training_topic_filter(queryset, topics=[])
        assert filtered.count() == 3

    @pytest.mark.skipif(using_sqlite, reason="SQLite does not support JSONField contains lookup")
    def test_filter_by_training_topic_no_match(self, events_with_result_performances):
        """Non-existent topic returns empty queryset."""
        queryset = AviationEvent.objects.all()
        filtered = apply_training_topic_filter(queryset, topics=['NonexistentTopic'])
        assert filtered.count() == 0


# =============================================================================
# COMPETENCY FILTER TESTS (JSONField)
# =============================================================================


@pytest.mark.django_db
class TestCompetencyFilter:
    """Tests for competency filtering across coping_abilities JSONFields."""

    def test_filter_by_competency_category(self, events_with_competencies):
        """Filter by competency category prefix (e.g., KNO matches KNO.1, KNO.2)."""
        queryset = AviationEvent.objects.all()
        # KNO.1 appears in event1 (threat) and event3 (uas), KNO.2 in event1
        # Filtering by 'KNO' should match any value starting with 'KNO'
        filtered = apply_competency_filter(queryset, competencies=['KNO'])
        assert filtered.count() == 2

    @pytest.mark.skipif(using_sqlite, reason="SQLite does not support JSONField contains lookup")
    def test_filter_by_specific_competency(self, events_with_competencies):
        """Filter by specific competency (e.g., KNO.1)."""
        queryset = AviationEvent.objects.all()
        # KNO.1 appears in event1 (threat) and event3 (uas)
        filtered = apply_competency_filter(queryset, competencies=['KNO.1'])
        assert filtered.count() == 2

    @pytest.mark.skipif(using_sqlite, reason="SQLite does not support JSONField contains lookup")
    def test_filter_by_multiple_competencies(self, events_with_competencies):
        """Filter by multiple competencies (OR logic)."""
        queryset = AviationEvent.objects.all()
        # PRO.1 in event2, PRO.2 in event3
        filtered = apply_competency_filter(queryset, competencies=['PRO.1', 'PRO.2'])
        assert filtered.count() == 2

    def test_filter_by_competency_none_returns_all(self, events_with_competencies):
        """None competencies returns all events."""
        queryset = AviationEvent.objects.all()
        filtered = apply_competency_filter(queryset, competencies=None)
        assert filtered.count() == 3

    def test_filter_by_competency_empty_returns_all(self, events_with_competencies):
        """Empty competencies list returns all events."""
        queryset = AviationEvent.objects.all()
        filtered = apply_competency_filter(queryset, competencies=[])
        assert filtered.count() == 3

    @pytest.mark.skipif(using_sqlite, reason="SQLite does not support JSONField contains lookup")
    def test_filter_by_competency_no_match(self, events_with_competencies):
        """Non-existent competency returns empty queryset."""
        queryset = AviationEvent.objects.all()
        filtered = apply_competency_filter(queryset, competencies=['XXX.99'])
        assert filtered.count() == 0


# =============================================================================
# COMBINED FILTER TESTS
# =============================================================================


@pytest.mark.django_db
class TestCombinedFilters:
    """Tests for combining multiple filters."""

    def test_combined_date_and_aircraft(self, aviation_project):
        """Multiple filters combine with AND logic."""
        # Create specific test data
        event1 = AviationEventFactory(
            task__project=aviation_project.project,
            date=date(2023, 6, 15),
            aircraft_type='A320',
        )
        event2 = AviationEventFactory(
            task__project=aviation_project.project,
            date=date(2023, 6, 15),
            aircraft_type='B737',
        )
        event3 = AviationEventFactory(
            task__project=aviation_project.project,
            date=date(2023, 1, 15),
            aircraft_type='A320',
        )

        queryset = AviationEvent.objects.filter(task__project=aviation_project.project)
        filtered = apply_all_filters(
            queryset,
            {
                'date_start': date(2023, 6, 1),
                'date_end': date(2023, 6, 30),
                'aircraft': ['A320'],
            },
        )
        assert filtered.count() == 1
        assert filtered.first().id == event1.id

    @pytest.mark.skipif(using_sqlite, reason="SQLite does not support JSONField contains lookup")
    def test_all_filters_combined(self, aviation_project, threat_hierarchy):
        """All 10 filters can be applied together."""
        # Create a comprehensive test event
        event = AviationEventFactory(
            task__project=aviation_project.project,
            date=date(2023, 6, 15),
            aircraft_type='A320',
            departure_airport='KJFK',
            arrival_airport='KLAX',
            actual_landing_airport='KLAX',
        )

        # Create labeling item with hierarchy
        labeling_item = LabelingItemFactory(
            event=event,
            threat_type_l1=threat_hierarchy['l1'],
            threat_type_l2=threat_hierarchy['l2'],
            threat_type_l3=threat_hierarchy['l3'],
            threat_coping_abilities={'values': ['KNO.1']},
        )

        # Create result performance
        ResultPerformanceFactory(
            aviation_project=aviation_project,
            event=event,
            event_type='incident',
            flight_phase='takeoff',
            training_topics=['CRM'],
        )

        queryset = AviationEvent.objects.filter(task__project=aviation_project.project)

        # Apply all filters
        filtered = apply_all_filters(
            queryset,
            {
                'date_start': date(2023, 6, 1),
                'date_end': date(2023, 6, 30),
                'aircraft': ['A320'],
                'airport': 'KJFK',
                'event_types': ['incident'],
                'flight_phases': ['takeoff'],
                'threat_l1': threat_hierarchy['l1'].code,
                'threat_l2': threat_hierarchy['l2'].code,
                'threat_l3': threat_hierarchy['l3'].code,
                'training_topics': ['CRM'],
                'competencies': ['KNO.1'],
            },
        )

        assert filtered.count() == 1
        assert filtered.first().id == event.id

    def test_empty_filters_returns_all(self, aviation_project):
        """No filters returns all events."""
        event1 = AviationEventFactory(task__project=aviation_project.project)
        event2 = AviationEventFactory(task__project=aviation_project.project)
        event3 = AviationEventFactory(task__project=aviation_project.project)

        queryset = AviationEvent.objects.filter(task__project=aviation_project.project)
        filtered = apply_all_filters(queryset, {})
        assert filtered.count() == 3

    def test_no_matching_results(self, aviation_project):
        """Returns empty queryset when no matches."""
        AviationEventFactory(
            task__project=aviation_project.project,
            date=date(2023, 6, 15),
            aircraft_type='A320',
        )

        queryset = AviationEvent.objects.filter(task__project=aviation_project.project)
        filtered = apply_all_filters(
            queryset,
            {
                'date_start': date(2024, 1, 1),  # Future date
                'aircraft': ['B747'],  # Different aircraft
            },
        )
        assert filtered.count() == 0


# =============================================================================
# EDGE CASE TESTS
# =============================================================================


@pytest.mark.django_db
class TestFilterEdgeCases:
    """Tests for edge cases and error handling."""

    def test_filter_preserves_queryset_type(self, events_with_dates):
        """Filter functions return QuerySet instances."""
        queryset = AviationEvent.objects.all()
        filtered = apply_date_filter(queryset, date_start=date(2023, 1, 1))
        assert isinstance(filtered, QuerySet)

    def test_filter_is_chainable(self, aviation_project):
        """Filters can be chained."""
        event = AviationEventFactory(
            task__project=aviation_project.project,
            date=date(2023, 6, 15),
            aircraft_type='A320',
        )

        queryset = AviationEvent.objects.all()
        filtered = apply_date_filter(queryset, date_start=date(2023, 6, 1))
        filtered = apply_aircraft_filter(filtered, aircraft=['A320'])

        assert filtered.count() == 1
        assert filtered.first().id == event.id

    def test_distinct_results_for_hierarchy_filter(self, aviation_project, threat_hierarchy):
        """Hierarchy filter returns distinct results even with multiple labeling items."""
        event = AviationEventFactory(task__project=aviation_project.project)

        # Create multiple labeling items with same hierarchy
        LabelingItemFactory(
            event=event,
            threat_type_l1=threat_hierarchy['l1'],
            sequence_number=1,
        )
        LabelingItemFactory(
            event=event,
            threat_type_l1=threat_hierarchy['l1'],
            sequence_number=2,
        )

        queryset = AviationEvent.objects.all()
        # Use apply_all_filters to get distinct results (distinct is applied once at the end)
        filtered = apply_all_filters(
            queryset,
            {'threat_l1': threat_hierarchy['l1'].code},
        )
        # Should return 1, not 2 (distinct events)
        assert filtered.count() == 1

    @pytest.mark.skipif(using_sqlite, reason="SQLite does not support JSONField contains lookup")
    def test_distinct_results_for_training_topic_filter(self, aviation_project):
        """Training topic filter returns distinct results."""
        event = AviationEventFactory(task__project=aviation_project.project)

        # Create multiple result performances with same topic
        ResultPerformanceFactory(
            aviation_project=aviation_project,
            event=event,
            training_topics=['CRM', 'Communication'],
        )
        ResultPerformanceFactory(
            aviation_project=aviation_project,
            event=event,
            training_topics=['CRM', 'Leadership'],
        )

        queryset = AviationEvent.objects.all()
        # Use apply_all_filters to get distinct results (distinct is applied once at the end)
        filtered = apply_all_filters(queryset, {'training_topics': ['CRM']})
        # Should return 1, not 2 (distinct events)
        assert filtered.count() == 1


# =============================================================================
# GET FILTERED ANALYTICS QUERYSET TESTS
# =============================================================================


@pytest.mark.django_db
class TestGetFilteredAnalyticsQueryset:
    """Tests for the get_filtered_analytics_queryset function."""

    def test_returns_queryset_for_valid_project(self, aviation_project):
        """Returns a queryset for a valid aviation project."""
        AviationEventFactory(task__project=aviation_project.project)

        queryset = get_filtered_analytics_queryset(aviation_project.id)
        assert queryset is not None
        assert isinstance(queryset, QuerySet)
        assert queryset.count() == 1

    def test_returns_none_for_invalid_project(self, db):
        """Returns None for a non-existent aviation project."""
        queryset = get_filtered_analytics_queryset(99999)
        assert queryset is None

    def test_applies_filters(self, aviation_project):
        """Applies filters correctly to the queryset."""
        event1 = AviationEventFactory(
            task__project=aviation_project.project,
            date=date(2023, 6, 15),
            aircraft_type='A320',
        )
        event2 = AviationEventFactory(
            task__project=aviation_project.project,
            date=date(2023, 1, 15),
            aircraft_type='B737',
        )

        queryset = get_filtered_analytics_queryset(
            aviation_project.id,
            filters={
                'date_start': date(2023, 6, 1),
                'aircraft': ['A320'],
            },
        )
        assert queryset is not None
        assert queryset.count() == 1
        assert queryset.first().id == event1.id

    def test_returns_all_without_filters(self, aviation_project):
        """Returns all events when no filters provided."""
        AviationEventFactory(task__project=aviation_project.project)
        AviationEventFactory(task__project=aviation_project.project)
        AviationEventFactory(task__project=aviation_project.project)

        queryset = get_filtered_analytics_queryset(aviation_project.id)
        assert queryset is not None
        assert queryset.count() == 3

    def test_returns_all_with_empty_filters(self, aviation_project):
        """Returns all events with empty filter dict."""
        AviationEventFactory(task__project=aviation_project.project)
        AviationEventFactory(task__project=aviation_project.project)

        queryset = get_filtered_analytics_queryset(aviation_project.id, filters={})
        assert queryset is not None
        assert queryset.count() == 2

    def test_filters_only_project_events(self, aviation_project):
        """Only returns events from the specified project."""
        # Create events for our project
        event1 = AviationEventFactory(task__project=aviation_project.project)

        # Create event for a different project
        other_project = AviationProjectFactory()
        event2 = AviationEventFactory(task__project=other_project.project)

        queryset = get_filtered_analytics_queryset(aviation_project.id)
        assert queryset is not None
        assert queryset.count() == 1
        assert queryset.first().id == event1.id
