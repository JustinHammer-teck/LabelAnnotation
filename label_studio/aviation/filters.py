"""
Aviation analytics filter functions.

This module provides filter functions for all 10 filter types used in aviation
analytics. Each filter function takes a queryset and filter parameters, returning
a filtered queryset.

Phase 1: Backend Filtering Infrastructure

Filter Types:
1. Date Range (date_start, date_end)
2. Aircraft Type (aircraft)
3. Airport (any of departure/arrival/actual_landing)
4. Event Type (via ResultPerformance)
5. Flight Phase (via ResultPerformance)
6. Threat Hierarchy (threat_l1, threat_l2, threat_l3)
7. Error Hierarchy (error_l1, error_l2, error_l3)
8. UAS Hierarchy (uas_l1, uas_l2, uas_l3)
9. Training Topic (JSONField in ResultPerformance)
10. Competency (JSONField in LabelingItem coping_abilities)

Usage:
    from aviation.filters import apply_all_filters

    queryset = AviationEvent.objects.filter(task__project=project)
    filtered = apply_all_filters(queryset, {
        'date_start': date(2023, 1, 1),
        'date_end': date(2023, 12, 31),
        'aircraft': ['A320', 'B737'],
        'airport': 'KJFK',
    })
"""
import re
from datetime import date
from typing import Dict, List, Optional, Any

from django.db.models import Q, QuerySet

from aviation.models import AviationEvent


# Validation pattern for competency codes (e.g., 'KNO', 'KNO.1', 'PRO.2')
COMPETENCY_PATTERN = re.compile(r'^[A-Z]{3}(\.\d+)?$')

# Valid prefixes for hierarchy filters
VALID_HIERARCHY_PREFIXES = {'threat', 'error', 'uas'}


def apply_date_filter(
    queryset: QuerySet[AviationEvent],
    date_start: Optional[date] = None,
    date_end: Optional[date] = None,
) -> QuerySet[AviationEvent]:
    """
    Filter events by date range.

    Both date_start and date_end are inclusive. If neither is provided,
    the queryset is returned unchanged.

    Args:
        queryset: AviationEvent queryset to filter
        date_start: Start date (inclusive). Events on or after this date are included.
        date_end: End date (inclusive). Events on or before this date are included.

    Returns:
        Filtered queryset containing events within the date range.

    Example:
        >>> queryset = AviationEvent.objects.all()
        >>> filtered = apply_date_filter(queryset, date_start=date(2023, 1, 1))
    """
    if date_start:
        queryset = queryset.filter(date__gte=date_start)
    if date_end:
        queryset = queryset.filter(date__lte=date_end)
    return queryset


def apply_aircraft_filter(
    queryset: QuerySet[AviationEvent],
    aircraft: Optional[List[str]] = None,
) -> QuerySet[AviationEvent]:
    """
    Filter events by aircraft type(s).

    Multiple aircraft types use OR logic (match any).

    Args:
        queryset: AviationEvent queryset to filter
        aircraft: List of aircraft type codes (e.g., ['A320', 'B737']).
                 None or empty list returns all events.

    Returns:
        Filtered queryset containing events with matching aircraft types.

    Example:
        >>> queryset = AviationEvent.objects.all()
        >>> filtered = apply_aircraft_filter(queryset, aircraft=['A320', 'B737'])
    """
    if not aircraft:
        return queryset
    return queryset.filter(aircraft_type__in=aircraft)


def apply_airport_filter(
    queryset: QuerySet[AviationEvent],
    airport: Optional[str] = None,
) -> QuerySet[AviationEvent]:
    """
    Filter events by any airport field (OR logic).

    Matches the airport code against departure_airport, arrival_airport,
    and actual_landing_airport fields using OR logic.

    Args:
        queryset: AviationEvent queryset to filter
        airport: Airport ICAO code (e.g., 'KJFK').
                None or empty string returns all events.

    Returns:
        Filtered queryset containing events where the airport appears
        in any of the three airport fields.

    Example:
        >>> queryset = AviationEvent.objects.all()
        >>> filtered = apply_airport_filter(queryset, airport='KJFK')
    """
    if not airport:
        return queryset
    return queryset.filter(
        Q(departure_airport=airport)
        | Q(arrival_airport=airport)
        | Q(actual_landing_airport=airport)
    )


def apply_event_type_filter(
    queryset: QuerySet[AviationEvent],
    event_types: Optional[List[str]] = None,
) -> QuerySet[AviationEvent]:
    """
    Filter events by ResultPerformance.event_type.

    Joins through result_performances relation to filter by event type.
    Multiple event types use OR logic.

    Args:
        queryset: AviationEvent queryset to filter
        event_types: List of event type values (e.g., ['incident', 'accident']).
                    None or empty list returns all events.

    Returns:
        Filtered queryset containing events with matching result performance
        event types.

    Example:
        >>> queryset = AviationEvent.objects.all()
        >>> filtered = apply_event_type_filter(queryset, event_types=['incident'])
    """
    if not event_types:
        return queryset
    return queryset.filter(
        result_performances__event_type__in=event_types
    )


def apply_flight_phase_filter(
    queryset: QuerySet[AviationEvent],
    flight_phases: Optional[List[str]] = None,
) -> QuerySet[AviationEvent]:
    """
    Filter events by ResultPerformance.flight_phase.

    Joins through result_performances relation to filter by flight phase.
    Multiple flight phases use OR logic.

    Args:
        queryset: AviationEvent queryset to filter
        flight_phases: List of flight phase values (e.g., ['takeoff', 'landing']).
                      None or empty list returns all events.

    Returns:
        Filtered queryset containing events with matching result performance
        flight phases.

    Example:
        >>> queryset = AviationEvent.objects.all()
        >>> filtered = apply_flight_phase_filter(queryset, flight_phases=['takeoff'])
    """
    if not flight_phases:
        return queryset
    return queryset.filter(
        result_performances__flight_phase__in=flight_phases
    )


def apply_hierarchy_filter(
    queryset: QuerySet[AviationEvent],
    prefix: str,
    l1: Optional[str] = None,
    l2: Optional[str] = None,
    l3: Optional[str] = None,
) -> QuerySet[AviationEvent]:
    """
    Filter events by hierarchical type codes (threat/error/uas).

    Filters through labeling_items relation based on TypeHierarchy codes.
    Uses the most specific level provided (l3 > l2 > l1).

    Args:
        queryset: AviationEvent queryset to filter
        prefix: Hierarchy type prefix ('threat', 'error', or 'uas')
        l1: Level 1 type code
        l2: Level 2 type code (optional, requires l1)
        l3: Level 3 type code (optional, requires l1 and l2)

    Returns:
        Filtered queryset containing events with labeling items matching
        the hierarchy codes. Returns distinct events.

    Example:
        >>> queryset = AviationEvent.objects.all()
        >>> filtered = apply_hierarchy_filter(
        ...     queryset, prefix='threat', l1='THR-ENV', l2='THR-WX'
        ... )
    """
    # Validate prefix to prevent injection
    if prefix not in VALID_HIERARCHY_PREFIXES:
        return queryset

    # Build filter based on most specific level provided
    if l3:
        return queryset.filter(
            **{f'labeling_items__{prefix}_type_l3__code': l3}
        )
    elif l2:
        return queryset.filter(
            **{f'labeling_items__{prefix}_type_l2__code': l2}
        )
    elif l1:
        return queryset.filter(
            **{f'labeling_items__{prefix}_type_l1__code': l1}
        )
    return queryset


def apply_training_topic_filter(
    queryset: QuerySet[AviationEvent],
    topics: Optional[List[str]] = None,
) -> QuerySet[AviationEvent]:
    """
    Filter events by training topics in ResultPerformance.training_topics JSONField.

    Uses PostgreSQL JSON containment operator to check if any of the provided
    topics exist in the training_topics array.

    Args:
        queryset: AviationEvent queryset to filter
        topics: List of training topic strings (e.g., ['CRM', 'Communication']).
               None or empty list returns all events.

    Returns:
        Filtered queryset containing events with result performances
        that have any of the specified training topics.

    Example:
        >>> queryset = AviationEvent.objects.all()
        >>> filtered = apply_training_topic_filter(queryset, topics=['CRM'])
    """
    if not topics:
        return queryset

    # Build OR query for each topic using JSONField contains
    q_filter = Q()
    for topic in topics:
        q_filter |= Q(result_performances__training_topics__contains=[topic])
    return queryset.filter(q_filter)


def apply_competency_filter(
    queryset: QuerySet[AviationEvent],
    competencies: Optional[List[str]] = None,
) -> QuerySet[AviationEvent]:
    """
    Filter events by competency codes across all coping_abilities JSONFields.

    Searches for competency codes in threat_coping_abilities, error_coping_abilities,
    and uas_coping_abilities JSONFields. Supports both category prefixes (e.g., 'KNO')
    and specific codes (e.g., 'KNO.1').

    For category prefixes (no dot), matches any competency starting with that prefix.
    For specific codes (with dot), matches exactly.

    Args:
        queryset: AviationEvent queryset to filter
        competencies: List of competency codes (e.g., ['KNO', 'KNO.1', 'PRO.2']).
                     None or empty list returns all events.

    Returns:
        Filtered queryset containing events with labeling items that have
        any of the specified competencies in any coping_abilities field.

    Example:
        >>> queryset = AviationEvent.objects.all()
        >>> filtered = apply_competency_filter(queryset, competencies=['KNO.1'])
    """
    if not competencies:
        return queryset

    # Validate competency format to prevent injection
    validated_competencies = []
    for comp in competencies:
        if not COMPETENCY_PATTERN.match(comp):
            continue  # Skip invalid formats
        validated_competencies.append(comp)

    if not validated_competencies:
        return queryset

    # Build OR query across all three coping_abilities fields
    q_filter = Q()
    for competency in validated_competencies:
        # Check if it's a category prefix (no dot) or specific code
        if '.' in competency:
            # Specific code - exact match in values array
            q_filter |= Q(labeling_items__threat_coping_abilities__values__contains=[competency])
            q_filter |= Q(labeling_items__error_coping_abilities__values__contains=[competency])
            q_filter |= Q(labeling_items__uas_coping_abilities__values__contains=[competency])
        else:
            # Category prefix - use regex to match any value starting with prefix
            # Convert JSONField to text and use regex/icontains
            # PostgreSQL approach: cast values array to text and use icontains
            prefix_pattern = f'{competency}.'
            q_filter |= Q(labeling_items__threat_coping_abilities__values__icontains=prefix_pattern)
            q_filter |= Q(labeling_items__error_coping_abilities__values__icontains=prefix_pattern)
            q_filter |= Q(labeling_items__uas_coping_abilities__values__icontains=prefix_pattern)

    return queryset.filter(q_filter)


def apply_all_filters(
    queryset: QuerySet[AviationEvent],
    filter_params: Dict[str, Any],
) -> QuerySet[AviationEvent]:
    """
    Apply all filters from a parameter dictionary.

    Combines all filter types with AND logic. Each individual filter
    may use OR logic internally (e.g., multiple aircraft types).

    Args:
        queryset: AviationEvent queryset to filter
        filter_params: Dictionary containing filter parameters:
            - date_start: Start date (date object)
            - date_end: End date (date object)
            - aircraft: List of aircraft types
            - airport: Single airport code
            - event_types: List of event types
            - flight_phases: List of flight phases
            - threat_l1, threat_l2, threat_l3: Threat hierarchy codes
            - error_l1, error_l2, error_l3: Error hierarchy codes
            - uas_l1, uas_l2, uas_l3: UAS hierarchy codes
            - training_topics: List of training topics
            - competencies: List of competency codes

    Returns:
        Filtered queryset with all applicable filters applied.

    Example:
        >>> queryset = AviationEvent.objects.all()
        >>> filtered = apply_all_filters(queryset, {
        ...     'date_start': date(2023, 1, 1),
        ...     'aircraft': ['A320'],
        ...     'airport': 'KJFK',
        ... })
    """
    # Apply date filter
    queryset = apply_date_filter(
        queryset,
        date_start=filter_params.get('date_start'),
        date_end=filter_params.get('date_end'),
    )

    # Apply aircraft filter
    queryset = apply_aircraft_filter(
        queryset,
        aircraft=filter_params.get('aircraft'),
    )

    # Apply airport filter
    queryset = apply_airport_filter(
        queryset,
        airport=filter_params.get('airport'),
    )

    # Apply event type filter
    queryset = apply_event_type_filter(
        queryset,
        event_types=filter_params.get('event_types'),
    )

    # Apply flight phase filter
    queryset = apply_flight_phase_filter(
        queryset,
        flight_phases=filter_params.get('flight_phases'),
    )

    # Apply threat hierarchy filter
    if any(filter_params.get(f'threat_l{i}') for i in [1, 2, 3]):
        queryset = apply_hierarchy_filter(
            queryset,
            prefix='threat',
            l1=filter_params.get('threat_l1'),
            l2=filter_params.get('threat_l2'),
            l3=filter_params.get('threat_l3'),
        )

    # Apply error hierarchy filter
    if any(filter_params.get(f'error_l{i}') for i in [1, 2, 3]):
        queryset = apply_hierarchy_filter(
            queryset,
            prefix='error',
            l1=filter_params.get('error_l1'),
            l2=filter_params.get('error_l2'),
            l3=filter_params.get('error_l3'),
        )

    # Apply UAS hierarchy filter
    if any(filter_params.get(f'uas_l{i}') for i in [1, 2, 3]):
        queryset = apply_hierarchy_filter(
            queryset,
            prefix='uas',
            l1=filter_params.get('uas_l1'),
            l2=filter_params.get('uas_l2'),
            l3=filter_params.get('uas_l3'),
        )

    # Apply training topic filter
    queryset = apply_training_topic_filter(
        queryset,
        topics=filter_params.get('training_topics'),
    )

    # Apply competency filter
    queryset = apply_competency_filter(
        queryset,
        competencies=filter_params.get('competencies'),
    )

    # Apply distinct only once at the end if we used any join filters
    uses_joins = any([
        filter_params.get('event_types'),
        filter_params.get('flight_phases'),
        filter_params.get('training_topics'),
        filter_params.get('competencies'),
        any(filter_params.get(f'{prefix}_l{i}')
            for prefix in ['threat', 'error', 'uas']
            for i in [1, 2, 3])
    ])

    if uses_joins:
        queryset = queryset.distinct()

    return queryset
