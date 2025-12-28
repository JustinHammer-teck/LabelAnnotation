"""
Aviation analytics query functions.

This module provides analytics calculation functions for both aviation projects
and Label Studio core projects. These functions compute metrics for task/event
completion status and item counts.

Phase 1: Backend Data Layer - Analytics Query Functions

Usage:
    from aviation.analytics import get_aviation_project_analytics, get_core_project_analytics

    # Get aviation project analytics using AviationProject.id
    analytics = get_aviation_project_analytics(aviation_project_id=1)

    # Get core project analytics using Project.id
    analytics = get_core_project_analytics(project_id=42)
"""
import logging
from typing import Any, Dict, Optional, TypedDict

from django.db.models import Case, Count, Exists, IntegerField, OuterRef, Q, When

from aviation.models import AviationProject, AviationEvent, LabelingItem
from projects.models import Project
from tasks.models import Task, Annotation

logger = logging.getLogger(__name__)


class LabelingItemsByStatus(TypedDict):
    """Type definition for labeling items by status breakdown."""

    draft: int
    submitted: int
    reviewed: int
    approved: int


class LabelingItemsAnalytics(TypedDict):
    """Type definition for labeling items analytics."""

    total: int
    by_status: LabelingItemsByStatus


class EventsByStatus(TypedDict):
    """Type definition for events by status breakdown."""

    in_progress: int
    completed: int


class AviationAnalytics(TypedDict):
    """Type definition for aviation project analytics response."""

    project_id: int
    project_type: str
    total_events: int
    events_by_status: EventsByStatus
    labeling_items: LabelingItemsAnalytics


class CoreAnalytics(TypedDict):
    """Type definition for core project analytics response."""

    project_id: int
    project_type: str
    task_number: int
    finished_task_number: int
    in_progress_tasks: int


def get_aviation_project_analytics(
    aviation_project_id: int,
) -> Optional[AviationAnalytics]:
    """
    Calculate analytics for an aviation project.

    Computes event completion status based on labeling item statuses:
    - Event is "completed" when ALL its labeling items are 'approved'
    - Event is "in_progress" when it has ANY non-approved labeling item
    - Events without labeling items are counted but not classified as
      in_progress or completed

    Args:
        aviation_project_id: The AviationProject.id (not Project.id).
            Important: This is the aviation wrapper ID, not the Label Studio
            Project.id. See aviation/CLAUDE.md for ID conventions.

    Returns:
        AviationAnalytics dictionary containing:
            - project_id: Aviation project ID
            - project_type: "aviation"
            - total_events: Total event count
            - events_by_status: {in_progress: int, completed: int}
            - labeling_items: {total: int, by_status: {draft: int, ...}}

        Returns None if project not found.

    Example:
        >>> analytics = get_aviation_project_analytics(1)
        >>> analytics['events_by_status']['completed']
        42

    Note:
        Event completion logic:
        - An event with 0 labeling items is NOT counted as completed or in_progress
        - An event is "completed" only when ALL its labeling items have status='approved'
        - An event is "in_progress" when it has items but not all are approved
    """
    try:
        aviation_project = AviationProject.objects.get(pk=aviation_project_id)
    except AviationProject.DoesNotExist:
        logger.debug(f'Aviation project not found: {aviation_project_id}')
        return None

    # Get all events for this project with prefetched labeling items
    events = AviationEvent.objects.filter(
        task__project=aviation_project.project
    ).prefetch_related('labeling_items')

    total_events = events.count()

    # Calculate event status
    # Event is "completed" if ALL its labeling items are approved
    # Event is "in_progress" if it has ANY non-approved labeling item
    # Events without labeling items are neither in_progress nor completed
    completed_events = 0
    in_progress_events = 0

    for event in events:
        items = list(event.labeling_items.all())
        if not items:
            # No labeling items = not started, don't count
            continue

        all_approved = all(item.status == 'approved' for item in items)
        if all_approved:
            completed_events += 1
        else:
            in_progress_events += 1

    # Get labeling item status breakdown using aggregation (single query)
    status_counts = LabelingItem.objects.filter(
        event__task__project=aviation_project.project
    ).aggregate(
        total=Count('id'),
        draft=Count('id', filter=Q(status='draft')),
        submitted=Count('id', filter=Q(status='submitted')),
        reviewed=Count('id', filter=Q(status='reviewed')),
        approved=Count('id', filter=Q(status='approved')),
    )

    return {
        'project_id': aviation_project.id,
        'project_type': 'aviation',
        'total_events': total_events,
        'events_by_status': {
            'in_progress': in_progress_events,
            'completed': completed_events,
        },
        'labeling_items': {
            'total': status_counts['total'],
            'by_status': {
                'draft': status_counts['draft'],
                'submitted': status_counts['submitted'],
                'reviewed': status_counts['reviewed'],
                'approved': status_counts['approved'],
            },
        },
    }


def get_core_project_analytics(project_id: int) -> Optional[CoreAnalytics]:
    """
    Calculate analytics for a Label Studio core project.

    Computes task completion metrics:
    - task_number: Total number of tasks
    - finished_task_number: Tasks with is_labeled=True
    - in_progress_tasks: Tasks with annotations but is_labeled=False

    Args:
        project_id: The Project.id (Label Studio core project ID)

    Returns:
        CoreAnalytics dictionary containing:
            - project_id: Project ID
            - project_type: "core"
            - task_number: Total task count
            - finished_task_number: Labeled task count
            - in_progress_tasks: Tasks with annotations but not labeled

        Returns None if project not found.

    Example:
        >>> analytics = get_core_project_analytics(1)
        >>> analytics['finished_task_number']
        100

    Note:
        Task states:
        - "finished" = is_labeled=True (task has sufficient annotations)
        - "in_progress" = has annotations but is_labeled=False
        - "not started" = no annotations and is_labeled=False (implicitly calculated)
    """
    try:
        project = Project.objects.get(pk=project_id)
    except Project.DoesNotExist:
        logger.debug(f'Project not found: {project_id}')
        return None

    tasks = Task.objects.filter(project=project)

    task_number = tasks.count()
    finished_task_number = tasks.filter(is_labeled=True).count()

    # Tasks "in progress" = have annotations but not labeled
    # Using Exists subquery for efficient check of annotation existence
    has_annotation = Exists(
        Annotation.objects.filter(task=OuterRef('pk'))
    )
    in_progress_tasks = tasks.filter(
        has_annotation,
        is_labeled=False,
    ).count()

    return {
        'project_id': project.id,
        'project_type': 'core',
        'task_number': task_number,
        'finished_task_number': finished_task_number,
        'in_progress_tasks': in_progress_tasks,
    }
