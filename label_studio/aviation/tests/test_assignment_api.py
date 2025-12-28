"""
Test suite for AviationProjectAssignmentAPI endpoint.

This module tests the API endpoint for managing user assignments to
AviationProject instances. Follows Label Studio's ProjectAssignmentAPI pattern.

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

from aviation.models import AviationProject
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
def manager_user(db, organization):
    """User with Manager role."""
    user = User.objects.create_user(
        email='manager@test.com',
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
def annotator_user(db, organization):
    """User with Annotator role."""
    user = User.objects.create_user(
        email='annotator@test.com',
        password='testpass123'
    )
    user.active_organization = organization
    user.save()
    OrganizationMember.objects.get_or_create(user=user, organization=organization)

    # Add to Annotator group
    annotator_group, _ = Group.objects.get_or_create(name='Annotator')
    user.groups.add(annotator_group)
    return user


@pytest.fixture
def researcher_user(db, organization):
    """User with Researcher role."""
    user = User.objects.create_user(
        email='researcher@test.com',
        password='testpass123'
    )
    user.active_organization = organization
    user.save()
    OrganizationMember.objects.get_or_create(user=user, organization=organization)

    # Add to Researcher group
    researcher_group, _ = Group.objects.get_or_create(name='Researcher')
    user.groups.add(researcher_group)
    return user


@pytest.fixture
def aviation_project(db, organization, manager_user):
    """Create aviation project."""
    project = ProjectFactory(
        organization=organization,
        created_by=manager_user
    )
    aviation_project = AviationProjectFactory(project=project)

    # Grant assign permission to manager
    from guardian.shortcuts import assign_perm
    assign_perm('aviation.assign_aviation_project', manager_user, aviation_project)

    return aviation_project


@pytest.fixture
def api_client():
    return APIClient()


# =============================================================================
# GET Tests - List users with assignment status
# =============================================================================

@pytest.mark.django_db
class TestAviationProjectAssignmentGET:
    """Test GET method of AviationProjectAssignmentAPI."""

    def test_get_returns_all_org_users_with_permission_status(
        self, api_client, aviation_project, manager_user, annotator_user
    ):
        """Test GET returns all organization users with their assignment status."""
        api_client.force_authenticate(user=manager_user)
        url = reverse('aviation:aviation-project-assignment', kwargs={'pk': aviation_project.id})

        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) >= 2  # At least manager and annotator

        # Check structure
        user_emails = [u['user_email'] for u in data]
        assert manager_user.email in user_emails
        assert annotator_user.email in user_emails

        # Check fields
        for user_data in data:
            assert 'user_id' in user_data
            assert 'user_email' in user_data
            assert 'has_permission' in user_data
            assert isinstance(user_data['has_permission'], bool)

    def test_get_shows_correct_assignment_status(
        self, api_client, aviation_project, manager_user, annotator_user
    ):
        """Test GET correctly reflects assignment status."""
        # Assign annotator
        aviation_project.add_assignee(annotator_user)

        api_client.force_authenticate(user=manager_user)
        url = reverse('aviation:aviation-project-assignment', kwargs={'pk': aviation_project.id})

        response = api_client.get(url)
        data = response.json()

        annotator_data = next(u for u in data if u['user_id'] == annotator_user.id)
        assert annotator_data['has_permission'] is True

        manager_data = next(u for u in data if u['user_id'] == manager_user.id)
        assert manager_data['has_permission'] is False  # Not assigned yet

    def test_get_requires_authentication(self, api_client, aviation_project):
        """Test GET requires user to be authenticated."""
        url = reverse('aviation:aviation-project-assignment', kwargs={'pk': aviation_project.id})
        response = api_client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_get_returns_404_for_nonexistent_project(self, api_client, manager_user):
        """Test GET returns 404 for non-existent project."""
        api_client.force_authenticate(user=manager_user)
        url = reverse('aviation:aviation-project-assignment', kwargs={'pk': 99999})
        response = api_client.get(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_get_allowed_for_manager(
        self, api_client, aviation_project, manager_user
    ):
        """Test GET is allowed for managers."""
        api_client.force_authenticate(user=manager_user)
        url = reverse('aviation:aviation-project-assignment', kwargs={'pk': aviation_project.id})

        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK

    def test_get_allowed_for_researcher(
        self, api_client, aviation_project, researcher_user
    ):
        """Test GET is allowed for researchers."""
        # Grant assign permission to researcher for this test
        from guardian.shortcuts import assign_perm
        assign_perm('aviation.assign_aviation_project', researcher_user, aviation_project)

        api_client.force_authenticate(user=researcher_user)
        url = reverse('aviation:aviation-project-assignment', kwargs={'pk': aviation_project.id})

        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK


# =============================================================================
# POST Tests - Assign/Revoke users
# =============================================================================

@pytest.mark.django_db
class TestAviationProjectAssignmentPOST:
    """Test POST method of AviationProjectAssignmentAPI."""

    @pytest.fixture(autouse=True)
    def mock_redis(self, mocker):
        """Mock Redis for POST tests that trigger notifications."""
        mocker.patch('notifications.services.RedisClient.publish')

    def test_post_assigns_user_successfully(
        self, api_client, aviation_project, manager_user, annotator_user
    ):
        """Test POST assigns user and grants permission."""
        api_client.force_authenticate(user=manager_user)
        url = reverse('aviation:aviation-project-assignment', kwargs={'pk': aviation_project.id})

        payload = {
            'users': [
                {'user_id': annotator_user.id, 'has_permission': True}
            ]
        }

        response = api_client.post(url, payload, format='json')

        assert response.status_code == status.HTTP_200_OK
        assert aviation_project.has_assignee(annotator_user)

    def test_post_revokes_user_assignment(
        self, api_client, aviation_project, manager_user, annotator_user
    ):
        """Test POST revokes assignment when has_permission is False."""
        # First assign
        aviation_project.add_assignee(annotator_user)

        api_client.force_authenticate(user=manager_user)
        url = reverse('aviation:aviation-project-assignment', kwargs={'pk': aviation_project.id})

        payload = {
            'users': [
                {'user_id': annotator_user.id, 'has_permission': False}
            ]
        }

        response = api_client.post(url, payload, format='json')

        assert response.status_code == status.HTTP_200_OK
        assert not aviation_project.has_assignee(annotator_user)

    def test_post_handles_multiple_users(
        self, api_client, aviation_project, manager_user, organization
    ):
        """Test POST can assign/revoke multiple users in one request."""
        user1 = User.objects.create_user(email='user1@test.com', password='testpass123')
        user2 = User.objects.create_user(email='user2@test.com', password='testpass123')
        user1.active_organization = organization
        user2.active_organization = organization
        user1.save()
        user2.save()
        OrganizationMember.objects.get_or_create(user=user1, organization=organization)
        OrganizationMember.objects.get_or_create(user=user2, organization=organization)

        api_client.force_authenticate(user=manager_user)
        url = reverse('aviation:aviation-project-assignment', kwargs={'pk': aviation_project.id})

        payload = {
            'users': [
                {'user_id': user1.id, 'has_permission': True},
                {'user_id': user2.id, 'has_permission': True}
            ]
        }

        response = api_client.post(url, payload, format='json')

        assert response.status_code == status.HTTP_200_OK
        assert aviation_project.has_assignee(user1)
        assert aviation_project.has_assignee(user2)

    def test_post_forbidden_for_annotators(
        self, api_client, aviation_project, annotator_user
    ):
        """Test annotators cannot assign users (403 Forbidden)."""
        api_client.force_authenticate(user=annotator_user)
        url = reverse('aviation:aviation-project-assignment', kwargs={'pk': aviation_project.id})

        payload = {
            'users': [
                {'user_id': annotator_user.id, 'has_permission': True}
            ]
        }

        response = api_client.post(url, payload, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_post_allowed_for_managers(
        self, api_client, aviation_project, manager_user, annotator_user
    ):
        """Test managers can assign users."""
        api_client.force_authenticate(user=manager_user)
        url = reverse('aviation:aviation-project-assignment', kwargs={'pk': aviation_project.id})

        payload = {
            'users': [
                {'user_id': annotator_user.id, 'has_permission': True}
            ]
        }

        response = api_client.post(url, payload, format='json')
        assert response.status_code == status.HTTP_200_OK

    def test_post_allowed_for_researchers(
        self, api_client, aviation_project, researcher_user, annotator_user
    ):
        """Test researchers can assign users."""
        # Grant assign permission to researcher
        from guardian.shortcuts import assign_perm
        assign_perm('aviation.assign_aviation_project', researcher_user, aviation_project)

        api_client.force_authenticate(user=researcher_user)
        url = reverse('aviation:aviation-project-assignment', kwargs={'pk': aviation_project.id})

        payload = {
            'users': [
                {'user_id': annotator_user.id, 'has_permission': True}
            ]
        }

        response = api_client.post(url, payload, format='json')
        assert response.status_code == status.HTTP_200_OK

    def test_post_requires_authentication(self, api_client, aviation_project):
        """Test POST requires user to be authenticated."""
        url = reverse('aviation:aviation-project-assignment', kwargs={'pk': aviation_project.id})

        payload = {
            'users': [
                {'user_id': 1, 'has_permission': True}
            ]
        }

        response = api_client.post(url, payload, format='json')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_post_returns_404_for_nonexistent_project(
        self, api_client, manager_user, annotator_user
    ):
        """Test POST returns 404 for non-existent project."""
        api_client.force_authenticate(user=manager_user)
        url = reverse('aviation:aviation-project-assignment', kwargs={'pk': 99999})

        payload = {
            'users': [
                {'user_id': annotator_user.id, 'has_permission': True}
            ]
        }

        response = api_client.post(url, payload, format='json')
        assert response.status_code == status.HTTP_404_NOT_FOUND


# =============================================================================
# Audit Log Tests
# =============================================================================

@pytest.mark.django_db
class TestAviationProjectAssignmentAuditLog:
    """Test audit logging for assignment actions."""

    @pytest.fixture(autouse=True)
    def mock_redis(self, mocker):
        """Mock Redis for audit log tests that trigger notifications."""
        mocker.patch('notifications.services.RedisClient.publish')

    def test_post_creates_audit_log_on_assign(
        self, api_client, aviation_project, manager_user, annotator_user
    ):
        """Test POST creates audit log entries on assignment."""
        from core.models import ActivityLog

        api_client.force_authenticate(user=manager_user)
        url = reverse('aviation:aviation-project-assignment', kwargs={'pk': aviation_project.id})

        payload = {
            'users': [
                {'user_id': annotator_user.id, 'has_permission': True}
            ]
        }

        initial_count = ActivityLog.objects.count()
        response = api_client.post(url, payload, format='json')

        assert response.status_code == status.HTTP_200_OK
        assert ActivityLog.objects.count() > initial_count

        log_entry = ActivityLog.objects.latest('id')
        assert str(manager_user.id) in log_entry.action
        assert str(annotator_user.id) in log_entry.action
        assert 'assign' in log_entry.action.lower()

    def test_post_creates_audit_log_on_revoke(
        self, api_client, aviation_project, manager_user, annotator_user
    ):
        """Test POST creates audit log entries on revocation."""
        from core.models import ActivityLog

        # First assign
        aviation_project.add_assignee(annotator_user)

        api_client.force_authenticate(user=manager_user)
        url = reverse('aviation:aviation-project-assignment', kwargs={'pk': aviation_project.id})

        payload = {
            'users': [
                {'user_id': annotator_user.id, 'has_permission': False}
            ]
        }

        initial_count = ActivityLog.objects.count()
        response = api_client.post(url, payload, format='json')

        assert response.status_code == status.HTTP_200_OK
        assert ActivityLog.objects.count() > initial_count

        log_entry = ActivityLog.objects.latest('id')
        assert str(manager_user.id) in log_entry.action
        assert str(annotator_user.id) in log_entry.action
        assert 'revoke' in log_entry.action.lower()


# =============================================================================
# Notification Tests
# =============================================================================

@pytest.mark.django_db
class TestAviationProjectAssignmentNotification:
    """Test notification sending for assignment actions."""

    @pytest.fixture(autouse=True)
    def mock_redis(self, mocker):
        """Mock Redis for notification tests."""
        mocker.patch('notifications.services.RedisClient.publish')

    def test_post_creates_notification_on_assign(
        self, api_client, aviation_project, manager_user, annotator_user
    ):
        """Test POST creates notification when user is assigned."""
        from notifications.models import Notification

        api_client.force_authenticate(user=manager_user)
        url = reverse('aviation:aviation-project-assignment', kwargs={'pk': aviation_project.id})

        payload = {
            'users': [
                {'user_id': annotator_user.id, 'has_permission': True}
            ]
        }

        initial_count = Notification.objects.count()
        response = api_client.post(url, payload, format='json')

        assert response.status_code == status.HTTP_200_OK
        assert Notification.objects.count() > initial_count

        # Check notification content
        notification = Notification.objects.latest('id')
        assert 'assign' in notification.content.lower()

    def test_post_creates_notification_on_revoke(
        self, api_client, aviation_project, manager_user, annotator_user
    ):
        """Test POST creates notification when user assignment is revoked."""
        from notifications.models import Notification

        # First assign
        aviation_project.add_assignee(annotator_user)

        api_client.force_authenticate(user=manager_user)
        url = reverse('aviation:aviation-project-assignment', kwargs={'pk': aviation_project.id})

        payload = {
            'users': [
                {'user_id': annotator_user.id, 'has_permission': False}
            ]
        }

        initial_count = Notification.objects.count()
        response = api_client.post(url, payload, format='json')

        assert response.status_code == status.HTTP_200_OK
        assert Notification.objects.count() > initial_count

        # Check notification content
        notification = Notification.objects.latest('id')
        assert 'revoke' in notification.content.lower()


# =============================================================================
# Edge Cases
# =============================================================================

@pytest.mark.django_db
class TestAviationProjectAssignmentEdgeCases:
    """Test edge cases and error handling."""

    @pytest.fixture(autouse=True)
    def mock_redis(self, mocker):
        """Mock Redis for edge case tests that trigger notifications."""
        mocker.patch('notifications.services.RedisClient.publish')

    def test_post_with_empty_users_list(
        self, api_client, aviation_project, manager_user
    ):
        """Test POST with empty users list succeeds (no-op)."""
        api_client.force_authenticate(user=manager_user)
        url = reverse('aviation:aviation-project-assignment', kwargs={'pk': aviation_project.id})

        payload = {
            'users': []
        }

        response = api_client.post(url, payload, format='json')
        assert response.status_code == status.HTTP_200_OK

    def test_post_with_invalid_user_id(
        self, api_client, aviation_project, manager_user
    ):
        """Test POST with non-existent user ID returns error."""
        api_client.force_authenticate(user=manager_user)
        url = reverse('aviation:aviation-project-assignment', kwargs={'pk': aviation_project.id})

        payload = {
            'users': [
                {'user_id': 99999, 'has_permission': True}
            ]
        }

        response = api_client.post(url, payload, format='json')
        # Should return 400 Bad Request for invalid user
        assert response.status_code in [status.HTTP_400_BAD_REQUEST, status.HTTP_404_NOT_FOUND]

    def test_assign_then_revoke_same_user(
        self, api_client, aviation_project, manager_user, annotator_user
    ):
        """Test assigning and then revoking same user works correctly."""
        api_client.force_authenticate(user=manager_user)
        url = reverse('aviation:aviation-project-assignment', kwargs={'pk': aviation_project.id})

        # Assign
        payload = {
            'users': [
                {'user_id': annotator_user.id, 'has_permission': True}
            ]
        }
        response = api_client.post(url, payload, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert aviation_project.has_assignee(annotator_user)

        # Revoke
        payload = {
            'users': [
                {'user_id': annotator_user.id, 'has_permission': False}
            ]
        }
        response = api_client.post(url, payload, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert not aviation_project.has_assignee(annotator_user)

    def test_double_assign_is_idempotent(
        self, api_client, aviation_project, manager_user, annotator_user
    ):
        """Test assigning same user twice is idempotent."""
        api_client.force_authenticate(user=manager_user)
        url = reverse('aviation:aviation-project-assignment', kwargs={'pk': aviation_project.id})

        payload = {
            'users': [
                {'user_id': annotator_user.id, 'has_permission': True}
            ]
        }

        # First assign
        response = api_client.post(url, payload, format='json')
        assert response.status_code == status.HTTP_200_OK

        # Second assign - should not fail
        response = api_client.post(url, payload, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert aviation_project.has_assignee(annotator_user)

    def test_double_revoke_is_idempotent(
        self, api_client, aviation_project, manager_user, annotator_user
    ):
        """Test revoking non-assigned user is idempotent."""
        api_client.force_authenticate(user=manager_user)
        url = reverse('aviation:aviation-project-assignment', kwargs={'pk': aviation_project.id})

        payload = {
            'users': [
                {'user_id': annotator_user.id, 'has_permission': False}
            ]
        }

        # Revoke non-assigned user - should not fail
        response = api_client.post(url, payload, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert not aviation_project.has_assignee(annotator_user)
