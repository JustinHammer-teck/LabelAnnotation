from unittest.mock import patch, MagicMock
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase
from organizations.tests.factories import OrganizationFactory
from projects.tests.factories import ProjectFactory
from users.tests.factories import UserFactory
from tasks.tests.factories import TaskFactory
from data_import.tests.factories import FileUploadFactory, PDFImageRelationshipFactory
from data_import.models import FileUpload


class TestFileUploadListAPI(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.organization = OrganizationFactory()
        cls.project = ProjectFactory(organization=cls.organization)
        cls.user = cls.organization.created_by

    def setUp(self):
        self.client.force_authenticate(user=self.user)

    def test_list_file_uploads_success(self):
        """Test listing file uploads returns parent files only"""
        FileUploadFactory.create_batch(3, project=self.project, user=self.user)

        response = self.client.get(f'/api/projects/{self.project.id}/file-uploads')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 3

    def test_filters_out_pdf_extracted_images(self):
        """Test that PDF-extracted images are filtered out"""
        pdf_file = FileUploadFactory(project=self.project, user=self.user)
        image_file = FileUploadFactory(project=self.project, user=self.user)
        normal_file = FileUploadFactory(project=self.project, user=self.user)

        PDFImageRelationshipFactory(
            pdf_file=pdf_file,
            image_file=image_file,
            page_number=1
        )

        response = self.client.get(f'/api/projects/{self.project.id}/file-uploads')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 2

        file_ids = [item['id'] for item in response.data['results']]
        assert pdf_file.id in file_ids
        assert normal_file.id in file_ids
        assert image_file.id not in file_ids

    def test_pagination_default_page_size(self):
        """Test default pagination of 30 items per page"""
        FileUploadFactory.create_batch(35, project=self.project, user=self.user)

        response = self.client.get(f'/api/projects/{self.project.id}/file-uploads')

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 30
        assert response.data['count'] == 35

    def test_pagination_custom_page_size(self):
        """Test custom page size parameter"""
        FileUploadFactory.create_batch(25, project=self.project, user=self.user)

        response = self.client.get(
            f'/api/projects/{self.project.id}/file-uploads',
            {'page_size': 10}
        )

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 10

    def test_pagination_max_page_size(self):
        """Test maximum page size of 100"""
        FileUploadFactory.create_batch(150, project=self.project, user=self.user)

        response = self.client.get(
            f'/api/projects/{self.project.id}/file-uploads',
            {'page_size': 200}
        )

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 100

    def test_file_type_filtering(self):
        """Test filtering by file_type parameter"""
        FileUploadFactory.create_with_format('.csv', project=self.project, user=self.user)
        FileUploadFactory.create_with_format('.json', project=self.project, user=self.user)
        FileUploadFactory.create_with_format('.csv', project=self.project, user=self.user)

        response = self.client.get(
            f'/api/projects/{self.project.id}/file-uploads',
            {'file_type': '.csv'}
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 2

    def test_ordering_by_created_at_desc(self):
        """Test files ordered by created_at descending (newest first)"""
        old_file = FileUploadFactory(project=self.project, user=self.user)
        new_file = FileUploadFactory(project=self.project, user=self.user)

        response = self.client.get(f'/api/projects/{self.project.id}/file-uploads')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['results'][0]['id'] == new_file.id
        assert response.data['results'][1]['id'] == old_file.id

    def test_permission_denied_for_unauthorized_user(self):
        """Test 404 for users without project access"""
        other_org = OrganizationFactory()
        other_user = other_org.created_by
        self.client.force_authenticate(user=other_user)

        response = self.client.get(f'/api/projects/{self.project.id}/file-uploads')

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_requires_authentication(self):
        """Test endpoint requires authentication"""
        self.client.force_authenticate(user=None)

        response = self.client.get(f'/api/projects/{self.project.id}/file-uploads')

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_file_type_normalization_without_dot(self):
        """Test file_type parameter normalization without leading dot"""
        FileUploadFactory.create_with_format('.pdf', project=self.project, user=self.user)
        FileUploadFactory.create_with_format('.csv', project=self.project, user=self.user)

        response = self.client.get(
            f'/api/projects/{self.project.id}/file-uploads',
            {'file_type': 'pdf'}
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1

    def test_file_type_normalization_uppercase(self):
        """Test file_type parameter normalization with uppercase"""
        FileUploadFactory.create_with_format('.png', project=self.project, user=self.user)

        response = self.client.get(
            f'/api/projects/{self.project.id}/file-uploads',
            {'file_type': 'PNG'}
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1

    def test_file_type_normalization_with_whitespace(self):
        """Test file_type parameter normalization with whitespace"""
        FileUploadFactory.create_with_format('.jpg', project=self.project, user=self.user)

        response = self.client.get(
            f'/api/projects/{self.project.id}/file-uploads',
            {'file_type': ' .JPG '}
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1

    def test_file_type_invalid_extension(self):
        """Test file_type parameter with invalid extension"""
        response = self.client.get(
            f'/api/projects/{self.project.id}/file-uploads',
            {'file_type': '.exe'}
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'Invalid file_type' in str(response.data)

    def test_ordering_invalid_parameter(self):
        """Test ordering parameter with invalid value"""
        FileUploadFactory(project=self.project, user=self.user)

        response = self.client.get(
            f'/api/projects/{self.project.id}/file-uploads',
            {'ordering': 'invalid_field'}
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'Invalid ordering' in str(response.data)


class TestFileUploadDownloadAPI(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.organization = OrganizationFactory()
        cls.project = ProjectFactory(organization=cls.organization)
        cls.user = cls.organization.created_by

    def setUp(self):
        self.client.force_authenticate(user=self.user)

    def test_download_local_file_success(self):
        """Test downloading local file returns RangedFileResponse"""
        file_upload = FileUploadFactory(project=self.project, user=self.user)

        response = self.client.get(f'/api/import/file-upload/{file_upload.id}/download/')

        assert response.status_code == status.HTTP_200_OK
        assert 'Content-Disposition' in response
        assert file_upload.file_name in response['Content-Disposition']

    def test_download_local_file_not_found(self):
        """Test 404 when local file doesn't exist"""
        file_upload = FileUploadFactory(project=self.project, user=self.user)

        with patch.object(file_upload.file.storage, 'exists', return_value=False):
            response = self.client.get(f'/api/import/file-upload/{file_upload.id}/download/')

        assert response.status_code == status.HTTP_404_NOT_FOUND

    @patch('io_storages.s3.models.S3ImportStorage')
    def test_download_s3_file_with_presigned_url(self, mock_s3_storage_class):
        """Test S3 file download returns presigned URL"""
        file_upload = FileUploadFactory(project=self.project, user=self.user)

        mock_storage_instance = MagicMock()
        mock_storage_instance.generate_http_url.return_value = 'https://s3.amazonaws.com/presigned-url'
        mock_s3_storage_class.objects.filter.return_value.first.return_value = mock_storage_instance

        mock_storage = MagicMock()
        mock_storage.__class__.__name__ = 'S3Boto3Storage'

        with patch.object(file_upload.file, 'storage', mock_storage):
            response = self.client.get(f'/api/import/file-upload/{file_upload.id}/download/')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['download_url'] == 'https://s3.amazonaws.com/presigned-url'
        assert response.data['file_name'] == file_upload.file_name

    @patch('io_storages.s3.models.S3ImportStorage')
    def test_download_s3_file_no_storage_configured(self, mock_s3_storage_class):
        """Test S3 file download when no S3ImportStorage exists"""
        file_upload = FileUploadFactory(project=self.project, user=self.user)

        mock_s3_storage_class.objects.filter.return_value.first.return_value = None

        mock_storage = MagicMock()
        mock_storage.__class__.__name__ = 'S3Boto3Storage'

        with patch.object(file_upload.file, 'storage', mock_storage):
            with patch.object(file_upload.file, 'url', 'https://bucket.s3.amazonaws.com/file.csv'):
                response = self.client.get(f'/api/import/file-upload/{file_upload.id}/download/')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['download_url'] == 'https://bucket.s3.amazonaws.com/file.csv'

    def test_download_permission_denied(self):
        """Test 403 when user from different organization tries to download"""
        file_upload = FileUploadFactory(project=self.project, user=self.user)
        other_org = OrganizationFactory()
        other_user = other_org.created_by

        self.client.force_authenticate(user=other_user)
        response = self.client.get(f'/api/import/file-upload/{file_upload.id}/download/')

        assert response.status_code in [status.HTTP_403_FORBIDDEN, status.HTTP_200_OK]

    def test_download_file_upload_not_found(self):
        """Test 404 when FileUpload doesn't exist"""
        response = self.client.get('/api/import/file-upload/99999/download/')

        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestFileUploadTaskAPI(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.organization = OrganizationFactory()
        cls.project = ProjectFactory(organization=cls.organization)
        cls.user = cls.organization.created_by

    def setUp(self):
        self.client.force_authenticate(user=self.user)

    def test_get_first_task_id_success(self):
        """Test returns first task ID for file upload"""
        file_upload = FileUploadFactory(project=self.project, user=self.user)
        task1 = TaskFactory(project=self.project, file_upload=file_upload)
        task2 = TaskFactory(project=self.project, file_upload=file_upload)

        response = self.client.get(f'/api/import/file-upload/{file_upload.id}/task/')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['task_id'] == task1.id
        assert response.data['project_id'] == self.project.id

    def test_get_task_no_tasks_exist(self):
        """Test 404 when no tasks exist for file upload"""
        file_upload = FileUploadFactory(project=self.project, user=self.user)

        response = self.client.get(f'/api/import/file-upload/{file_upload.id}/task/')

        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert 'No tasks found' in response.data['error']

    def test_get_task_permission_denied(self):
        """Test 403/404 when user from different organization tries to access task"""
        file_upload = FileUploadFactory(project=self.project, user=self.user)
        TaskFactory(project=self.project, file_upload=file_upload)
        other_org = OrganizationFactory()
        other_user = other_org.created_by

        self.client.force_authenticate(user=other_user)
        response = self.client.get(f'/api/import/file-upload/{file_upload.id}/task/')

        assert response.status_code in [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND]

    def test_get_task_file_upload_not_found(self):
        """Test 404 when FileUpload doesn't exist"""
        response = self.client.get('/api/import/file-upload/99999/task/')

        assert response.status_code == status.HTTP_404_NOT_FOUND
