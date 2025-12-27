"""
Test suite for aviation module permission classes.

Tests CanEditLabelingItem, CanDeleteLabelingItem, and CanCreateLabelingItem
permission classes following the permission matrix:

| Role       | Draft     | Submitted  | Reviewed   | Approved   |
|------------|-----------|------------|------------|------------|
| Annotator  | Edit/Del  | Read-only  | Edit only  | Read-only  |
| Manager    | Read-only | Read-only  | Read-only  | Read-only  |
| Researcher | Read-only | Read-only  | Read-only  | Read-only  |
| Admin      | Full      | Full       | Full       | Full       |

TDD Phase: RED - Tests written before implementation.
"""
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory, APITestCase, APIClient
from rest_framework import status

from organizations.models import OrganizationMember
from organizations.tests.factories import OrganizationFactory
from projects.tests.factories import ProjectFactory
from tasks.tests.factories import TaskFactory
from users.tests.factories import UserFactory

from aviation.models import LabelingItem
from aviation.permissions import (
    CanEditLabelingItem,
    CanDeleteLabelingItem,
    CanCreateLabelingItem,
    get_user_role,
)
from aviation.tests.factories import (
    AviationEventFactory,
    AviationProjectFactory,
    LabelingItemFactory,
)

User = get_user_model()


def create_user_with_org(organization, email, is_superuser=False, aviation_role='annotator'):
    """Helper function to create a user with organization membership."""
    user = User.objects.create_user(
        email=email,
        password='testpass123'
    )
    user.active_organization = organization
    user.is_superuser = is_superuser
    user.save()
    # Create organization membership
    OrganizationMember.objects.get_or_create(user=user, organization=organization)
    # Set aviation role
    user.aviation_role = aviation_role
    return user


# =============================================================================
# Fixtures
# =============================================================================

@pytest.fixture
def api_factory():
    """Create an APIRequestFactory instance."""
    return APIRequestFactory()


@pytest.fixture
def organization():
    """Create a test organization."""
    return OrganizationFactory()


@pytest.fixture
def project(organization):
    """Create a test project in the organization."""
    return ProjectFactory(organization=organization)


@pytest.fixture
def aviation_project(project):
    """Create a test aviation project."""
    return AviationProjectFactory(project=project)


@pytest.fixture
def task(project):
    """Create a test task in the project."""
    return TaskFactory(project=project)


@pytest.fixture
def event(task):
    """Create a test aviation event."""
    return AviationEventFactory(task=task)


@pytest.fixture
def annotator_user(organization):
    """Create an annotator user in the organization."""
    return create_user_with_org(
        organization,
        email='annotator@test.com',
        aviation_role='annotator'
    )


@pytest.fixture
def manager_user(organization):
    """Create a manager user in the organization."""
    return create_user_with_org(
        organization,
        email='manager@test.com',
        aviation_role='manager'
    )


@pytest.fixture
def researcher_user(organization):
    """Create a researcher user in the organization."""
    return create_user_with_org(
        organization,
        email='researcher@test.com',
        aviation_role='researcher'
    )


@pytest.fixture
def admin_user(organization):
    """Create an admin user (superuser) in the organization."""
    return create_user_with_org(
        organization,
        email='admin@test.com',
        is_superuser=True,
        aviation_role='admin'
    )


@pytest.fixture
def other_annotator_user(organization):
    """Create another annotator user in the organization."""
    return create_user_with_org(
        organization,
        email='annotator2@test.com',
        aviation_role='annotator'
    )


# =============================================================================
# Helper Functions Tests
# =============================================================================

@pytest.mark.django_db
class TestGetUserRole:
    """Test the get_user_role helper function."""

    def test_superuser_returns_admin(self, admin_user):
        """Superuser should return 'admin' role."""
        assert get_user_role(admin_user) == 'admin'

    def test_user_with_aviation_role_manager(self, manager_user):
        """User with aviation_role='manager' should return 'manager'."""
        assert get_user_role(manager_user) == 'manager'

    def test_user_with_aviation_role_researcher(self, researcher_user):
        """User with aviation_role='researcher' should return 'researcher'."""
        assert get_user_role(researcher_user) == 'researcher'

    def test_user_with_aviation_role_annotator(self, annotator_user):
        """User with aviation_role='annotator' should return 'annotator'."""
        assert get_user_role(annotator_user) == 'annotator'

    def test_default_user_returns_annotator(self, organization):
        """User without explicit role should default to 'annotator'."""
        user = UserFactory(active_organization=organization)
        assert get_user_role(user) == 'annotator'


# =============================================================================
# CanEditLabelingItem Tests
# =============================================================================

@pytest.mark.django_db
class TestCanEditLabelingItem:
    """Test CanEditLabelingItem permission class."""

    def setup_method(self):
        self.factory = APIRequestFactory()
        self.permission = CanEditLabelingItem()

    # -------------------------------------------------------------------------
    # Annotator Role Tests
    # -------------------------------------------------------------------------

    def test_annotator_can_edit_draft_item(self, annotator_user, event):
        """Annotator should be able to edit their own draft items."""
        item = LabelingItemFactory(
            event=event,
            status='draft',
            created_by=annotator_user
        )
        request = self.factory.patch(f'/api/aviation/items/{item.id}/')
        request.user = annotator_user
        request.method = 'PATCH'

        assert self.permission.has_object_permission(request, None, item) is True

    def test_annotator_cannot_edit_submitted_item(self, annotator_user, event):
        """Annotator should NOT be able to edit submitted items."""
        item = LabelingItemFactory(
            event=event,
            status='submitted',
            created_by=annotator_user
        )
        request = self.factory.patch(f'/api/aviation/items/{item.id}/')
        request.user = annotator_user
        request.method = 'PATCH'

        assert self.permission.has_object_permission(request, None, item) is False

    def test_annotator_can_edit_reviewed_item(self, annotator_user, event):
        """Annotator should be able to edit reviewed items (resubmit flow)."""
        item = LabelingItemFactory(
            event=event,
            status='reviewed',
            created_by=annotator_user
        )
        request = self.factory.patch(f'/api/aviation/items/{item.id}/')
        request.user = annotator_user
        request.method = 'PATCH'

        assert self.permission.has_object_permission(request, None, item) is True

    def test_annotator_cannot_edit_approved_item(self, annotator_user, event):
        """Annotator should NOT be able to edit approved items."""
        item = LabelingItemFactory(
            event=event,
            status='approved',
            created_by=annotator_user
        )
        request = self.factory.patch(f'/api/aviation/items/{item.id}/')
        request.user = annotator_user
        request.method = 'PATCH'

        assert self.permission.has_object_permission(request, None, item) is False

    def test_annotator_cannot_edit_other_users_draft(
        self, annotator_user, other_annotator_user, event
    ):
        """Annotator should NOT be able to edit other users' draft items."""
        item = LabelingItemFactory(
            event=event,
            status='draft',
            created_by=other_annotator_user
        )
        request = self.factory.patch(f'/api/aviation/items/{item.id}/')
        request.user = annotator_user
        request.method = 'PATCH'

        assert self.permission.has_object_permission(request, None, item) is False

    def test_annotator_cannot_edit_other_users_reviewed(
        self, annotator_user, other_annotator_user, event
    ):
        """Annotator should NOT be able to edit other users' reviewed items."""
        item = LabelingItemFactory(
            event=event,
            status='reviewed',
            created_by=other_annotator_user
        )
        request = self.factory.patch(f'/api/aviation/items/{item.id}/')
        request.user = annotator_user
        request.method = 'PATCH'

        assert self.permission.has_object_permission(request, None, item) is False

    # -------------------------------------------------------------------------
    # Manager Role Tests
    # -------------------------------------------------------------------------

    def test_manager_cannot_edit_draft(self, manager_user, annotator_user, event):
        """Manager should NOT be able to edit draft items."""
        item = LabelingItemFactory(
            event=event,
            status='draft',
            created_by=annotator_user
        )
        request = self.factory.patch(f'/api/aviation/items/{item.id}/')
        request.user = manager_user
        request.method = 'PATCH'

        assert self.permission.has_object_permission(request, None, item) is False

    def test_manager_cannot_edit_submitted(self, manager_user, annotator_user, event):
        """Manager should NOT be able to edit submitted items."""
        item = LabelingItemFactory(
            event=event,
            status='submitted',
            created_by=annotator_user
        )
        request = self.factory.patch(f'/api/aviation/items/{item.id}/')
        request.user = manager_user
        request.method = 'PATCH'

        assert self.permission.has_object_permission(request, None, item) is False

    def test_manager_cannot_edit_reviewed(self, manager_user, annotator_user, event):
        """Manager should NOT be able to edit reviewed items."""
        item = LabelingItemFactory(
            event=event,
            status='reviewed',
            created_by=annotator_user
        )
        request = self.factory.patch(f'/api/aviation/items/{item.id}/')
        request.user = manager_user
        request.method = 'PATCH'

        assert self.permission.has_object_permission(request, None, item) is False

    def test_manager_cannot_edit_approved(self, manager_user, annotator_user, event):
        """Manager should NOT be able to edit approved items."""
        item = LabelingItemFactory(
            event=event,
            status='approved',
            created_by=annotator_user
        )
        request = self.factory.patch(f'/api/aviation/items/{item.id}/')
        request.user = manager_user
        request.method = 'PATCH'

        assert self.permission.has_object_permission(request, None, item) is False

    def test_manager_can_view_all_items(self, manager_user, annotator_user, event):
        """Manager should be able to view (GET) all items."""
        item = LabelingItemFactory(
            event=event,
            status='draft',
            created_by=annotator_user
        )
        request = self.factory.get(f'/api/aviation/items/{item.id}/')
        request.user = manager_user
        request.method = 'GET'

        assert self.permission.has_object_permission(request, None, item) is True

    # -------------------------------------------------------------------------
    # Researcher Role Tests
    # -------------------------------------------------------------------------

    def test_researcher_cannot_edit_draft(self, researcher_user, annotator_user, event):
        """Researcher should NOT be able to edit draft items."""
        item = LabelingItemFactory(
            event=event,
            status='draft',
            created_by=annotator_user
        )
        request = self.factory.patch(f'/api/aviation/items/{item.id}/')
        request.user = researcher_user
        request.method = 'PATCH'

        assert self.permission.has_object_permission(request, None, item) is False

    def test_researcher_cannot_edit_any_status(self, researcher_user, annotator_user, event):
        """Researcher should NOT be able to edit items of any status."""
        for status_value in ['draft', 'submitted', 'reviewed', 'approved']:
            item = LabelingItemFactory(
                event=event,
                status=status_value,
                created_by=annotator_user
            )
            request = self.factory.patch(f'/api/aviation/items/{item.id}/')
            request.user = researcher_user
            request.method = 'PATCH'

            assert self.permission.has_object_permission(request, None, item) is False, \
                f"Researcher should not be able to edit {status_value} items"

    def test_researcher_can_view_all_items(self, researcher_user, annotator_user, event):
        """Researcher should be able to view (GET) all items."""
        item = LabelingItemFactory(
            event=event,
            status='submitted',
            created_by=annotator_user
        )
        request = self.factory.get(f'/api/aviation/items/{item.id}/')
        request.user = researcher_user
        request.method = 'GET'

        assert self.permission.has_object_permission(request, None, item) is True

    # -------------------------------------------------------------------------
    # Admin Role Tests
    # -------------------------------------------------------------------------

    def test_admin_can_edit_draft_item(self, admin_user, annotator_user, event):
        """Admin should be able to edit draft items."""
        item = LabelingItemFactory(
            event=event,
            status='draft',
            created_by=annotator_user
        )
        request = self.factory.patch(f'/api/aviation/items/{item.id}/')
        request.user = admin_user
        request.method = 'PATCH'

        assert self.permission.has_object_permission(request, None, item) is True

    def test_admin_can_edit_submitted_item(self, admin_user, annotator_user, event):
        """Admin should be able to edit submitted items."""
        item = LabelingItemFactory(
            event=event,
            status='submitted',
            created_by=annotator_user
        )
        request = self.factory.patch(f'/api/aviation/items/{item.id}/')
        request.user = admin_user
        request.method = 'PATCH'

        assert self.permission.has_object_permission(request, None, item) is True

    def test_admin_can_edit_reviewed_item(self, admin_user, annotator_user, event):
        """Admin should be able to edit reviewed items."""
        item = LabelingItemFactory(
            event=event,
            status='reviewed',
            created_by=annotator_user
        )
        request = self.factory.patch(f'/api/aviation/items/{item.id}/')
        request.user = admin_user
        request.method = 'PATCH'

        assert self.permission.has_object_permission(request, None, item) is True

    def test_admin_can_edit_approved_item(self, admin_user, annotator_user, event):
        """Admin should be able to edit approved items."""
        item = LabelingItemFactory(
            event=event,
            status='approved',
            created_by=annotator_user
        )
        request = self.factory.patch(f'/api/aviation/items/{item.id}/')
        request.user = admin_user
        request.method = 'PATCH'

        assert self.permission.has_object_permission(request, None, item) is True

    def test_admin_can_edit_any_users_item(self, admin_user, annotator_user, event):
        """Admin should be able to edit any user's items."""
        item = LabelingItemFactory(
            event=event,
            status='draft',
            created_by=annotator_user
        )
        request = self.factory.patch(f'/api/aviation/items/{item.id}/')
        request.user = admin_user
        request.method = 'PATCH'

        assert self.permission.has_object_permission(request, None, item) is True

    # -------------------------------------------------------------------------
    # Safe Methods Tests
    # -------------------------------------------------------------------------

    def test_safe_methods_allowed_for_all_users(
        self, annotator_user, manager_user, researcher_user, event
    ):
        """GET, HEAD, OPTIONS should be allowed for all authenticated users."""
        item = LabelingItemFactory(event=event, status='submitted')

        for user in [annotator_user, manager_user, researcher_user]:
            for method in ['GET', 'HEAD', 'OPTIONS']:
                request = self.factory.generic(method, f'/api/aviation/items/{item.id}/')
                request.user = user
                request.method = method

                assert self.permission.has_object_permission(request, None, item) is True, \
                    f"{method} should be allowed for {user}"


# =============================================================================
# CanDeleteLabelingItem Tests
# =============================================================================

@pytest.mark.django_db
class TestCanDeleteLabelingItem:
    """Test CanDeleteLabelingItem permission class."""

    def setup_method(self):
        self.factory = APIRequestFactory()
        self.permission = CanDeleteLabelingItem()

    # -------------------------------------------------------------------------
    # Annotator Role Tests
    # -------------------------------------------------------------------------

    def test_annotator_can_delete_draft_item(self, annotator_user, event):
        """Annotator should be able to delete their own draft items."""
        item = LabelingItemFactory(
            event=event,
            status='draft',
            created_by=annotator_user
        )
        request = self.factory.delete(f'/api/aviation/items/{item.id}/')
        request.user = annotator_user
        request.method = 'DELETE'

        assert self.permission.has_object_permission(request, None, item) is True

    def test_annotator_cannot_delete_submitted_item(self, annotator_user, event):
        """Annotator should NOT be able to delete submitted items."""
        item = LabelingItemFactory(
            event=event,
            status='submitted',
            created_by=annotator_user
        )
        request = self.factory.delete(f'/api/aviation/items/{item.id}/')
        request.user = annotator_user
        request.method = 'DELETE'

        assert self.permission.has_object_permission(request, None, item) is False

    def test_annotator_cannot_delete_reviewed_item(self, annotator_user, event):
        """Annotator should NOT be able to delete reviewed items."""
        item = LabelingItemFactory(
            event=event,
            status='reviewed',
            created_by=annotator_user
        )
        request = self.factory.delete(f'/api/aviation/items/{item.id}/')
        request.user = annotator_user
        request.method = 'DELETE'

        assert self.permission.has_object_permission(request, None, item) is False

    def test_annotator_cannot_delete_approved_item(self, annotator_user, event):
        """Annotator should NOT be able to delete approved items."""
        item = LabelingItemFactory(
            event=event,
            status='approved',
            created_by=annotator_user
        )
        request = self.factory.delete(f'/api/aviation/items/{item.id}/')
        request.user = annotator_user
        request.method = 'DELETE'

        assert self.permission.has_object_permission(request, None, item) is False

    def test_annotator_cannot_delete_other_users_draft(
        self, annotator_user, other_annotator_user, event
    ):
        """Annotator should NOT be able to delete other users' draft items."""
        item = LabelingItemFactory(
            event=event,
            status='draft',
            created_by=other_annotator_user
        )
        request = self.factory.delete(f'/api/aviation/items/{item.id}/')
        request.user = annotator_user
        request.method = 'DELETE'

        assert self.permission.has_object_permission(request, None, item) is False

    # -------------------------------------------------------------------------
    # Manager/Researcher Role Tests
    # -------------------------------------------------------------------------

    def test_manager_cannot_delete_any_item(self, manager_user, annotator_user, event):
        """Manager should NOT be able to delete any items."""
        for status_value in ['draft', 'submitted', 'reviewed', 'approved']:
            item = LabelingItemFactory(
                event=event,
                status=status_value,
                created_by=annotator_user
            )
            request = self.factory.delete(f'/api/aviation/items/{item.id}/')
            request.user = manager_user
            request.method = 'DELETE'

            assert self.permission.has_object_permission(request, None, item) is False, \
                f"Manager should not be able to delete {status_value} items"

    def test_researcher_cannot_delete_any_item(self, researcher_user, annotator_user, event):
        """Researcher should NOT be able to delete any items."""
        for status_value in ['draft', 'submitted', 'reviewed', 'approved']:
            item = LabelingItemFactory(
                event=event,
                status=status_value,
                created_by=annotator_user
            )
            request = self.factory.delete(f'/api/aviation/items/{item.id}/')
            request.user = researcher_user
            request.method = 'DELETE'

            assert self.permission.has_object_permission(request, None, item) is False, \
                f"Researcher should not be able to delete {status_value} items"

    # -------------------------------------------------------------------------
    # Admin Role Tests
    # -------------------------------------------------------------------------

    def test_admin_can_delete_any_status(self, admin_user, annotator_user, event):
        """Admin should be able to delete items of any status."""
        for status_value in ['draft', 'submitted', 'reviewed', 'approved']:
            item = LabelingItemFactory(
                event=event,
                status=status_value,
                created_by=annotator_user
            )
            request = self.factory.delete(f'/api/aviation/items/{item.id}/')
            request.user = admin_user
            request.method = 'DELETE'

            assert self.permission.has_object_permission(request, None, item) is True, \
                f"Admin should be able to delete {status_value} items"

    def test_admin_can_delete_any_users_item(self, admin_user, annotator_user, event):
        """Admin should be able to delete any user's items."""
        item = LabelingItemFactory(
            event=event,
            status='draft',
            created_by=annotator_user
        )
        request = self.factory.delete(f'/api/aviation/items/{item.id}/')
        request.user = admin_user
        request.method = 'DELETE'

        assert self.permission.has_object_permission(request, None, item) is True

    # -------------------------------------------------------------------------
    # Non-DELETE Methods Tests
    # -------------------------------------------------------------------------

    def test_non_delete_methods_pass_through(self, annotator_user, event):
        """Non-DELETE methods should pass through (handled by other permissions)."""
        item = LabelingItemFactory(
            event=event,
            status='submitted',
            created_by=annotator_user
        )
        for method in ['GET', 'PATCH', 'PUT']:
            request = self.factory.generic(method, f'/api/aviation/items/{item.id}/')
            request.user = annotator_user
            request.method = method

            # Non-DELETE methods should pass through (return True)
            assert self.permission.has_object_permission(request, None, item) is True, \
                f"{method} should pass through in CanDeleteLabelingItem"


# =============================================================================
# CanCreateLabelingItem Tests
# =============================================================================

@pytest.mark.django_db
class TestCanCreateLabelingItem:
    """Test CanCreateLabelingItem permission class."""

    def setup_method(self):
        self.factory = APIRequestFactory()
        self.permission = CanCreateLabelingItem()

    def test_annotator_can_create_item(self, annotator_user):
        """Annotator should be able to create labeling items."""
        request = self.factory.post('/api/aviation/items/')
        request.user = annotator_user
        request.method = 'POST'

        assert self.permission.has_permission(request, None) is True

    def test_manager_cannot_create_item(self, manager_user):
        """Manager should NOT be able to create labeling items."""
        request = self.factory.post('/api/aviation/items/')
        request.user = manager_user
        request.method = 'POST'

        assert self.permission.has_permission(request, None) is False

    def test_researcher_cannot_create_item(self, researcher_user):
        """Researcher should NOT be able to create labeling items."""
        request = self.factory.post('/api/aviation/items/')
        request.user = researcher_user
        request.method = 'POST'

        assert self.permission.has_permission(request, None) is False

    def test_admin_can_create_item(self, admin_user):
        """Admin should be able to create labeling items."""
        request = self.factory.post('/api/aviation/items/')
        request.user = admin_user
        request.method = 'POST'

        assert self.permission.has_permission(request, None) is True

    def test_non_post_methods_pass_through(self, manager_user):
        """Non-POST methods should pass through (handled by other permissions)."""
        for method in ['GET', 'PATCH', 'DELETE']:
            request = self.factory.generic(method, '/api/aviation/items/')
            request.user = manager_user
            request.method = method

            assert self.permission.has_permission(request, None) is True, \
                f"{method} should pass through in CanCreateLabelingItem"


# =============================================================================
# Integration Tests - LabelingItemViewSet with Permissions
# =============================================================================

@pytest.mark.django_db
class TestLabelingItemViewSetPermissions(APITestCase):
    """Integration tests for LabelingItemViewSet with permissions."""

    def setUp(self):
        """Set up test fixtures for each test."""
        self.org = OrganizationFactory()
        self.project = ProjectFactory(organization=self.org)
        self.aviation_project = AviationProjectFactory(project=self.project)
        self.task = TaskFactory(project=self.project)
        self.event = AviationEventFactory(task=self.task)

        # Create users with different roles
        self.annotator = create_user_with_org(
            self.org,
            email='annotator@test.com',
            aviation_role='annotator'
        )

        self.manager = create_user_with_org(
            self.org,
            email='manager@test.com',
            aviation_role='manager'
        )

        self.admin = create_user_with_org(
            self.org,
            email='admin@test.com',
            is_superuser=True,
            aviation_role='admin'
        )

    def test_patch_draft_item_as_annotator_succeeds(self):
        """PATCH request to draft item by annotator should succeed."""
        item = LabelingItemFactory(
            event=self.event,
            status='draft',
            created_by=self.annotator
        )

        self.client.force_authenticate(user=self.annotator)
        response = self.client.patch(
            f'/api/aviation/items/{item.id}/',
            data={'notes': 'Updated notes'},
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_patch_submitted_item_as_annotator_returns_403(self):
        """PATCH request to submitted item by annotator should return 403."""
        item = LabelingItemFactory(
            event=self.event,
            status='submitted',
            created_by=self.annotator
        )

        self.client.force_authenticate(user=self.annotator)
        response = self.client.patch(
            f'/api/aviation/items/{item.id}/',
            data={'notes': 'Updated notes'},
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_patch_reviewed_item_as_annotator_succeeds(self):
        """PATCH request to reviewed item by annotator should succeed (resubmit flow)."""
        item = LabelingItemFactory(
            event=self.event,
            status='reviewed',
            created_by=self.annotator
        )

        self.client.force_authenticate(user=self.annotator)
        response = self.client.patch(
            f'/api/aviation/items/{item.id}/',
            data={'notes': 'Updated notes'},
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_delete_draft_item_as_annotator_succeeds(self):
        """DELETE request to draft item by annotator should succeed."""
        item = LabelingItemFactory(
            event=self.event,
            status='draft',
            created_by=self.annotator
        )

        self.client.force_authenticate(user=self.annotator)
        response = self.client.delete(f'/api/aviation/items/{item.id}/')

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_delete_submitted_item_as_annotator_returns_403(self):
        """DELETE request to submitted item by annotator should return 403."""
        item = LabelingItemFactory(
            event=self.event,
            status='submitted',
            created_by=self.annotator
        )

        self.client.force_authenticate(user=self.annotator)
        response = self.client.delete(f'/api/aviation/items/{item.id}/')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_patch_any_item_as_manager_returns_403(self):
        """PATCH request by manager should return 403 for any item."""
        item = LabelingItemFactory(
            event=self.event,
            status='draft',
            created_by=self.annotator
        )

        self.client.force_authenticate(user=self.manager)
        response = self.client.patch(
            f'/api/aviation/items/{item.id}/',
            data={'notes': 'Updated notes'},
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_any_item_as_manager_returns_403(self):
        """DELETE request by manager should return 403 for any item."""
        item = LabelingItemFactory(
            event=self.event,
            status='draft',
            created_by=self.annotator
        )

        self.client.force_authenticate(user=self.manager)
        response = self.client.delete(f'/api/aviation/items/{item.id}/')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_patch_any_item_as_admin_succeeds(self):
        """PATCH request by admin should succeed for any status."""
        for status_value in ['draft', 'submitted', 'reviewed', 'approved']:
            item = LabelingItemFactory(
                event=self.event,
                status=status_value,
                created_by=self.annotator
            )

            self.client.force_authenticate(user=self.admin)
            response = self.client.patch(
                f'/api/aviation/items/{item.id}/',
                data={'notes': f'Admin update for {status_value}'},
                format='json'
            )

            self.assertEqual(
                response.status_code, status.HTTP_200_OK,
                f"Admin should be able to PATCH {status_value} items"
            )

    def test_delete_any_item_as_admin_succeeds(self):
        """DELETE request by admin should succeed for any status."""
        for status_value in ['draft', 'submitted', 'reviewed', 'approved']:
            item = LabelingItemFactory(
                event=self.event,
                status=status_value,
                created_by=self.annotator
            )

            self.client.force_authenticate(user=self.admin)
            response = self.client.delete(f'/api/aviation/items/{item.id}/')

            self.assertEqual(
                response.status_code, status.HTTP_204_NO_CONTENT,
                f"Admin should be able to DELETE {status_value} items"
            )

    def test_create_item_as_annotator_succeeds(self):
        """POST request by annotator should succeed."""
        self.client.force_authenticate(user=self.annotator)
        response = self.client.post(
            '/api/aviation/items/',
            data={
                'event': self.event.id,
                'sequence_number': 99,
                'status': 'draft',
            },
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_item_as_manager_returns_403(self):
        """POST request by manager should return 403."""
        self.client.force_authenticate(user=self.manager)
        response = self.client.post(
            '/api/aviation/items/',
            data={
                'event': self.event.id,
                'sequence_number': 99,
                'status': 'draft',
            },
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_item_as_admin_succeeds(self):
        """POST request by admin should succeed."""
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            '/api/aviation/items/',
            data={
                'event': self.event.id,
                'sequence_number': 999,
                'status': 'draft',
            },
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_get_items_as_manager_succeeds(self):
        """GET request by manager should succeed (read-only access)."""
        LabelingItemFactory(event=self.event, status='submitted')

        self.client.force_authenticate(user=self.manager)
        response = self.client.get('/api/aviation/items/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)


# =============================================================================
# Error Message Tests
# =============================================================================

@pytest.mark.django_db
class TestPermissionErrorMessages:
    """Test that permission classes return descriptive error messages."""

    def setup_method(self):
        self.factory = APIRequestFactory()

    def test_edit_permission_message_for_submitted(self, annotator_user, event):
        """Edit permission should return descriptive message for submitted items."""
        permission = CanEditLabelingItem()
        item = LabelingItemFactory(
            event=event,
            status='submitted',
            created_by=annotator_user
        )
        request = self.factory.patch(f'/api/aviation/items/{item.id}/')
        request.user = annotator_user
        request.method = 'PATCH'

        permission.has_object_permission(request, None, item)
        assert 'submitted' in permission.message.lower()

    def test_edit_permission_message_for_approved(self, annotator_user, event):
        """Edit permission should return descriptive message for approved items."""
        permission = CanEditLabelingItem()
        item = LabelingItemFactory(
            event=event,
            status='approved',
            created_by=annotator_user
        )
        request = self.factory.patch(f'/api/aviation/items/{item.id}/')
        request.user = annotator_user
        request.method = 'PATCH'

        permission.has_object_permission(request, None, item)
        assert 'approved' in permission.message.lower()

    def test_edit_permission_message_for_managers(self, manager_user, annotator_user, event):
        """Edit permission should return role-specific message for managers."""
        permission = CanEditLabelingItem()
        item = LabelingItemFactory(
            event=event,
            status='draft',
            created_by=annotator_user
        )
        request = self.factory.patch(f'/api/aviation/items/{item.id}/')
        request.user = manager_user
        request.method = 'PATCH'

        permission.has_object_permission(request, None, item)
        assert 'manager' in permission.message.lower() or 'review' in permission.message.lower()

    def test_delete_permission_message_for_non_draft(self, annotator_user, event):
        """Delete permission should return descriptive message for non-draft items."""
        permission = CanDeleteLabelingItem()
        item = LabelingItemFactory(
            event=event,
            status='submitted',
            created_by=annotator_user
        )
        request = self.factory.delete(f'/api/aviation/items/{item.id}/')
        request.user = annotator_user
        request.method = 'DELETE'

        permission.has_object_permission(request, None, item)
        assert 'submitted' in permission.message.lower() or 'delete' in permission.message.lower()

    def test_create_permission_message_for_managers(self, manager_user):
        """Create permission should return role-specific message for managers."""
        permission = CanCreateLabelingItem()
        request = self.factory.post('/api/aviation/items/')
        request.user = manager_user
        request.method = 'POST'

        permission.has_permission(request, None)
        assert 'manager' in permission.message.lower() or 'create' in permission.message.lower()
