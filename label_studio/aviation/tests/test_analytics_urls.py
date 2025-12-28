import pytest
from django.urls import reverse, resolve

from aviation.api import AviationProjectAnalyticsAPI


@pytest.mark.django_db
class TestAnalyticsURLs:
    """Test URL routing for analytics endpoint."""

    def test_analytics_url_reverse(self):
        """Test that analytics URL can be reversed."""
        url = reverse('aviation:project-analytics', kwargs={'pk': 1})
        assert url == '/api/aviation/projects/1/analytics/'

    def test_analytics_url_resolves(self):
        """Test that analytics URL resolves to correct view."""
        # Note: This test verifies URL pattern exists
        # Actual view implementation tested in test_analytics_api.py
        resolver = resolve('/api/aviation/projects/1/analytics/')
        assert resolver.view_name == 'aviation:project-analytics'

    def test_analytics_url_resolves_to_correct_view_class(self):
        """Test that analytics URL resolves to AviationProjectAnalyticsAPI view."""
        resolver = resolve('/api/aviation/projects/1/analytics/')
        assert resolver.func.view_class == AviationProjectAnalyticsAPI

    def test_analytics_url_with_trailing_slash(self):
        """Test that URL requires trailing slash (Django convention)."""
        url_with_slash = reverse('aviation:project-analytics', kwargs={'pk': 1})
        assert url_with_slash.endswith('/')

    def test_analytics_url_with_different_ids(self):
        """Test URL generation with various project IDs."""
        for pk in [1, 42, 999]:
            url = reverse('aviation:project-analytics', kwargs={'pk': pk})
            assert url == f'/api/aviation/projects/{pk}/analytics/'

    def test_analytics_url_pk_captured(self):
        """Test that the pk parameter is correctly captured from URL."""
        resolver = resolve('/api/aviation/projects/123/analytics/')
        assert resolver.kwargs == {'pk': 123}
