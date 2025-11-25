from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APITestCase
from rest_framework import status

from organizations.tests.factories import OrganizationFactory
from projects.tests.factories import ProjectFactory
from tasks.tests.factories import TaskFactory, AnnotationFactory
from users.tests.factories import UserFactory

from aviation.models import AviationAnnotation, AviationDropdownOption
from aviation.tests.factories import (
    AviationAnnotationFactory,
    AviationDropdownOptionFactory
)


class AviationAnnotationListAPITest(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.org1 = OrganizationFactory()
        cls.org2 = OrganizationFactory()
        cls.user1 = cls.org1.created_by
        cls.user2 = cls.org2.created_by

        cls.project1 = ProjectFactory(organization=cls.org1)
        cls.project2 = ProjectFactory(organization=cls.org2)

        cls.task1 = TaskFactory(project=cls.project1)
        cls.task2 = TaskFactory(project=cls.project2)

        cls.annotation1 = AnnotationFactory(task=cls.task1, project=cls.project1)
        cls.annotation2 = AnnotationFactory(task=cls.task2, project=cls.project2)

    def test_list_annotations_organization_isolation(self):
        aviation_annotation1 = AviationAnnotationFactory(annotation=self.annotation1)
        aviation_annotation2 = AviationAnnotationFactory(annotation=self.annotation2)

        self.client.force_authenticate(user=self.user1)
        response = self.client.get('/api/aviation/annotations/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        annotation_ids = [item['id'] for item in data['results']]
        self.assertIn(aviation_annotation1.id, annotation_ids)
        self.assertNotIn(aviation_annotation2.id, annotation_ids)

    def test_list_annotations_with_select_related(self):
        aviation_annotation = AviationAnnotationFactory(annotation=self.annotation1)

        self.client.force_authenticate(user=self.user1)

        with self.assertNumQueries(4):
            response = self.client.get('/api/aviation/annotations/')
            self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_annotation_success(self):
        task = TaskFactory(project=self.project1)
        annotation = AnnotationFactory(task=task, project=self.project1)

        data = {
            'annotation': annotation.id,
            'aircraft_type': 'B737',
            'threat_type_l1': 'Environmental',
            'threat_type_l2': 'Weather',
            'threat_type_l3': 'Turbulence'
        }

        self.client.force_authenticate(user=self.user1)
        response = self.client.post('/api/aviation/annotations/', data=data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(AviationAnnotation.objects.count(), 1)

        created = AviationAnnotation.objects.first()
        self.assertEqual(created.aircraft_type, 'B737')
        self.assertEqual(created.threat_type_l1, 'Environmental')

    def test_create_annotation_validation_error(self):
        task = TaskFactory(project=self.project1)
        annotation = AnnotationFactory(task=task, project=self.project1)

        data = {
            'annotation': annotation.id,
            'aircraft_type': 'B737',
            'threat_type_l1': '',
            'error_type_l1': '',
            'uas_type_l1': ''
        }

        self.client.force_authenticate(user=self.user1)
        response = self.client.post('/api/aviation/annotations/', data=data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_list_annotations_unauthorized(self):
        response = self.client.get('/api/aviation/annotations/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class AviationAnnotationDetailAPITest(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.org1 = OrganizationFactory()
        cls.org2 = OrganizationFactory()
        cls.user1 = cls.org1.created_by
        cls.user2 = cls.org2.created_by

        cls.project1 = ProjectFactory(organization=cls.org1)
        cls.project2 = ProjectFactory(organization=cls.org2)

        cls.task1 = TaskFactory(project=cls.project1)
        cls.annotation1 = AnnotationFactory(task=cls.task1, project=cls.project1)

    def test_get_annotation(self):
        aviation_annotation = AviationAnnotationFactory(annotation=self.annotation1)

        self.client.force_authenticate(user=self.user1)
        response = self.client.get(f'/api/aviation/annotations/{aviation_annotation.id}/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data['id'], aviation_annotation.id)

    def test_get_annotation_organization_isolation(self):
        aviation_annotation = AviationAnnotationFactory(annotation=self.annotation1)

        self.client.force_authenticate(user=self.user2)
        response = self.client.get(f'/api/aviation/annotations/{aviation_annotation.id}/')

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_annotation(self):
        aviation_annotation = AviationAnnotationFactory(
            annotation=self.annotation1,
            threat_type_l1='Environmental'
        )

        data = {
            'threat_type_l1': 'Operational',
            'threat_type_l2': 'Traffic'
        }

        self.client.force_authenticate(user=self.user1)
        response = self.client.patch(
            f'/api/aviation/annotations/{aviation_annotation.id}/',
            data=data,
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        aviation_annotation.refresh_from_db()
        self.assertEqual(aviation_annotation.threat_type_l1, 'Operational')
        self.assertEqual(aviation_annotation.threat_type_l2, 'Traffic')

    def test_update_annotation_organization_isolation(self):
        aviation_annotation = AviationAnnotationFactory(annotation=self.annotation1)

        data = {'threat_type_l1': 'Updated'}

        self.client.force_authenticate(user=self.user2)
        response = self.client.patch(
            f'/api/aviation/annotations/{aviation_annotation.id}/',
            data=data,
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_annotation(self):
        aviation_annotation = AviationAnnotationFactory(annotation=self.annotation1)

        self.client.force_authenticate(user=self.user1)
        response = self.client.delete(f'/api/aviation/annotations/{aviation_annotation.id}/')

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(AviationAnnotation.objects.filter(id=aviation_annotation.id).exists())

    def test_delete_annotation_organization_isolation(self):
        aviation_annotation = AviationAnnotationFactory(annotation=self.annotation1)

        self.client.force_authenticate(user=self.user2)
        response = self.client.delete(f'/api/aviation/annotations/{aviation_annotation.id}/')

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(AviationAnnotation.objects.filter(id=aviation_annotation.id).exists())


class AviationDropdownListAPITest(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.organization = OrganizationFactory()
        cls.user = cls.organization.created_by

        cls.threat_l1_1 = AviationDropdownOptionFactory(
            category='threat',
            level=1,
            code='ENV',
            label='Environmental',
            display_order=1
        )
        cls.threat_l1_2 = AviationDropdownOptionFactory(
            category='threat',
            level=1,
            code='OPS',
            label='Operational',
            display_order=2
        )
        cls.threat_l2 = AviationDropdownOptionFactory(
            category='threat',
            level=2,
            parent=cls.threat_l1_1,
            code='WX',
            label='Weather'
        )
        cls.error_l1 = AviationDropdownOptionFactory(
            category='error',
            level=1,
            code='PROC',
            label='Procedural'
        )
        cls.inactive_option = AviationDropdownOptionFactory(
            category='threat',
            level=1,
            is_active=False
        )

    def test_list_all_active_options(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/aviation/dropdowns/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        self.assertEqual(len(data['results']), 4)

    def test_filter_by_category(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/aviation/dropdowns/?category=threat')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        self.assertEqual(len(data['results']), 3)
        for item in data['results']:
            self.assertEqual(item['category'], 'threat')

    def test_filter_by_level(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/aviation/dropdowns/?level=1')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        self.assertEqual(len(data['results']), 3)
        for item in data['results']:
            self.assertEqual(item['level'], 1)

    def test_filter_by_parent(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(f'/api/aviation/dropdowns/?parent={self.threat_l1_1.id}')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        self.assertEqual(len(data['results']), 1)
        self.assertEqual(data['results'][0]['parent'], self.threat_l1_1.id)

    def test_filter_invalid_level(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/aviation/dropdowns/?level=5')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_filter_invalid_parent(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/aviation/dropdowns/?parent=invalid')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_ordering_by_display_order(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/aviation/dropdowns/?category=threat&level=1')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        self.assertEqual(data['results'][0]['code'], 'ENV')
        self.assertEqual(data['results'][1]['code'], 'OPS')

    def test_inactive_options_excluded(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/aviation/dropdowns/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        option_ids = [item['id'] for item in data['results']]
        self.assertNotIn(self.inactive_option.id, option_ids)


class AviationDropdownHierarchyAPITest(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.organization = OrganizationFactory()
        cls.user = cls.organization.created_by

        cls.l1 = AviationDropdownOptionFactory(
            category='threat',
            level=1,
            code='L1',
            label='Level 1'
        )
        cls.l2 = AviationDropdownOptionFactory(
            category='threat',
            level=2,
            parent=cls.l1,
            code='L2',
            label='Level 2'
        )
        cls.l3 = AviationDropdownOptionFactory(
            category='threat',
            level=3,
            parent=cls.l2,
            code='L3',
            label='Level 3'
        )

    def test_get_hierarchy_tree(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/aviation/dropdowns/hierarchy/?category=threat')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        self.assertEqual(len(data), 1)
        root = data[0]
        self.assertEqual(root['code'], 'L1')
        self.assertEqual(len(root['children']), 1)
        self.assertEqual(root['children'][0]['code'], 'L2')
        self.assertEqual(len(root['children'][0]['children']), 1)
        self.assertEqual(root['children'][0]['children'][0]['code'], 'L3')

    def test_hierarchy_missing_category(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/aviation/dropdowns/hierarchy/')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_hierarchy_multiple_roots(self):
        l1_second = AviationDropdownOptionFactory(
            category='threat',
            level=1,
            code='L1B'
        )

        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/aviation/dropdowns/hierarchy/?category=threat')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        self.assertEqual(len(data), 2)


class AviationDropdownSearchAPITest(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.organization = OrganizationFactory()
        cls.user = cls.organization.created_by

        cls.option1 = AviationDropdownOptionFactory(
            category='threat',
            code='ENV',
            label='Environmental Threat'
        )
        cls.option2 = AviationDropdownOptionFactory(
            category='error',
            code='PROC',
            label='Procedural Error'
        )
        cls.option3 = AviationDropdownOptionFactory(
            category='threat',
            code='WEATHER',
            label='Weather Conditions'
        )

    def test_search_by_label(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/aviation/dropdowns/search/?q=Environmental')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['label'], 'Environmental Threat')

    def test_search_by_code(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/aviation/dropdowns/search/?q=PROC')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['code'], 'PROC')

    def test_search_case_insensitive(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/aviation/dropdowns/search/?q=weather')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['code'], 'WEATHER')

    def test_search_with_category_filter(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/aviation/dropdowns/search/?q=e&category=error')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['category'], 'error')

    def test_search_empty_query(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/aviation/dropdowns/search/?q=')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        self.assertEqual(len(data), 0)

    def test_search_query_too_long(self):
        long_query = 'a' * 101

        self.client.force_authenticate(user=self.user)
        response = self.client.get(f'/api/aviation/dropdowns/search/?q={long_query}')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_search_sanitizes_wildcards(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/aviation/dropdowns/search/?q=ENV%')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_search_limit_50_results(self):
        for i in range(60):
            AviationDropdownOptionFactory(
                category='test',
                code=f'CODE{i}',
                label=f'Test Option {i}'
            )

        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/aviation/dropdowns/search/?q=Test')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        self.assertEqual(len(data), 50)


class AviationExcelValidateAPITest(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.organization = OrganizationFactory()
        cls.user = cls.organization.created_by
        cls.project = ProjectFactory(organization=cls.organization)

    def test_validate_api_not_implemented(self):
        file = SimpleUploadedFile(
            "test.xlsx",
            b"file_content",
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )

        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            f'/api/projects/{self.project.id}/aviation/validate/',
            data={'file': file},
            format='multipart'
        )

        self.assertEqual(response.status_code, status.HTTP_501_NOT_IMPLEMENTED)

    def test_validate_missing_file(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(f'/api/projects/{self.project.id}/aviation/validate/')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        data = response.json()
        self.assertIn('error', data)


class AviationExportAPITest(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.org1 = OrganizationFactory()
        cls.org2 = OrganizationFactory()
        cls.user1 = cls.org1.created_by
        cls.user2 = cls.org2.created_by

        cls.project1 = ProjectFactory(organization=cls.org1)
        cls.project2 = ProjectFactory(organization=cls.org2)

    def test_export_missing_project_id(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.get('/api/aviation/export/')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_export_organization_isolation(self):
        self.client.force_authenticate(user=self.user2)
        response = self.client.get(f'/api/aviation/export/?project_id={self.project1.id}')

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_export_not_implemented(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(f'/api/aviation/export/?project_id={self.project1.id}')

        self.assertEqual(response.status_code, status.HTTP_501_NOT_IMPLEMENTED)

    def test_export_path_traversal_prevention(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(f'/api/aviation/export/?project_id={self.project1.id}')

        self.assertNotEqual(response.status_code, status.HTTP_200_OK)


class AviationExportTemplateAPITest(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.organization = OrganizationFactory()
        cls.user = cls.organization.created_by

    def test_export_template_authenticated(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/aviation/export/template/')

        self.assertEqual(response.status_code, status.HTTP_501_NOT_IMPLEMENTED)

    def test_export_template_unauthenticated(self):
        response = self.client.get('/api/aviation/export/template/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_export_template_path_validation(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/aviation/export/template/')

        self.assertNotEqual(response.status_code, status.HTTP_200_OK)
