"""
Integration test suite for AviationProject assignment feature.

Tests the complete workflow from database to API to ensure all components
work together correctly. This file validates end-to-end scenarios.

TDD Phase 8: Integration Testing & Final Validation
"""
import pytest
import time
from unittest.mock import patch, MagicMock
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from organizations.models import OrganizationMember
from organizations.tests.factories import OrganizationFactory
from projects.tests.factories import ProjectFactory

from aviation.models import AviationProject
from aviation.tests.factories import AviationProjectFactory

User = get_user_model()


# =============================================================================
# Auto-mock Redis for all tests (to avoid connection errors)
# =============================================================================

@pytest.fixture(autouse=True)
def mock_redis_publish(mocker):
    """Automatically mock Redis publish for all integration tests."""
    mocker.patch('notifications.services.RedisClient.publish')


# =============================================================================
# Fixtures
# =============================================================================

@pytest.fixture
def organization(db):
    """Create a test organization."""
    return OrganizationFactory()


@pytest.fixture
def manager(db, organization):
    """User with Manager role."""
    user = User.objects.create_user(
        email='manager@integration.test',
        password='testpass123'
    )
    user.active_organization = organization
    user.save()
    OrganizationMember.objects.get_or_create(user=user, organization=organization)

    # Add to Manager group
    manager_group, _ = Group.objects.get_or_create(name='Manager')
    user.groups.add(manager_group)
    return user


@pytest.fixture
def annotator1(db, organization):
    """First annotator user."""
    user = User.objects.create_user(
        email='annotator1@integration.test',
        password='testpass123'
    )
    user.active_organization = organization
    user.save()
    OrganizationMember.objects.get_or_create(user=user, organization=organization)

    annotator_group, _ = Group.objects.get_or_create(name='Annotator')
    user.groups.add(annotator_group)
    return user


@pytest.fixture
def annotator2(db, organization):
    """Second annotator user."""
    user = User.objects.create_user(
        email='annotator2@integration.test',
        password='testpass123'
    )
    user.active_organization = organization
    user.save()
    OrganizationMember.objects.get_or_create(user=user, organization=organization)

    annotator_group, _ = Group.objects.get_or_create(name='Annotator')
    user.groups.add(annotator_group)
    return user


@pytest.fixture
def aviation_project(db, organization, manager):
    """Create aviation project with manager permissions."""
    project = ProjectFactory(
        organization=organization,
        created_by=manager
    )
    aviation_project = AviationProjectFactory(project=project)

    # Grant assign permission to manager
    from guardian.shortcuts import assign_perm
    assign_perm('aviation.assign_aviation_project', manager, aviation_project)

    return aviation_project


@pytest.fixture
def api_client():
    return APIClient()


# =============================================================================
# End-to-End Assignment Workflow Tests
# =============================================================================

@pytest.mark.django_db
class TestEndToEndAssignmentWorkflow:
    """
    Test complete workflow:
    1. Manager fetches assignment list
    2. Manager assigns annotator to project
    3. Annotator can now see project in list
    4. Manager revokes assignment
    5. Annotator can no longer see project
    """

    def test_complete_assignment_lifecycle(
        self, api_client, aviation_project, manager, annotator1, annotator2, organization
    ):
        """Test full lifecycle of assignment from creation to revocation."""

        # Step 1: Manager fetches assignments
        api_client.force_authenticate(user=manager)
        assignment_url = reverse('aviation:aviation-project-assignment', kwargs={'pk': aviation_project.id})

        response = api_client.get(assignment_url)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        # Should see all org users
        user_emails = [u['user_email'] for u in data]
        assert annotator1.email in user_emails
        assert annotator2.email in user_emails

        # None assigned initially
        for user_data in data:
            if user_data['user_id'] in [annotator1.id, annotator2.id]:
                assert user_data['has_permission'] is False

        # Step 2: Manager assigns annotator1
        assign_payload = {
            'users': [
                {'user_id': annotator1.id, 'has_permission': True}
            ]
        }

        response = api_client.post(assignment_url, assign_payload, format='json')
        assert response.status_code == status.HTTP_200_OK

        # Verify assignment in database
        assert aviation_project.has_assignee(annotator1)
        assert not aviation_project.has_assignee(annotator2)

        # Step 3: Annotator1 can see project
        api_client.force_authenticate(user=annotator1)
        project_list_url = reverse('aviation:aviation-project-list')

        response = api_client.get(project_list_url)
        assert response.status_code == status.HTTP_200_OK
        projects = response.json()
        project_ids = [p['id'] for p in projects]

        assert aviation_project.id in project_ids

        # Step 4: Annotator2 cannot see project
        api_client.force_authenticate(user=annotator2)
        response = api_client.get(project_list_url)
        assert response.status_code == status.HTTP_200_OK
        projects = response.json()
        project_ids = [p['id'] for p in projects]

        assert aviation_project.id not in project_ids

        # Step 5: Manager revokes annotator1's assignment
        api_client.force_authenticate(user=manager)
        revoke_payload = {
            'users': [
                {'user_id': annotator1.id, 'has_permission': False}
            ]
        }

        response = api_client.post(assignment_url, revoke_payload, format='json')
        assert response.status_code == status.HTTP_200_OK

        # Verify revocation
        assert not aviation_project.has_assignee(annotator1)

        # Step 6: Annotator1 can no longer see project
        api_client.force_authenticate(user=annotator1)
        response = api_client.get(project_list_url)
        assert response.status_code == status.HTTP_200_OK
        projects = response.json()
        project_ids = [p['id'] for p in projects]

        assert aviation_project.id not in project_ids

    def test_bulk_assignment(
        self, api_client, aviation_project, manager, annotator1, annotator2
    ):
        """Test assigning multiple users at once."""
        api_client.force_authenticate(user=manager)
        assignment_url = reverse('aviation:aviation-project-assignment', kwargs={'pk': aviation_project.id})

        # Assign both annotators in one request
        payload = {
            'users': [
                {'user_id': annotator1.id, 'has_permission': True},
                {'user_id': annotator2.id, 'has_permission': True},
            ]
        }

        response = api_client.post(assignment_url, payload, format='json')
        assert response.status_code == status.HTTP_200_OK

        # Both should be assigned
        assert aviation_project.has_assignee(annotator1)
        assert aviation_project.has_assignee(annotator2)

        # Both should see project
        project_list_url = reverse('aviation:aviation-project-list')

        api_client.force_authenticate(user=annotator1)
        response = api_client.get(project_list_url)
        project_ids = [p['id'] for p in response.json()]
        assert aviation_project.id in project_ids

        api_client.force_authenticate(user=annotator2)
        response = api_client.get(project_list_url)
        project_ids = [p['id'] for p in response.json()]
        assert aviation_project.id in project_ids

    def test_permission_enforcement(
        self, api_client, aviation_project, annotator1, annotator2
    ):
        """Test that annotators cannot modify assignments."""
        api_client.force_authenticate(user=annotator1)
        assignment_url = reverse('aviation:aviation-project-assignment', kwargs={'pk': aviation_project.id})

        # Attempt to assign annotator2
        payload = {
            'users': [{'user_id': annotator2.id, 'has_permission': True}]
        }

        response = api_client.post(assignment_url, payload, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN

        # Annotator2 should not be assigned
        assert not aviation_project.has_assignee(annotator2)


# =============================================================================
# Multi-Project Scenarios
# =============================================================================

@pytest.mark.django_db
class TestMultiProjectScenarios:
    """Test scenarios with multiple projects."""

    def test_annotator_sees_only_assigned_projects_across_multiple(
        self, api_client, organization, manager, annotator1
    ):
        """Test filtering works correctly with multiple projects."""

        # Create 5 projects
        project1 = AviationProjectFactory(
            project=ProjectFactory(organization=organization)
        )
        project2 = AviationProjectFactory(
            project=ProjectFactory(organization=organization)
        )
        project3 = AviationProjectFactory(
            project=ProjectFactory(organization=organization)
        )
        project4 = AviationProjectFactory(
            project=ProjectFactory(organization=organization)
        )
        project5 = AviationProjectFactory(
            project=ProjectFactory(organization=organization)
        )

        # Assign annotator to projects 1, 3, and 5
        project1.add_assignee(annotator1)
        project3.add_assignee(annotator1)
        project5.add_assignee(annotator1)

        # Annotator should see only 3 projects
        api_client.force_authenticate(user=annotator1)
        project_list_url = reverse('aviation:aviation-project-list')

        response = api_client.get(project_list_url)
        assert response.status_code == status.HTTP_200_OK
        projects = response.json()

        assert len(projects) == 3
        project_ids = [p['id'] for p in projects]
        assert project1.id in project_ids
        assert project3.id in project_ids
        assert project5.id in project_ids
        assert project2.id not in project_ids
        assert project4.id not in project_ids

    def test_manager_sees_all_projects(
        self, api_client, organization, manager
    ):
        """Test managers see all organization projects regardless of assignment."""

        # Create 5 projects
        projects = [
            AviationProjectFactory(
                project=ProjectFactory(organization=organization)
            )
            for _ in range(5)
        ]

        # Don't assign manager to any projects
        # (Manager role should see all)

        api_client.force_authenticate(user=manager)
        project_list_url = reverse('aviation:aviation-project-list')

        response = api_client.get(project_list_url)
        assert response.status_code == status.HTTP_200_OK
        projects_json = response.json()

        # Manager should see all 5 projects
        assert len(projects_json) >= 5
        project_ids = [p['id'] for p in projects_json]
        for project in projects:
            assert project.id in project_ids


# =============================================================================
# Performance Benchmarks
# =============================================================================

@pytest.mark.django_db
class TestPerformance:
    """Performance benchmarks for assignment operations."""

    def test_assignment_list_performance_with_many_users(
        self, api_client, aviation_project, manager, organization
    ):
        """Test performance with 100 users in organization."""

        # Create 100 users
        users = []
        for i in range(100):
            user = User.objects.create_user(
                email=f'user{i}@perf.test',
                password='testpass123'
            )
            user.active_organization = organization
            user.save()
            OrganizationMember.objects.get_or_create(user=user, organization=organization)
            users.append(user)

        api_client.force_authenticate(user=manager)
        assignment_url = reverse('aviation:aviation-project-assignment', kwargs={'pk': aviation_project.id})

        # Measure GET performance
        start_time = time.time()
        response = api_client.get(assignment_url)
        end_time = time.time()

        assert response.status_code == status.HTTP_200_OK
        assert len(response.json()) >= 100

        # Should complete in under 2 seconds
        elapsed = end_time - start_time
        assert elapsed < 2.0, f"GET request took {elapsed:.2f}s (expected < 2s)"

    def test_bulk_assignment_performance(
        self, api_client, aviation_project, manager, organization
    ):
        """Test performance of bulk assignment operation."""

        # Create 50 users
        users = []
        for i in range(50):
            user = User.objects.create_user(
                email=f'bulk{i}@perf.test',
                password='testpass123'
            )
            user.active_organization = organization
            user.save()
            OrganizationMember.objects.get_or_create(user=user, organization=organization)
            users.append(user)

        api_client.force_authenticate(user=manager)
        assignment_url = reverse('aviation:aviation-project-assignment', kwargs={'pk': aviation_project.id})

        # Bulk assign all users
        payload = {
            'users': [{'user_id': u.id, 'has_permission': True} for u in users]
        }

        start_time = time.time()
        response = api_client.post(assignment_url, payload, format='json')
        end_time = time.time()

        assert response.status_code == status.HTTP_200_OK

        # Should complete in under 5 seconds
        elapsed = end_time - start_time
        assert elapsed < 5.0, f"Bulk assignment took {elapsed:.2f}s (expected < 5s)"

        # Verify all assigned
        for user in users:
            assert aviation_project.has_assignee(user)

    def test_project_list_query_performance_for_annotator(
        self, api_client, organization, annotator1
    ):
        """Test project list query performance for annotator with many projects."""

        # Create 50 projects, assign annotator to 25 of them
        for i in range(50):
            project = AviationProjectFactory(
                project=ProjectFactory(organization=organization)
            )
            # Assign to every other project
            if i % 2 == 0:
                project.add_assignee(annotator1)

        api_client.force_authenticate(user=annotator1)
        project_list_url = reverse('aviation:aviation-project-list')

        # Measure query performance
        start_time = time.time()
        response = api_client.get(project_list_url)
        end_time = time.time()

        assert response.status_code == status.HTTP_200_OK
        projects = response.json()
        assert len(projects) == 25

        # Should complete in under 1 second
        elapsed = end_time - start_time
        assert elapsed < 1.0, f"Project list query took {elapsed:.2f}s (expected < 1s)"


# =============================================================================
# Edge Cases
# =============================================================================

@pytest.mark.django_db
class TestEdgeCases:
    """Test edge cases and boundary conditions."""

    def test_empty_organization_no_crash(
        self, api_client, aviation_project, manager
    ):
        """Test assignment endpoint handles organization with only one user."""
        # Manager is the only user
        api_client.force_authenticate(user=manager)
        assignment_url = reverse('aviation:aviation-project-assignment', kwargs={'pk': aviation_project.id})

        response = api_client.get(assignment_url)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) >= 1  # At least the manager

    def test_assign_same_user_twice_idempotent(
        self, api_client, aviation_project, manager, annotator1
    ):
        """Test assigning same user twice is idempotent."""
        api_client.force_authenticate(user=manager)
        assignment_url = reverse('aviation:aviation-project-assignment', kwargs={'pk': aviation_project.id})

        payload = {
            'users': [{'user_id': annotator1.id, 'has_permission': True}]
        }

        # Assign first time
        response1 = api_client.post(assignment_url, payload, format='json')
        assert response1.status_code == status.HTTP_200_OK

        # Assign second time
        response2 = api_client.post(assignment_url, payload, format='json')
        assert response2.status_code == status.HTTP_200_OK

        # Should still be assigned
        assert aviation_project.has_assignee(annotator1)

    def test_revoke_unassigned_user_idempotent(
        self, api_client, aviation_project, manager, annotator1
    ):
        """Test revoking assignment from unassigned user is safe."""
        api_client.force_authenticate(user=manager)
        assignment_url = reverse('aviation:aviation-project-assignment', kwargs={'pk': aviation_project.id})

        # Ensure not assigned
        assert not aviation_project.has_assignee(annotator1)

        # Try to revoke
        payload = {
            'users': [{'user_id': annotator1.id, 'has_permission': False}]
        }

        response = api_client.post(assignment_url, payload, format='json')
        assert response.status_code == status.HTTP_200_OK

        # Should still not be assigned
        assert not aviation_project.has_assignee(annotator1)

    def test_mixed_operations_in_single_request(
        self, api_client, aviation_project, manager, annotator1, annotator2
    ):
        """Test assigning one user and revoking another in same request."""
        # First assign annotator1
        aviation_project.add_assignee(annotator1)

        api_client.force_authenticate(user=manager)
        assignment_url = reverse('aviation:aviation-project-assignment', kwargs={'pk': aviation_project.id})

        # Revoke annotator1, assign annotator2
        payload = {
            'users': [
                {'user_id': annotator1.id, 'has_permission': False},
                {'user_id': annotator2.id, 'has_permission': True},
            ]
        }

        response = api_client.post(assignment_url, payload, format='json')
        assert response.status_code == status.HTTP_200_OK

        # Verify changes
        assert not aviation_project.has_assignee(annotator1)
        assert aviation_project.has_assignee(annotator2)
