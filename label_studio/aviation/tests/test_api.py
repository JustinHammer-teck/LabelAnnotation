from rest_framework.test import APITestCase
from rest_framework import status

from organizations.tests.factories import OrganizationFactory
from projects.tests.factories import ProjectFactory
from tasks.tests.factories import TaskFactory

from aviation.tests.factories import (
    AviationProjectFactory,
    AviationEventFactory,
    LabelingItemFactory,
    ResultPerformanceFactory,
)


class AviationProjectExportAPITest(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.org1 = OrganizationFactory()
        cls.org2 = OrganizationFactory()
        cls.user1 = cls.org1.created_by
        cls.user2 = cls.org2.created_by

        cls.project1 = ProjectFactory(organization=cls.org1)
        cls.aviation_project1 = AviationProjectFactory(project=cls.project1)

        cls.project2 = ProjectFactory(organization=cls.org2)
        cls.aviation_project2 = AviationProjectFactory(project=cls.project2)

        cls.task = TaskFactory(project=cls.project1)
        cls.event = AviationEventFactory(task=cls.task)
        cls.labeling_item = LabelingItemFactory(event=cls.event)

        cls.empty_project = ProjectFactory(organization=cls.org1)
        cls.empty_aviation_project = AviationProjectFactory(project=cls.empty_project)

    def test_export_json_success(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(f'/api/aviation/projects/{self.aviation_project1.id}/export/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'application/json')
        data = response.json()
        self.assertIn('metadata', data)
        self.assertIn('events', data)
        self.assertIn('result_performances', data)

    def test_export_xlsx_success(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(f'/api/aviation/projects/{self.aviation_project1.id}/export/?export_format=xlsx')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response['Content-Type'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        self.assertIn('attachment', response['Content-Disposition'])

    def test_export_organization_isolation(self):
        self.client.force_authenticate(user=self.user2)
        response = self.client.get(f'/api/aviation/projects/{self.aviation_project1.id}/export/')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_export_unauthenticated(self):
        response = self.client.get(f'/api/aviation/projects/{self.aviation_project1.id}/export/')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_export_invalid_project(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.get('/api/aviation/projects/99999/export/')

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_export_invalid_format(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(f'/api/aviation/projects/{self.aviation_project1.id}/export/?export_format=pdf')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_export_empty_project(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(f'/api/aviation/projects/{self.empty_aviation_project.id}/export/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data['events'], [])


class ResultPerformanceEventScopeAPITest(APITestCase):
    """
    Tests for event-level isolation of ResultPerformance.
    """

    @classmethod
    def setUpTestData(cls):
        cls.org = OrganizationFactory()
        cls.user = cls.org.created_by

        cls.project = ProjectFactory(organization=cls.org)
        cls.aviation_project = AviationProjectFactory(project=cls.project)

        cls.task_a = TaskFactory(project=cls.project)
        cls.task_b = TaskFactory(project=cls.project)

        cls.event_a = AviationEventFactory(task=cls.task_a)
        cls.event_b = AviationEventFactory(task=cls.task_b)

    def test_create_result_performance_requires_event(self):
        """POST without event field should return 400 Bad Request."""
        self.client.force_authenticate(user=self.user)

        data = {
            'aviation_project': self.aviation_project.id,
            'status': 'draft',
        }

        response = self.client.post('/api/aviation/performances/', data=data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        response_data = response.json()
        self.assertTrue(
            'event' in response_data or
            ('validation_errors' in response_data and 'event' in response_data['validation_errors'])
        )

    def test_create_result_performance_with_event(self):
        """POST with valid event ID should succeed and include event in response."""
        self.client.force_authenticate(user=self.user)

        data = {
            'event': self.event_a.id,
            'status': 'draft',
        }

        response = self.client.post('/api/aviation/performances/', data=data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        response_data = response.json()
        self.assertIn('event', response_data)
        self.assertEqual(response_data['event'], self.event_a.id)

    def test_filter_performances_by_event(self):
        """GET with event filter should return only that event's performances."""
        self.client.force_authenticate(user=self.user)

        perf_a = ResultPerformanceFactory(
            aviation_project=self.aviation_project,
            event=self.event_a,
            status='draft',
        )
        perf_b = ResultPerformanceFactory(
            aviation_project=self.aviation_project,
            event=self.event_b,
            status='draft',
        )

        response = self.client.get(f'/api/aviation/performances/?event={self.event_a.id}')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        results = data.get('results', data) if isinstance(data, dict) else data
        result_ids = [item['id'] for item in results]
        self.assertIn(perf_a.id, result_ids)
        self.assertNotIn(perf_b.id, result_ids)

    def test_performance_aviation_project_auto_populated(self):
        """POST with only event should auto-populate aviation_project from event chain."""
        self.client.force_authenticate(user=self.user)

        data = {
            'event': self.event_a.id,
            'status': 'draft',
        }

        response = self.client.post('/api/aviation/performances/', data=data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        response_data = response.json()
        self.assertEqual(response_data['aviation_project'], self.aviation_project.id)

    def test_performance_isolation_between_events(self):
        """Performance for Event A should not appear when filtering by Event B."""
        self.client.force_authenticate(user=self.user)

        perf_a = ResultPerformanceFactory(
            aviation_project=self.aviation_project,
            event=self.event_a,
            status='draft',
        )

        response = self.client.get(f'/api/aviation/performances/?event={self.event_b.id}')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        results = data.get('results', data) if isinstance(data, dict) else data
        result_ids = [item['id'] for item in results]
        self.assertNotIn(perf_a.id, result_ids)
