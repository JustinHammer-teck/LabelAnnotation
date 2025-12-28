"""
Test suite for AviationProject assignment methods using Django Guardian permissions.

This module tests the object-level permission system for assigning users to
AviationProject instances. Uses Guardian for object-level permissions.

TDD Phase: RED - Tests written before implementation.
"""
import pytest
from django.contrib.auth import get_user_model

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
def user(db, organization):
    """Create a test user in the organization."""
    user = User.objects.create_user(
        email='testuser@example.com',
        password='testpass123'
    )
    user.active_organization = organization
    user.save()
    OrganizationMember.objects.get_or_create(user=user, organization=organization)
    return user


@pytest.fixture
def project(db, organization):
    """Create a test Label Studio project."""
    return ProjectFactory(organization=organization)


@pytest.fixture
def aviation_project(db, project):
    """Create a test AviationProject."""
    return AviationProjectFactory(project=project)


# =============================================================================
# Permission Meta Tests
# =============================================================================

@pytest.mark.django_db
class TestAviationProjectPermissionsMeta:
    """Test that Guardian permissions are registered in model Meta."""

    def test_permission_exists_in_model_meta(self, aviation_project):
        """Test that the assignment permissions are registered in model Meta."""
        permissions = [p[0] for p in AviationProject._meta.permissions]
        assert 'assign_aviation_project' in permissions
        assert 'assigned_to_aviation_project' in permissions

    def test_permission_has_human_readable_name(self):
        """Test that permissions have human-readable names."""
        permissions_dict = dict(AviationProject._meta.permissions)
        assert 'Can Assign Aviation Project to other People' in permissions_dict.get('assign_aviation_project', '')
        assert 'User is assigned to Aviation Project' in permissions_dict.get('assigned_to_aviation_project', '')


# =============================================================================
# add_assignee() Tests
# =============================================================================

@pytest.mark.django_db
class TestAddAssignee:
    """Test the add_assignee() method."""

    def test_add_assignee_grants_permission(self, aviation_project, user):
        """Test that add_assignee grants the assigned_to_aviation_project permission."""
        aviation_project.add_assignee(user)
        assert user.has_perm('aviation.assigned_to_aviation_project', aviation_project)

    def test_add_assignee_is_idempotent(self, aviation_project, user):
        """Test that calling add_assignee twice does not raise an error."""
        aviation_project.add_assignee(user)
        aviation_project.add_assignee(user)  # Should not raise
        assert user.has_perm('aviation.assigned_to_aviation_project', aviation_project)

    def test_add_assignee_raises_for_inactive_user(self, aviation_project, organization):
        """Test that adding inactive user raises ValueError."""
        inactive_user = User.objects.create_user(
            email='inactive@test.com',
            password='testpass123',
            is_active=False
        )
        inactive_user.active_organization = organization
        inactive_user.save()
        OrganizationMember.objects.get_or_create(user=inactive_user, organization=organization)

        with pytest.raises(ValueError, match="Cannot assign inactive user"):
            aviation_project.add_assignee(inactive_user)

    def test_add_assignee_returns_none(self, aviation_project, user):
        """Test that add_assignee returns None on success."""
        result = aviation_project.add_assignee(user)
        assert result is None


# =============================================================================
# remove_assignee() Tests
# =============================================================================

@pytest.mark.django_db
class TestRemoveAssignee:
    """Test the remove_assignee() method."""

    def test_remove_assignee_revokes_permission(self, aviation_project, user):
        """Test that remove_assignee revokes the permission."""
        aviation_project.add_assignee(user)
        aviation_project.remove_assignee(user)
        assert not user.has_perm('aviation.assigned_to_aviation_project', aviation_project)

    def test_remove_assignee_is_idempotent(self, aviation_project, user):
        """Test that calling remove_assignee on non-assigned user does not raise."""
        # User was never assigned
        aviation_project.remove_assignee(user)  # Should not raise
        assert not user.has_perm('aviation.assigned_to_aviation_project', aviation_project)

    def test_remove_assignee_returns_none(self, aviation_project, user):
        """Test that remove_assignee returns None."""
        aviation_project.add_assignee(user)
        result = aviation_project.remove_assignee(user)
        assert result is None


# =============================================================================
# has_assignee() Tests
# =============================================================================

@pytest.mark.django_db
class TestHasAssignee:
    """Test the has_assignee() method."""

    def test_has_assignee_returns_true_for_assigned_user(self, aviation_project, user):
        """Test has_assignee returns True for assigned users."""
        aviation_project.add_assignee(user)
        assert aviation_project.has_assignee(user) is True

    def test_has_assignee_returns_false_for_unassigned_user(self, aviation_project, user):
        """Test has_assignee returns False for non-assigned users."""
        assert aviation_project.has_assignee(user) is False

    def test_has_assignee_returns_false_after_removal(self, aviation_project, user):
        """Test has_assignee returns False after user is removed."""
        aviation_project.add_assignee(user)
        aviation_project.remove_assignee(user)
        assert aviation_project.has_assignee(user) is False


# =============================================================================
# get_assignees() Tests
# =============================================================================

@pytest.mark.django_db
class TestGetAssignees:
    """Test the get_assignees() method."""

    def test_get_assignees_returns_empty_queryset_by_default(self, aviation_project):
        """Test get_assignees returns empty queryset when no users assigned."""
        assignees = aviation_project.get_assignees()
        assert assignees.count() == 0

    def test_get_assignees_returns_all_assigned_users(self, aviation_project, organization):
        """Test get_assignees returns all assigned users."""
        user1 = User.objects.create_user(email='user1@test.com', password='testpass123')
        user2 = User.objects.create_user(email='user2@test.com', password='testpass123')
        user1.active_organization = organization
        user2.active_organization = organization
        user1.save()
        user2.save()
        OrganizationMember.objects.get_or_create(user=user1, organization=organization)
        OrganizationMember.objects.get_or_create(user=user2, organization=organization)

        aviation_project.add_assignee(user1)
        aviation_project.add_assignee(user2)

        assignees = aviation_project.get_assignees()
        assert assignees.count() == 2
        assert user1 in assignees
        assert user2 in assignees

    def test_get_assignees_excludes_removed_users(self, aviation_project, organization):
        """Test get_assignees excludes users who have been removed."""
        user1 = User.objects.create_user(email='user1@test.com', password='testpass123')
        user2 = User.objects.create_user(email='user2@test.com', password='testpass123')
        user1.active_organization = organization
        user2.active_organization = organization
        user1.save()
        user2.save()
        OrganizationMember.objects.get_or_create(user=user1, organization=organization)
        OrganizationMember.objects.get_or_create(user=user2, organization=organization)

        aviation_project.add_assignee(user1)
        aviation_project.add_assignee(user2)
        aviation_project.remove_assignee(user1)

        assignees = aviation_project.get_assignees()
        assert assignees.count() == 1
        assert user1 not in assignees
        assert user2 in assignees


# =============================================================================
# Multiple Users Tests
# =============================================================================

@pytest.mark.django_db
class TestMultipleUsersAssignment:
    """Test scenarios with multiple users and projects."""

    def test_multiple_users_can_be_assigned(self, aviation_project, organization):
        """Test multiple users can be assigned to the same project."""
        user1 = User.objects.create_user(email='user1@test.com', password='testpass123')
        user2 = User.objects.create_user(email='user2@test.com', password='testpass123')
        user1.active_organization = organization
        user2.active_organization = organization
        user1.save()
        user2.save()
        OrganizationMember.objects.get_or_create(user=user1, organization=organization)
        OrganizationMember.objects.get_or_create(user=user2, organization=organization)

        aviation_project.add_assignee(user1)
        aviation_project.add_assignee(user2)

        assert aviation_project.has_assignee(user1)
        assert aviation_project.has_assignee(user2)

    def test_user_assigned_to_one_project_not_assigned_to_another(self, organization, user):
        """Test that assignment to one project doesn't affect another."""
        project1 = ProjectFactory(organization=organization)
        project2 = ProjectFactory(organization=organization)
        aviation_project1 = AviationProjectFactory(project=project1)
        aviation_project2 = AviationProjectFactory(project=project2)

        aviation_project1.add_assignee(user)

        assert aviation_project1.has_assignee(user) is True
        assert aviation_project2.has_assignee(user) is False

    def test_user_can_be_assigned_to_multiple_projects(self, organization, user):
        """Test that a user can be assigned to multiple projects."""
        project1 = ProjectFactory(organization=organization)
        project2 = ProjectFactory(organization=organization)
        aviation_project1 = AviationProjectFactory(project=project1)
        aviation_project2 = AviationProjectFactory(project=project2)

        aviation_project1.add_assignee(user)
        aviation_project2.add_assignee(user)

        assert aviation_project1.has_assignee(user) is True
        assert aviation_project2.has_assignee(user) is True

    def test_removing_from_one_project_does_not_affect_other(self, organization, user):
        """Test that removing assignment from one project doesn't affect others."""
        project1 = ProjectFactory(organization=organization)
        project2 = ProjectFactory(organization=organization)
        aviation_project1 = AviationProjectFactory(project=project1)
        aviation_project2 = AviationProjectFactory(project=project2)

        aviation_project1.add_assignee(user)
        aviation_project2.add_assignee(user)

        aviation_project1.remove_assignee(user)

        assert aviation_project1.has_assignee(user) is False
        assert aviation_project2.has_assignee(user) is True
