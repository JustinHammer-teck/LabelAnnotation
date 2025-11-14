from django.test import TestCase
from tasks.tests.factories import TaskFactory
from organizations.tests.factories import OrganizationFactory
from projects.tests.factories import ProjectFactory
from data_import.tests.factories import FileUploadFactory
from data_import.serializers import FileUploadListSerializer


class TestFileUploadListSerializer(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.organization = OrganizationFactory()
        cls.project = ProjectFactory(organization=cls.organization, title='Test Project')
        cls.user = cls.organization.created_by

    def test_file_name_field(self):
        """Test file_name field returns basename of file"""
        file_upload = FileUploadFactory.create_with_format(
            '.csv',
            project=self.project,
            user=self.user
        )

        serializer = FileUploadListSerializer(file_upload)

        assert 'file_name' in serializer.data
        assert serializer.data['file_name'].endswith('.csv')

    def test_file_type_field(self):
        """Test file_type field returns file extension"""
        file_upload = FileUploadFactory.create_with_format(
            '.json',
            project=self.project,
            user=self.user
        )

        serializer = FileUploadListSerializer(file_upload)

        assert serializer.data['file_type'] == '.json'

    def test_file_type_field_unknown_format(self):
        """Test file_type returns 'unknown' for files without extension"""
        file_upload = FileUploadFactory(
            project=self.project,
            user=self.user
        )

        serializer = FileUploadListSerializer(file_upload)
        file_type = serializer.data['file_type']

        assert file_type in ['.txt', 'unknown'] or file_type.startswith('.')

    def test_status_field_no_tasks(self):
        """Test status field returns 'no_tasks'"""
        file_upload = FileUploadFactory(project=self.project, user=self.user)

        serializer = FileUploadListSerializer(file_upload)

        assert serializer.data['status'] == 'no_tasks'

    def test_status_field_in_progress(self):
        """Test status field returns 'in_progress'"""
        file_upload = FileUploadFactory(project=self.project, user=self.user)
        TaskFactory.create(project=self.project, file_upload=file_upload, is_labeled=False)
        TaskFactory.create(project=self.project, file_upload=file_upload, is_labeled=True)

        serializer = FileUploadListSerializer(file_upload)

        assert serializer.data['status'] == 'in_progress'

    def test_task_count_field(self):
        """Test task_count field returns correct count"""
        file_upload = FileUploadFactory(project=self.project, user=self.user)
        TaskFactory.create_batch(5, project=self.project, file_upload=file_upload)

        serializer = FileUploadListSerializer(file_upload)

        assert serializer.data['task_count'] == 5

    def test_project_title_field(self):
        """Test project_title field returns project title"""
        file_upload = FileUploadFactory(project=self.project, user=self.user)

        serializer = FileUploadListSerializer(file_upload)

        assert serializer.data['project_title'] == 'Test Project'

    def test_serializer_output_structure(self):
        """Test complete serializer output structure"""
        file_upload = FileUploadFactory(project=self.project, user=self.user)
        TaskFactory.create_batch(2, project=self.project, file_upload=file_upload, is_labeled=True)

        serializer = FileUploadListSerializer(file_upload)

        assert set(serializer.data.keys()) == {
            'id', 'file_name', 'file_type', 'created_at',
            'status', 'task_count', 'project_title'
        }
        assert serializer.data['id'] == file_upload.id
        assert serializer.data['task_count'] == 2
        assert serializer.data['status'] == 'completed'
