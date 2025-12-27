"""
Theme element tests for login and signup pages.

This is a skeleton file for theme-specific tests that will be added in Phase 2A/2B
of the China Eastern theme implementation. Currently contains placeholder tests
and the infrastructure for theme testing.

Phase 2A will add:
- Tests for China Eastern logo presence
- Tests for airline-specific color theming
- Tests for custom CSS classes

Phase 2B will add:
- Tests for Chinese label localization (this phase)
- Tests for theme switching functionality
- Tests for theme persistence
- Tests for responsive theme behavior

Chinese Label Mapping (Phase 2B):
+---------------------------+----------------------------+
| English                   | Chinese                    |
+---------------------------+----------------------------+
| Log in                    | 登录                       |
| Sign Up                   | 注册                       |
| Email Address             | 邮箱                       |
| Password                  | 密码                       |
| Create Account            | 创建账户                   |
| Keep me logged in         | 在此浏览器中保持登录状态     |
| Don't have an account?    | 还没有账户？               |
| Already have an account?  | 已有账户？                 |
+---------------------------+----------------------------+

Test Command:
    pytest label_studio/users/tests/test_theme_elements.py -v
    pytest label_studio/users/tests/test_theme_elements.py -k "chinese" -v

Fixtures:
    Fixtures are defined in conftest.py:
    - client: Django test client
    - mock_feature_flag_new_ui: Enable new UI templates
    - mock_feature_flag_old_ui: Disable new UI templates (use old)
"""
import re

import pytest

from django.urls import reverse


class TestThemeElementsBaseline:
    """
    Baseline theme element tests.

    These tests verify the China Eastern Airlines theme elements are present.
    The left panel with Label Studio/Human Signal branding has been removed
    in favor of the China Eastern Airlines header with airline logo.
    """

    @pytest.mark.django_db
    def test_login_page_has_logo(self, client, mock_feature_flag_new_ui):
        """Verify login page contains the China Eastern Airlines logo."""
        url = reverse('user-login')
        response = client.get(url)
        content = response.content.decode('utf-8')
        # Check for China Eastern Airlines logo
        assert re.search(r'airline_logo(\.[a-z0-9]+)?\.jpg', content) or 'China Eastern' in content

    @pytest.mark.django_db
    def test_signup_page_has_logo(self, client, mock_feature_flag_new_ui):
        """Verify signup page contains the China Eastern Airlines logo."""
        url = reverse('user-signup')
        response = client.get(url)
        content = response.content.decode('utf-8')
        # Check for China Eastern Airlines logo
        assert re.search(r'airline_logo(\.[a-z0-9]+)?\.jpg', content) or 'China Eastern' in content

    @pytest.mark.django_db
    def test_login_page_has_brand_colors(self, client, mock_feature_flag_new_ui):
        """Verify login page includes brand color definitions."""
        url = reverse('user-login')
        response = client.get(url)
        content = response.content.decode('utf-8')
        # Check for CSS file that contains brand colors (may include hash in filename)
        assert re.search(r'login\.[a-z0-9]*\.css', content), 'login.css stylesheet not found'

    @pytest.mark.django_db
    def test_login_page_has_cea_header(self, client, mock_feature_flag_new_ui):
        """Verify login page contains China Eastern Airlines header."""
        url = reverse('user-login')
        response = client.get(url)
        content = response.content.decode('utf-8')
        # Check for CEA header class
        assert 'cea-header' in content, 'CEA header not found'


class TestThemeElementsPlaceholder:
    """
    Placeholder tests for China Eastern theme elements.

    These tests are marked as skip until Phase 2A/2B implementation.
    They define the expected behavior for the themed login/signup pages.
    """

    @pytest.mark.skip(reason="Phase 2A: China Eastern logo not yet implemented")
    @pytest.mark.django_db
    def test_china_eastern_logo_present(self, client, mock_feature_flag_new_ui):
        """
        Verify China Eastern Airlines logo is displayed on themed pages.

        Expected implementation:
        - Logo should be visible in the header/sidebar
        - Logo should have appropriate alt text for accessibility
        - Logo should link to appropriate destination
        """
        url = reverse('user-login')
        response = client.get(url)
        content = response.content.decode('utf-8')
        # TODO: Update assertion when logo is implemented
        assert 'china-eastern-logo' in content

    @pytest.mark.skip(reason="Phase 2A: Theme colors not yet implemented")
    @pytest.mark.django_db
    def test_theme_primary_color_applied(self, client, mock_feature_flag_new_ui):
        """
        Verify China Eastern primary color is applied to themed elements.

        Expected implementation:
        - Primary buttons should use theme color
        - Links should use theme color
        - Focus states should use theme color
        """
        url = reverse('user-login')
        response = client.get(url)
        content = response.content.decode('utf-8')
        # TODO: Update assertion when theme colors are implemented
        # China Eastern blue: #0057A8 or similar
        assert 'china-eastern-theme' in content

    @pytest.mark.skip(reason="Phase 2B: Theme switching not yet implemented")
    @pytest.mark.django_db
    def test_theme_can_be_toggled(self, client, mock_feature_flag_new_ui):
        """
        Verify theme can be toggled between default and China Eastern.

        Expected implementation:
        - Theme toggle should be accessible
        - Theme preference should be saved
        - Theme should apply immediately
        """
        pass

    @pytest.mark.skip(reason="Phase 2B: Custom CSS classes not yet implemented")
    @pytest.mark.django_db
    def test_custom_css_classes_applied(self, client, mock_feature_flag_new_ui):
        """
        Verify custom CSS classes are applied for theming.

        Expected implementation:
        - Body should have theme class
        - Form elements should have themed variants
        - Interactive elements should have themed states
        """
        url = reverse('user-login')
        response = client.get(url)
        content = response.content.decode('utf-8')
        # TODO: Update assertion when CSS classes are implemented
        assert 'theme-china-eastern' in content


class TestChinaEasternCSSTheme:
    """
    CSS tests for China Eastern Airlines theme.

    These tests verify that the CSS file contains the required theme styles
    for the China Eastern Airlines branding: blue header (#0091EA), gray
    background (#f5f5f5), white form card, and blue primary button.

    Phase 2A implementation tests.

    Test Command:
        pytest label_studio/users/tests/test_theme_elements.py -k "css" -v
    """

    CSS_FILE_PATH = 'label_studio/core/static/css/login.css'

    def _read_css_file(self):
        """Read the login.css file content."""
        import os
        # Get the path relative to the label_studio directory
        # test file is at: label_studio/users/tests/test_theme_elements.py
        # dirname 1: label_studio/users/tests
        # dirname 2: label_studio/users
        # dirname 3: label_studio (contains core/static/css/login.css)
        base_path = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        css_path = os.path.join(base_path, 'core', 'static', 'css', 'login.css')
        with open(css_path, 'r') as f:
            return f.read()

    def test_css_contains_cea_header_class(self):
        """
        Verify .cea-header class exists in CSS.

        The China Eastern header should have:
        - Background color using the primary color (#0091EA)
        - Display flex for alignment
        - Appropriate height
        """
        css_content = self._read_css_file()
        assert '.cea-header' in css_content, 'CSS must contain .cea-header class for China Eastern header'
        # Verify it has background styling
        assert 'cea-header' in css_content and 'background' in css_content, \
            '.cea-header class must have background styling'

    def test_css_contains_cea_primary_color(self):
        """
        Verify #0091EA (China Eastern blue) is defined in CSS.

        This is the primary brand color for China Eastern Airlines
        and should be used for the header, buttons, and active states.
        """
        css_content = self._read_css_file()
        # Check for the color in any format (hex, variable definition)
        assert '#0091EA' in css_content or '#0091ea' in css_content, \
            'CSS must contain China Eastern primary color #0091EA'

    def test_css_contains_gray_background(self):
        """
        Verify gray background color (#f5f5f5) is defined in CSS.

        The page background should use a light gray color for
        the China Eastern theme.
        """
        css_content = self._read_css_file()
        # Check for the gray background color
        assert '#f5f5f5' in css_content or '#F5F5F5' in css_content, \
            'CSS must contain gray background color #f5f5f5'

    def test_css_contains_form_card_styles(self):
        """
        Verify form card styling exists in CSS.

        The form card should have:
        - White background
        - Border radius
        - Box shadow
        """
        css_content = self._read_css_file()
        assert '.cea-form-card' in css_content, \
            'CSS must contain .cea-form-card class for form styling'

    def test_css_contains_cea_header_title_class(self):
        """
        Verify .cea-header-title class exists in CSS.

        The header title should have appropriate font styling.
        """
        css_content = self._read_css_file()
        assert '.cea-header-title' in css_content, \
            'CSS must contain .cea-header-title class for header title styling'

    def test_css_contains_cea_header_logo_class(self):
        """
        Verify .cea-header-logo class exists in CSS.

        The header logo should have appropriate sizing.
        """
        css_content = self._read_css_file()
        assert '.cea-header-logo' in css_content, \
            'CSS must contain .cea-header-logo class for header logo styling'

    def test_css_contains_cea_primary_btn_class(self):
        """
        Verify .cea-primary-btn class exists in CSS.

        The primary button should use the China Eastern blue color.
        """
        css_content = self._read_css_file()
        assert '.cea-primary-btn' in css_content, \
            'CSS must contain .cea-primary-btn class for primary button styling'

    def test_css_contains_css_variables(self):
        """
        Verify CSS variables are defined for China Eastern theme colors.

        Variables should include:
        - --cea-primary
        - --cea-background
        """
        css_content = self._read_css_file()
        assert '--cea-primary' in css_content, \
            'CSS must define --cea-primary variable'
        assert '--cea-background' in css_content, \
            'CSS must define --cea-background variable'


class TestThemeAccessibility:
    """
    Accessibility tests for themed elements.

    These tests ensure that theming changes maintain WCAG compliance.
    """

    @pytest.mark.django_db
    def test_logo_has_alt_text(self, client, mock_feature_flag_new_ui):
        """Verify logo images have appropriate alt text."""
        url = reverse('user-login')
        response = client.get(url)
        content = response.content.decode('utf-8')
        # Check for aria-label or alt on logo elements
        assert 'aria-label=' in content or 'alt=' in content

    @pytest.mark.django_db
    def test_form_labels_present(self, client, mock_feature_flag_new_ui):
        """Verify form inputs have associated labels."""
        url = reverse('user-login')
        response = client.get(url)
        content = response.content.decode('utf-8')
        # Check for label elements
        assert '<label' in content
        # Check for email label (Chinese: 邮箱)
        assert '邮箱' in content
        # Check for password label (Chinese: 密码)
        assert '密码' in content

    @pytest.mark.django_db
    def test_submit_button_has_aria_label(self, client, mock_feature_flag_new_ui):
        """Verify submit button has aria-label for screen readers."""
        url = reverse('user-login')
        response = client.get(url)
        content = response.content.decode('utf-8')
        # Check for aria-label on submit button
        assert 'aria-label=' in content


class TestChineseLabels:
    """
    Chinese label localization tests for China Eastern Airlines theme.

    These tests verify that Chinese language labels are correctly displayed
    on the login and signup pages for the China Eastern Airlines theme.

    Chinese Label Mapping:
    +---------------------------+----------------------------+
    | English                   | Chinese                    |
    +---------------------------+----------------------------+
    | Log in                    | 登录                       |
    | Sign Up                   | 注册                       |
    | Email Address             | 邮箱                       |
    | Password                  | 密码                       |
    | Create Account            | 创建账户                   |
    +---------------------------+----------------------------+

    Phase 3 implemented Chinese labels in the templates.

    Test Command:
        pytest label_studio/users/tests/test_theme_elements.py -k "chinese" -v
    """

    @pytest.mark.django_db
    def test_login_page_contains_chinese_login_label(self, client, mock_feature_flag_new_ui):
        """
        Verify login page contains Chinese label for 'Log in' button.

        Expected: The login button should display "登录" (Log in) in Chinese
        when the China Eastern Airlines theme is active.
        """
        url = reverse('user-login')
        response = client.get(url)
        content = response.content.decode('utf-8')
        assert '登录' in content, "Chinese label '登录' (Log in) not found on login page"

    @pytest.mark.django_db
    def test_login_page_contains_chinese_email_label(self, client, mock_feature_flag_new_ui):
        """
        Verify login page contains Chinese label for 'Email Address' field.

        Expected: The email field label should display "邮箱" (Email) in Chinese
        when the China Eastern Airlines theme is active.
        """
        url = reverse('user-login')
        response = client.get(url)
        content = response.content.decode('utf-8')
        assert '邮箱' in content, "Chinese label '邮箱' (Email Address) not found on login page"

    @pytest.mark.django_db
    def test_login_page_contains_chinese_password_label(self, client, mock_feature_flag_new_ui):
        """
        Verify login page contains Chinese label for 'Password' field.

        Expected: The password field label should display "密码" (Password) in Chinese
        when the China Eastern Airlines theme is active.
        """
        url = reverse('user-login')
        response = client.get(url)
        content = response.content.decode('utf-8')
        assert '密码' in content, "Chinese label '密码' (Password) not found on login page"

    @pytest.mark.django_db
    def test_signup_page_contains_chinese_signup_label(self, client, mock_feature_flag_new_ui):
        """
        Verify signup page contains Chinese label for 'Sign Up' button.

        Expected: The signup button should display "注册" (Sign Up) in Chinese
        when the China Eastern Airlines theme is active.
        """
        url = reverse('user-signup')
        response = client.get(url)
        content = response.content.decode('utf-8')
        assert '注册' in content, "Chinese label '注册' (Sign Up) not found on signup page"

    @pytest.mark.django_db
    def test_signup_page_contains_chinese_create_account(self, client, mock_feature_flag_new_ui):
        """
        Verify signup page contains Chinese label for 'Create Account'.

        Expected: The create account heading/button should display "创建账户"
        (Create Account) in Chinese when the China Eastern Airlines theme is active.
        """
        url = reverse('user-signup')
        response = client.get(url)
        content = response.content.decode('utf-8')
        assert '创建账户' in content, "Chinese label '创建账户' (Create Account) not found on signup page"


class TestTemplateIntegration:
    """
    Template integration tests for China Eastern Airlines theme.

    These tests verify that the Django templates correctly integrate the
    China Eastern Airlines theme elements including:
    - Airline logo (airline_logo.jpg)
    - CEA header with .cea-header class
    - Blue-styled buttons
    - Chinese toggle labels (登录/注册)

    Phase 3 implementation tests.

    Test Command:
        pytest label_studio/users/tests/test_theme_elements.py -k "template" -v
    """

    @pytest.mark.django_db
    def test_login_page_has_airline_logo(self, client, mock_feature_flag_new_ui):
        """
        Verify login page contains the China Eastern airline logo.

        The airline logo should be present in the header section using
        the static path 'images/airline_logo.jpg'.
        Note: Django staticfiles may add a hash to the filename (e.g., airline_logo.6d0000399987.jpg)
        """
        url = reverse('user-login')
        response = client.get(url)
        content = response.content.decode('utf-8')
        # Match airline_logo with optional hash before extension (e.g., airline_logo.6d0000399987.jpg)
        assert re.search(r'airline_logo(\.[a-z0-9]+)?\.jpg', content), \
            "Airline logo (airline_logo.jpg) not found on login page"

    @pytest.mark.django_db
    def test_login_page_header_has_cea_class(self, client, mock_feature_flag_new_ui):
        """
        Verify login page header uses the .cea-header CSS class.

        The header div should have the 'cea-header' class for proper
        China Eastern Airlines styling (blue background, etc.).
        """
        url = reverse('user-login')
        response = client.get(url)
        content = response.content.decode('utf-8')
        assert 'cea-header' in content, \
            "CEA header class 'cea-header' not found on login page"

    @pytest.mark.django_db
    def test_login_button_has_blue_style(self, client, mock_feature_flag_new_ui):
        """
        Verify login button has China Eastern blue styling.

        The login page should use the cea-login-page class which applies
        the China Eastern blue color to buttons via CSS.
        """
        url = reverse('user-login')
        response = client.get(url)
        content = response.content.decode('utf-8')
        # Check for cea-login-page class which applies blue button styling
        assert 'cea-login-page' in content, \
            "CEA login page class 'cea-login-page' not found on login page"

    @pytest.mark.django_db
    def test_signup_page_has_airline_logo(self, client, mock_feature_flag_new_ui):
        """
        Verify signup page contains the China Eastern airline logo.

        The airline logo should be present in the header section using
        the static path 'images/airline_logo.jpg'.
        Note: Django staticfiles may add a hash to the filename (e.g., airline_logo.6d0000399987.jpg)
        """
        url = reverse('user-signup')
        response = client.get(url)
        content = response.content.decode('utf-8')
        # Match airline_logo with optional hash before extension (e.g., airline_logo.6d0000399987.jpg)
        assert re.search(r'airline_logo(\.[a-z0-9]+)?\.jpg', content), \
            "Airline logo (airline_logo.jpg) not found on signup page"

    @pytest.mark.django_db
    def test_full_theme_integration_login(self, client, mock_feature_flag_new_ui):
        """
        End-to-end theme verification for login page.

        Verifies all China Eastern theme elements are present:
        - CEA header with proper class
        - Airline logo
        - Chinese labels (登录, 邮箱, 密码)
        - Chinese toggle labels (登录/注册)
        - CEA login page class for styling
        """
        url = reverse('user-login')
        response = client.get(url)
        content = response.content.decode('utf-8')

        # Verify CEA header
        assert 'cea-header' in content, "CEA header not found"

        # Verify airline logo (may have hash in filename from Django staticfiles)
        assert re.search(r'airline_logo(\.[a-z0-9]+)?\.jpg', content), "Airline logo not found"

        # Verify Chinese labels
        assert '登录' in content, "Chinese login label not found"
        assert '邮箱' in content, "Chinese email label not found"
        assert '密码' in content, "Chinese password label not found"

        # Verify CEA page styling
        assert 'cea-login-page' in content, "CEA login page class not found"

        # Verify Chinese toggle labels
        assert '注册' in content, "Chinese signup toggle not found"

    @pytest.mark.django_db
    def test_full_theme_integration_signup(self, client, mock_feature_flag_new_ui):
        """
        End-to-end theme verification for signup page.

        Verifies all China Eastern theme elements are present:
        - CEA header with proper class
        - Airline logo
        - Chinese labels (注册, 邮箱, 密码, 创建账户)
        - Chinese toggle labels (登录/注册)
        - CEA login page class for styling
        """
        url = reverse('user-signup')
        response = client.get(url)
        content = response.content.decode('utf-8')

        # Verify CEA header
        assert 'cea-header' in content, "CEA header not found"

        # Verify airline logo (may have hash in filename from Django staticfiles)
        assert re.search(r'airline_logo(\.[a-z0-9]+)?\.jpg', content), "Airline logo not found"

        # Verify Chinese labels
        assert '注册' in content, "Chinese signup label not found"
        assert '邮箱' in content, "Chinese email label not found"
        assert '密码' in content, "Chinese password label not found"
        assert '创建账户' in content, "Chinese create account label not found"

        # Verify CEA page styling
        assert 'cea-login-page' in content, "CEA login page class not found"

        # Verify Chinese toggle labels
        assert '登录' in content, "Chinese login toggle not found"


class TestOldUITemplateIntegration:
    """
    Template integration tests for OLD UI templates (non-new-ui).

    These tests verify that the OLD UI templates (used when feature flag is disabled)
    also have the China Eastern Airlines theme elements including:
    - Airline logo (airline_logo.jpg)
    - CEA header with .cea-header class
    - Chinese labels (登录, 注册, 邮箱, 密码)

    Test Command:
        pytest label_studio/users/tests/test_theme_elements.py -k "old_ui" -v
    """

    @pytest.mark.django_db
    def test_old_ui_login_page_has_airline_logo(self, client, mock_feature_flag_old_ui):
        """
        Verify OLD UI login page contains the China Eastern airline logo.
        """
        url = reverse('user-login')
        response = client.get(url)
        content = response.content.decode('utf-8')
        assert re.search(r'airline_logo(\.[a-z0-9]+)?\.jpg', content), \
            "Airline logo not found on OLD UI login page"

    @pytest.mark.django_db
    def test_old_ui_login_page_has_cea_header(self, client, mock_feature_flag_old_ui):
        """
        Verify OLD UI login page has CEA header class.
        """
        url = reverse('user-login')
        response = client.get(url)
        content = response.content.decode('utf-8')
        assert 'cea-header' in content, \
            "CEA header class not found on OLD UI login page"

    @pytest.mark.django_db
    def test_old_ui_login_page_has_chinese_labels(self, client, mock_feature_flag_old_ui):
        """
        Verify OLD UI login page contains Chinese labels.
        """
        url = reverse('user-login')
        response = client.get(url)
        content = response.content.decode('utf-8')
        assert '登录' in content, "Chinese login label not found on OLD UI"
        assert '邮箱' in content, "Chinese email placeholder not found on OLD UI"
        assert '密码' in content, "Chinese password placeholder not found on OLD UI"

    @pytest.mark.django_db
    def test_old_ui_signup_page_has_airline_logo(self, client, mock_feature_flag_old_ui):
        """
        Verify OLD UI signup page contains the China Eastern airline logo.
        """
        url = reverse('user-signup')
        response = client.get(url)
        content = response.content.decode('utf-8')
        assert re.search(r'airline_logo(\.[a-z0-9]+)?\.jpg', content), \
            "Airline logo not found on OLD UI signup page"

    @pytest.mark.django_db
    def test_old_ui_signup_page_has_chinese_labels(self, client, mock_feature_flag_old_ui):
        """
        Verify OLD UI signup page contains Chinese labels.
        """
        url = reverse('user-signup')
        response = client.get(url)
        content = response.content.decode('utf-8')
        assert '注册' in content, "Chinese signup label not found on OLD UI"
        assert '邮箱' in content, "Chinese email placeholder not found on OLD UI"
        assert '密码' in content, "Chinese password placeholder not found on OLD UI"
        assert '创建账户' in content, "Chinese create account not found on OLD UI"


class TestVisualVerificationPhase4:
    """
    Phase 4 visual verification tests for China Eastern Airlines theme.

    These tests verify CSS polish, hover states, responsive styles, and
    accessibility compliance for the final visual verification phase.

    Test Command:
        pytest label_studio/users/tests/test_theme_elements.py -k "visual" -v
    """

    CSS_FILE_PATH = 'label_studio/core/static/css/login.css'

    def _read_css_file(self):
        """Read the login.css file content."""
        import os
        base_path = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        css_path = os.path.join(base_path, 'core', 'static', 'css', 'login.css')
        with open(css_path, 'r') as f:
            return f.read()

    def test_css_contains_button_hover_state(self):
        """
        Verify CSS contains hover state for primary button.

        The China Eastern primary button should have a hover state
        that darkens the button color for better UX feedback.
        """
        css_content = self._read_css_file()
        # Check for hover state on CEA primary button
        assert '.cea-primary-btn:hover' in css_content or \
               'cea-login-page' in css_content and ':hover' in css_content, \
            "CSS must contain hover state for primary button"

    def test_css_contains_responsive_media_queries(self):
        """
        Verify CSS contains responsive media queries for mobile devices.

        The theme should adapt to different screen sizes using
        media queries for tablet (768px) and mobile (480px).
        """
        css_content = self._read_css_file()
        # Check for tablet media query
        assert '@media' in css_content and '768px' in css_content, \
            "CSS must contain tablet media query (@media max-width: 768px)"
        # Check for mobile media query
        assert '@media' in css_content and '480px' in css_content, \
            "CSS must contain mobile media query (@media max-width: 480px)"

    def test_css_contains_input_focus_state(self):
        """
        Verify CSS contains focus state for input fields.

        Input fields should have a visible focus state for
        accessibility and better UX.
        """
        css_content = self._read_css_file()
        assert 'input:focus' in css_content or 'focus' in css_content, \
            "CSS must contain focus state for input fields"

    def test_css_contains_visually_hidden_class(self):
        """
        Verify CSS contains visually-hidden class for accessibility.

        The visually-hidden class allows labels to be accessible
        to screen readers while hidden visually.
        """
        css_content = self._read_css_file()
        assert '.visually-hidden' in css_content, \
            "CSS must contain .visually-hidden class for accessibility"

    @pytest.mark.django_db
    def test_login_form_labels_associated_with_inputs(self, client, mock_feature_flag_new_ui):
        """
        Verify form labels are properly associated with inputs using 'for' attribute.

        This is essential for accessibility - labels should reference
        input IDs via the 'for' attribute.
        """
        url = reverse('user-login')
        response = client.get(url)
        content = response.content.decode('utf-8')
        # Check for label with for="email"
        assert 'for="email"' in content, \
            "Email input must have associated label with for='email'"
        # Check for label with for="password"
        assert 'for="password"' in content, \
            "Password input must have associated label with for='password'"

    @pytest.mark.django_db
    def test_logo_has_descriptive_alt_text(self, client, mock_feature_flag_new_ui):
        """
        Verify logo image has descriptive alt text for accessibility.

        The China Eastern Airlines logo should have meaningful
        alt text for screen reader users.
        """
        url = reverse('user-login')
        response = client.get(url)
        content = response.content.decode('utf-8')
        # Check for alt text containing meaningful description
        assert 'alt="' in content and ('China Eastern' in content or 'Logo' in content), \
            "Logo must have descriptive alt text"

    @pytest.mark.django_db
    def test_cea_header_responsive_padding(self):
        """
        Verify CSS contains responsive padding for header on mobile.

        The header should have reduced padding on smaller screens.
        """
        css_content = self._read_css_file()
        # Check that header padding changes in media queries
        assert '.cea-header' in css_content, \
            "CSS must contain .cea-header class"
        # Verify responsive adjustments exist
        assert 'padding: 0 20px' in css_content or 'padding: 0 15px' in css_content, \
            "CSS must contain responsive padding for header"

    def test_css_toggle_hover_state(self):
        """
        Verify CSS contains hover state for toggle tabs.

        The toggle tabs (登录/注册) should have a hover state
        that shows the blue underline.
        """
        css_content = self._read_css_file()
        assert '.cea-toggle' in css_content and ':hover' in css_content, \
            "CSS must contain hover state for toggle tabs"

    def test_css_checkbox_styling(self):
        """
        Verify CSS contains styling for checked checkbox in CEA theme.

        The checkbox should use the China Eastern blue color
        when checked.
        """
        css_content = self._read_css_file()
        assert '.cea-login-page .form-group input:checked' in css_content, \
            "CSS must contain checkbox checked state styling for CEA theme"
