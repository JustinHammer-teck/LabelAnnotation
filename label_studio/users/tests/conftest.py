"""
Pytest fixtures for users app tests.

This module provides shared fixtures for testing login, signup, and theme-related
functionality in the users app.
"""
import pytest
from unittest.mock import patch

from django.test import Client


@pytest.fixture
def client():
    """Django test client fixture."""
    return Client()


@pytest.fixture
def mock_feature_flag_new_ui():
    """
    Mock the feature flag to enable new UI templates.

    This fixture patches the flag_set function in users.views to return True
    for the new UI feature flag, enabling the new-ui templates.
    """
    with patch('users.views.flag_set') as mock_flag:
        mock_flag.return_value = True
        yield mock_flag


@pytest.fixture
def mock_feature_flag_old_ui():
    """
    Mock the feature flag to disable new UI templates (use old UI).

    This fixture patches the flag_set function in users.views to return False
    for the new UI feature flag, using the old templates.
    """
    with patch('users.views.flag_set') as mock_flag:
        mock_flag.return_value = False
        yield mock_flag


@pytest.fixture
def mock_feature_flags_custom():
    """
    Factory fixture for custom feature flag mocking.

    Usage:
        def test_something(mock_feature_flags_custom):
            with mock_feature_flags_custom({'flag_name': True, 'other_flag': False}):
                # Test code here
    """
    from contextlib import contextmanager

    @contextmanager
    def _mock_flags(flag_values):
        """
        Context manager for mocking multiple feature flags.

        Args:
            flag_values: Dict mapping flag names to their return values.
        """
        def flag_check(flag_name, *args, **kwargs):
            if flag_name in flag_values:
                return flag_values[flag_name]
            # Default to False for unknown flags
            return False

        with patch('users.views.flag_set', side_effect=flag_check):
            yield

    return _mock_flags
