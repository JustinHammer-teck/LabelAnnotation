"""
Baseline view tests for login and signup pages.

These tests establish the baseline before any theme changes and should PASS
against the current unmodified code. They verify that login and signup pages:
- Return 200 status codes
- Use correct templates
- Contain expected form elements
- Load CSS files correctly

Test Command:
    pytest label_studio/users/tests/test_login_views.py -v

Fixtures:
    Fixtures are defined in conftest.py:
    - client: Django test client
    - mock_feature_flag_new_ui: Enable new UI templates
    - mock_feature_flag_old_ui: Disable new UI templates (use old)
"""
import pytest

from django.urls import reverse


class TestLoginPageBaseline:
    """Baseline tests for the login page."""

    @pytest.mark.django_db
    def test_login_page_returns_200(self, client, mock_feature_flag_new_ui):
        """Verify login page renders successfully with 200 status code."""
        url = reverse('user-login')
        response = client.get(url)
        assert response.status_code == 200

    @pytest.mark.django_db
    def test_login_page_uses_correct_template_new_ui(self, client, mock_feature_flag_new_ui):
        """Verify login page uses the new-ui template when feature flag is enabled."""
        url = reverse('user-login')
        response = client.get(url)
        assert response.status_code == 200
        # Check that new-ui template is used
        template_names = [t.name for t in response.templates]
        assert 'users/new-ui/user_login.html' in template_names

    @pytest.mark.django_db
    def test_login_page_uses_correct_template_old_ui(self, client, mock_feature_flag_old_ui):
        """Verify login page uses the old template when feature flag is disabled."""
        url = reverse('user-login')
        response = client.get(url)
        assert response.status_code == 200
        # Check that old template is used
        template_names = [t.name for t in response.templates]
        assert 'users/user_login.html' in template_names

    @pytest.mark.django_db
    def test_login_page_contains_form(self, client, mock_feature_flag_new_ui):
        """Verify login page contains the login form element."""
        url = reverse('user-login')
        response = client.get(url)
        content = response.content.decode('utf-8')
        # Check for form element with login-form id
        assert 'id="login-form"' in content
        # Check for form action pointing to login URL
        assert 'action="' in content
        # Check for email input field
        assert 'name="email"' in content
        # Check for password input field
        assert 'name="password"' in content
        # Check for submit button
        assert 'type="submit"' in content

    @pytest.mark.django_db
    def test_login_page_contains_csrf_token(self, client, mock_feature_flag_new_ui):
        """Verify login page contains CSRF token for security."""
        url = reverse('user-login')
        response = client.get(url)
        content = response.content.decode('utf-8')
        assert 'csrfmiddlewaretoken' in content

    @pytest.mark.django_db
    def test_login_css_loads(self, client, mock_feature_flag_new_ui):
        """Verify login page includes the CSS stylesheet link."""
        import re
        url = reverse('user-login')
        response = client.get(url)
        content = response.content.decode('utf-8')
        # Check for login.css stylesheet link (may include hash in filename)
        assert re.search(r'login\.[a-z0-9]*\.css', content), 'login.css stylesheet not found'
        # Verify it's a proper link element
        assert 'rel="stylesheet"' in content


class TestSignupPageBaseline:
    """Baseline tests for the signup page."""

    @pytest.mark.django_db
    def test_signup_page_returns_200(self, client, mock_feature_flag_new_ui):
        """Verify signup page renders successfully with 200 status code."""
        url = reverse('user-signup')
        response = client.get(url)
        assert response.status_code == 200

    @pytest.mark.django_db
    def test_signup_page_uses_correct_template_new_ui(self, client, mock_feature_flag_new_ui):
        """Verify signup page uses the new-ui template when feature flag is enabled."""
        url = reverse('user-signup')
        response = client.get(url)
        assert response.status_code == 200
        # Check that new-ui template is used
        template_names = [t.name for t in response.templates]
        assert 'users/new-ui/user_signup.html' in template_names

    @pytest.mark.django_db
    def test_signup_page_uses_correct_template_old_ui(self, client, mock_feature_flag_old_ui):
        """Verify signup page uses the old template when feature flag is disabled."""
        url = reverse('user-signup')
        response = client.get(url)
        assert response.status_code == 200
        # Check that old template is used
        template_names = [t.name for t in response.templates]
        assert 'users/user_signup.html' in template_names

    @pytest.mark.django_db
    def test_signup_page_contains_form(self, client, mock_feature_flag_new_ui):
        """Verify signup page contains the signup form element."""
        url = reverse('user-signup')
        response = client.get(url)
        content = response.content.decode('utf-8')
        # Check for form element with signup-form id
        assert 'id="signup-form"' in content
        # Check for email input field
        assert 'name="email"' in content
        # Check for password input field
        assert 'name="password"' in content
        # Check for submit button
        assert 'type="submit"' in content

    @pytest.mark.django_db
    def test_signup_page_contains_csrf_token(self, client, mock_feature_flag_new_ui):
        """Verify signup page contains CSRF token for security."""
        url = reverse('user-signup')
        response = client.get(url)
        content = response.content.decode('utf-8')
        assert 'csrfmiddlewaretoken' in content

    @pytest.mark.django_db
    def test_signup_css_loads(self, client, mock_feature_flag_new_ui):
        """Verify signup page includes the CSS stylesheet link."""
        import re
        url = reverse('user-signup')
        response = client.get(url)
        content = response.content.decode('utf-8')
        # Check for login.css stylesheet link (shared between login and signup, may include hash)
        assert re.search(r'login\.[a-z0-9]*\.css', content), 'login.css stylesheet not found'
        # Verify it's a proper link element
        assert 'rel="stylesheet"' in content


class TestLoginPageFormSubmission:
    """Tests for login form submission behavior (without actual authentication)."""

    @pytest.mark.django_db
    def test_login_post_without_credentials_returns_form(self, client, mock_feature_flag_new_ui):
        """Verify POST to login without credentials re-renders the form."""
        url = reverse('user-login')
        response = client.post(url, data={})
        # Should return 200 with form errors, not redirect
        assert response.status_code == 200

    @pytest.mark.django_db
    def test_login_page_accepts_next_parameter(self, client, mock_feature_flag_new_ui):
        """Verify login page accepts and preserves the 'next' parameter."""
        url = reverse('user-login') + '?next=/projects/'
        response = client.get(url)
        assert response.status_code == 200
        content = response.content.decode('utf-8')
        # The 'next' parameter should be preserved in the form action
        assert 'next=' in content


class TestSignupPageFormSubmission:
    """Tests for signup form submission behavior (without actual registration)."""

    @pytest.mark.django_db
    def test_signup_post_without_data_returns_form(self, client, mock_feature_flag_new_ui):
        """Verify POST to signup without data re-renders the form."""
        url = reverse('user-signup')
        response = client.post(url, data={})
        # Should return 200 with form errors, not redirect
        assert response.status_code == 200

    @pytest.mark.django_db
    def test_signup_page_accepts_next_parameter(self, client, mock_feature_flag_new_ui):
        """Verify signup page accepts and preserves the 'next' parameter."""
        url = reverse('user-signup') + '?next=/projects/'
        response = client.get(url)
        assert response.status_code == 200
        content = response.content.decode('utf-8')
        # The 'next' parameter should be preserved in the form action
        assert 'next=' in content

    @pytest.mark.django_db
    def test_signup_page_accepts_token_parameter(self, client, mock_feature_flag_new_ui):
        """Verify signup page accepts and preserves the 'token' parameter for invites."""
        url = reverse('user-signup') + '?token=test-invite-token'
        response = client.get(url)
        assert response.status_code == 200
        content = response.content.decode('utf-8')
        # The 'token' parameter should be preserved in the form action
        assert 'token=' in content
