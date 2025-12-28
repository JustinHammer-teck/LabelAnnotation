"""
Test suite for AviationProjectViewSet filtering by user role.

This module tests that AviationProjectViewSet.get_queryset() correctly filters
projects based on user roles:
- Managers/Researchers/Admins: see ALL organization projects
- Annotators (only): see ONLY assigned projects via Guardian's get_objects_for_user()

TDD Phase: RED - Tests written before implementation.
"""
import pytest
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from organizations.models import OrganizationMember
from organizations.tests.factories import OrganizationFactory
from projects.tests.factories import ProjectFactory

from aviation.tests.factories import AviationProjectFactory

User = get_user_model()


# =============================================================================
# Fixtures
# =============================================================================

@pytest.fixture
def organization(db):
    """Create a test organization."""
    return OrganizationFactory()


@pytest.fixture
def manager_group(db):
    """Get or create Manager group."""
    return Group.objects.get_or_create(name='Manager')[0]


@pytest.fixture
def annotator_group(db):
    """Get or create Annotator group."""
    return Group.objects.get_or_create(name='Annotator')[0]


@pytest.fixture
def researcher_group(db):
    """Get or create Researcher group."""
    return Group.objects.get_or_create(name='Researcher')[0]


@pytest.fixture
def admin_user(db, organization):
    """Admin user (superuser)."""
    user = User.objects.create_user(
        email='admin@test.com',
        password='testpass123',
        is_superuser=True
    )
    user.active_organization = organization
    user.save()
    OrganizationMember.objects.get_or_create(user=user, organization=organization)
    return user


@pytest.fixture
def manager_user(db, organization, manager_group):
    """Manager user."""
    user = User.objects.create_user(
        email='manager@test.com',
        password='testpass123'
    )
    user.active_organization = organization
    user.save()
    OrganizationMember.objects.get_or_create(user=user, organization=organization)
    user.groups.add(manager_group)
    return user


@pytest.fixture
def researcher_user(db, organization, researcher_group):
    """Researcher user."""
    user = User.objects.create_user(
        email='researcher@test.com',
        password='testpass123'
    )
    user.active_organization = organization
    user.save()
    OrganizationMember.objects.get_or_create(user=user, organization=organization)
    user.groups.add(researcher_group)
    return user


@pytest.fixture
def annotator_user(db, organization, annotator_group):
    """Pure annotator user (no manager/researcher role)."""
    user = User.objects.create_user(
        email='annotator@test.com',
        password='testpass123'
    )
    user.active_organization = organization
    user.save()
    OrganizationMember.objects.get_or_create(user=user, organization=organization)
    user.groups.add(annotator_group)
    return user


@pytest.fixture
def dual_role_user(db, organization, annotator_group, manager_group):
    """User with both Annotator and Manager roles."""
    user = User.objects.create_user(
        email='dual@test.com',
        password='testpass123'
    )
    user.active_organization = organization
    user.save()
    OrganizationMember.objects.get_or_create(user=user, organization=organization)
    user.groups.add(annotator_group)
    user.groups.add(manager_group)
    return user


@pytest.fixture
def api_client():
    """Create API client."""
    return APIClient()


# =============================================================================
# Project List Filtering Tests
# =============================================================================

@pytest.mark.django_db
class TestAviationProjectListFiltering:
    """Test role-based filtering in AviationProjectViewSet.get_queryset()."""

    def test_manager_sees_all_org_projects(
        self, api_client, organization, manager_user
    ):
        """Test managers see all projects in their organization."""
        # Create 3 projects in the organization
        project1 = ProjectFactory(organization=organization)
        project2 = ProjectFactory(organization=organization)
        project3 = ProjectFactory(organization=organization)
        av_project1 = AviationProjectFactory(project=project1)
        av_project2 = AviationProjectFactory(project=project2)
        av_project3 = AviationProjectFactory(project=project3)

        api_client.force_authenticate(user=manager_user)
        url = reverse('aviation:aviation-project-list')

        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        project_ids = [p['id'] for p in data]

        assert av_project1.id in project_ids
        assert av_project2.id in project_ids
        assert av_project3.id in project_ids

    def test_researcher_sees_all_org_projects(
        self, api_client, organization, researcher_user
    ):
        """Test researchers see all projects in their organization."""
        project1 = ProjectFactory(organization=organization)
        project2 = ProjectFactory(organization=organization)
        av_project1 = AviationProjectFactory(project=project1)
        av_project2 = AviationProjectFactory(project=project2)

        api_client.force_authenticate(user=researcher_user)
        url = reverse('aviation:aviation-project-list')

        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        project_ids = [p['id'] for p in data]

        assert av_project1.id in project_ids
        assert av_project2.id in project_ids

    def test_admin_sees_all_org_projects(
        self, api_client, organization, admin_user
    ):
        """Test admins (superusers) see all projects in their organization."""
        project1 = ProjectFactory(organization=organization)
        project2 = ProjectFactory(organization=organization)
        av_project1 = AviationProjectFactory(project=project1)
        av_project2 = AviationProjectFactory(project=project2)

        api_client.force_authenticate(user=admin_user)
        url = reverse('aviation:aviation-project-list')

        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        project_ids = [p['id'] for p in data]

        assert av_project1.id in project_ids
        assert av_project2.id in project_ids

    def test_annotator_sees_only_assigned_projects(
        self, api_client, organization, annotator_user
    ):
        """Test annotators see only projects they're assigned to."""
        # Create 3 projects, assign only 2
        project1 = ProjectFactory(organization=organization)
        project2 = ProjectFactory(organization=organization)
        project3 = ProjectFactory(organization=organization)
        assigned_project1 = AviationProjectFactory(project=project1)
        assigned_project2 = AviationProjectFactory(project=project2)
        unassigned_project = AviationProjectFactory(project=project3)

        # Assign user to only 2 projects
        assigned_project1.add_assignee(annotator_user)
        assigned_project2.add_assignee(annotator_user)

        api_client.force_authenticate(user=annotator_user)
        url = reverse('aviation:aviation-project-list')

        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        project_ids = [p['id'] for p in data]

        assert assigned_project1.id in project_ids
        assert assigned_project2.id in project_ids
        assert unassigned_project.id not in project_ids
        assert len(project_ids) == 2

    def test_annotator_sees_no_projects_when_none_assigned(
        self, api_client, organization, annotator_user
    ):
        """Test annotator sees empty list when not assigned to any projects."""
        # Create projects but don't assign
        project1 = ProjectFactory(organization=organization)
        project2 = ProjectFactory(organization=organization)
        AviationProjectFactory(project=project1)
        AviationProjectFactory(project=project2)

        api_client.force_authenticate(user=annotator_user)
        url = reverse('aviation:aviation-project-list')

        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 0

    def test_dual_role_user_sees_all_projects(
        self, api_client, organization, dual_role_user
    ):
        """Test user with both Annotator and Manager roles sees all projects."""
        project1 = ProjectFactory(organization=organization)
        project2 = ProjectFactory(organization=organization)
        av_project1 = AviationProjectFactory(project=project1)
        av_project2 = AviationProjectFactory(project=project2)

        # Don't assign - dual role should still see all
        api_client.force_authenticate(user=dual_role_user)
        url = reverse('aviation:aviation-project-list')

        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        project_ids = [p['id'] for p in data]

        assert av_project1.id in project_ids
        assert av_project2.id in project_ids

    def test_filtering_respects_organization_boundaries(
        self, api_client, organization, annotator_user
    ):
        """Test annotators don't see assigned projects from other orgs."""
        other_org = OrganizationFactory()

        # Assigned project in own org
        own_org_project = ProjectFactory(organization=organization)
        own_org_av_project = AviationProjectFactory(project=own_org_project)
        own_org_av_project.add_assignee(annotator_user)

        # Assigned project in other org (shouldn't see this)
        other_org_project = ProjectFactory(organization=other_org)
        other_org_av_project = AviationProjectFactory(project=other_org_project)
        other_org_av_project.add_assignee(annotator_user)

        api_client.force_authenticate(user=annotator_user)
        url = reverse('aviation:aviation-project-list')

        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        project_ids = [p['id'] for p in data]

        assert own_org_av_project.id in project_ids
        assert other_org_av_project.id not in project_ids

    def test_user_with_no_groups_sees_no_projects(
        self, api_client, organization
    ):
        """Test user with no groups sees no projects (treated as annotator-only)."""
        user = User.objects.create_user(
            email='nogroup@test.com',
            password='testpass123'
        )
        user.active_organization = organization
        user.save()
        OrganizationMember.objects.get_or_create(user=user, organization=organization)

        project = ProjectFactory(organization=organization)
        AviationProjectFactory(project=project)

        api_client.force_authenticate(user=user)
        url = reverse('aviation:aviation-project-list')

        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        # User with no groups should see no projects (not an elevated role)
        assert len(data) == 0


# =============================================================================
# Helper Method Tests
# =============================================================================

@pytest.mark.django_db
class TestIsAnnotatorOnlyHelper:
    """Test the helper method that determines if user is annotator-only."""

    def test_pure_annotator_is_detected(self, annotator_user):
        """Test user with only Annotator role is detected."""
        from aviation.api import AviationProjectViewSet

        viewset = AviationProjectViewSet()
        is_annotator = viewset._is_annotator_only(annotator_user)

        assert is_annotator is True

    def test_manager_is_not_annotator_only(self, manager_user):
        """Test manager is not considered annotator-only."""
        from aviation.api import AviationProjectViewSet

        viewset = AviationProjectViewSet()
        is_annotator = viewset._is_annotator_only(manager_user)

        assert is_annotator is False

    def test_dual_role_is_not_annotator_only(self, dual_role_user):
        """Test user with Annotator + Manager is not annotator-only."""
        from aviation.api import AviationProjectViewSet

        viewset = AviationProjectViewSet()
        is_annotator = viewset._is_annotator_only(dual_role_user)

        assert is_annotator is False

    def test_researcher_is_not_annotator_only(self, researcher_user):
        """Test researcher is not annotator-only."""
        from aviation.api import AviationProjectViewSet

        viewset = AviationProjectViewSet()
        is_annotator = viewset._is_annotator_only(researcher_user)

        assert is_annotator is False

    def test_superuser_is_not_annotator_only(self, admin_user):
        """Test superuser is not annotator-only."""
        from aviation.api import AviationProjectViewSet

        viewset = AviationProjectViewSet()
        is_annotator = viewset._is_annotator_only(admin_user)

        assert is_annotator is False

    def test_user_with_no_groups_is_treated_as_restricted(self, organization):
        """Test user with no groups is treated as needing assignment filter."""
        from aviation.api import AviationProjectViewSet

        user = User.objects.create_user(
            email='nogroup@test.com',
            password='testpass123'
        )
        user.active_organization = organization
        user.save()

        viewset = AviationProjectViewSet()
        # User with no groups should be restricted (not having elevated roles)
        is_annotator = viewset._is_annotator_only(user)

        # Could be True (needs assignment) or False depending on logic choice
        # For safety, no groups = no elevated role = needs filtering
        assert is_annotator is True

    def test_annotator_with_researcher_role_is_not_annotator_only(
        self, organization, annotator_group, researcher_group
    ):
        """Test user with Annotator + Researcher is not annotator-only."""
        from aviation.api import AviationProjectViewSet

        user = User.objects.create_user(
            email='ann_researcher@test.com',
            password='testpass123'
        )
        user.active_organization = organization
        user.save()
        user.groups.add(annotator_group)
        user.groups.add(researcher_group)

        viewset = AviationProjectViewSet()
        is_annotator = viewset._is_annotator_only(user)

        assert is_annotator is False


# =============================================================================
# Edge Cases
# =============================================================================

@pytest.mark.django_db
class TestFilteringEdgeCases:
    """Test edge cases in project filtering."""

    def test_annotator_can_still_retrieve_assigned_project_detail(
        self, api_client, organization, annotator_user
    ):
        """Test annotator can retrieve detail view of assigned project."""
        project = ProjectFactory(organization=organization)
        av_project = AviationProjectFactory(project=project)
        av_project.add_assignee(annotator_user)

        api_client.force_authenticate(user=annotator_user)
        url = reverse('aviation:aviation-project-detail', kwargs={'pk': av_project.id})

        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.json()['id'] == av_project.id

    def test_annotator_cannot_retrieve_unassigned_project_detail(
        self, api_client, organization, annotator_user
    ):
        """Test annotator cannot retrieve detail view of unassigned project."""
        project = ProjectFactory(organization=organization)
        av_project = AviationProjectFactory(project=project)
        # Not assigned

        api_client.force_authenticate(user=annotator_user)
        url = reverse('aviation:aviation-project-detail', kwargs={'pk': av_project.id})

        response = api_client.get(url)

        # Should return 404 since project is not in filtered queryset
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_manager_can_retrieve_any_org_project_detail(
        self, api_client, organization, manager_user
    ):
        """Test manager can retrieve detail view of any org project."""
        project = ProjectFactory(organization=organization)
        av_project = AviationProjectFactory(project=project)
        # Not assigned to manager, but manager should still see it

        api_client.force_authenticate(user=manager_user)
        url = reverse('aviation:aviation-project-detail', kwargs={'pk': av_project.id})

        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.json()['id'] == av_project.id
