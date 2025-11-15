from django.test import TestCase
from tasks.tests.factories import TaskFactory
from organizations.tests.factories import OrganizationFactory
from projects.tests.factories import ProjectFactory
from users.tests.factories import UserFactory
from data_import.tests.factories import FileUploadFactory, PDFImageRelationshipFactory
from data_import.models import FileUpload, PDFImageRelationship


class TestFileUploadModel(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.organization = OrganizationFactory()
        cls.project = ProjectFactory(organization=cls.organization)
        cls.user = cls.organization.created_by

    def test_task_count_property_no_tasks(self):
        """Test task_count returns 0 when no tasks exist"""
        file_upload = FileUploadFactory(project=self.project, user=self.user)

        assert file_upload.task_count == 0

    def test_task_count_property_with_tasks(self):
        """Test task_count returns correct count when tasks exist"""
        file_upload = FileUploadFactory(project=self.project, user=self.user)
        TaskFactory.create_batch(3, project=self.project, file_upload=file_upload)

        assert file_upload.task_count == 3

    def test_task_count_caching(self):
        """Test task_count uses cache to avoid repeated queries"""
        file_upload = FileUploadFactory(project=self.project, user=self.user)
        TaskFactory.create_batch(2, project=self.project, file_upload=file_upload)

        first_count = file_upload.task_count

        TaskFactory.create(project=self.project, file_upload=file_upload)

        cached_count = file_upload.task_count
        assert first_count == cached_count == 2

    def test_is_parent_document_true_for_original_file(self):
        """Test is_parent_document returns True for files not extracted from PDFs"""
        file_upload = FileUploadFactory(project=self.project, user=self.user)

        assert file_upload.is_parent_document is True

    def test_is_parent_document_false_for_extracted_image(self):
        """Test is_parent_document returns False for PDF-extracted images"""
        pdf_file = FileUploadFactory(
            project=self.project,
            user=self.user
        )
        image_file = FileUploadFactory(
            project=self.project,
            user=self.user
        )

        PDFImageRelationshipFactory(
            pdf_file=pdf_file,
            image_file=image_file,
            page_number=1
        )

        assert pdf_file.is_parent_document is True
        assert image_file.is_parent_document is False

    def test_get_annotation_status_no_tasks(self):
        """Test get_annotation_status returns 'no_tasks' when no tasks exist"""
        file_upload = FileUploadFactory(project=self.project, user=self.user)

        assert file_upload.get_annotation_status() == 'no_tasks'

    def test_get_annotation_status_not_started(self):
        """Test get_annotation_status returns 'not_started' when tasks exist but none labeled"""
        file_upload = FileUploadFactory(project=self.project, user=self.user)
        TaskFactory.create_batch(3, project=self.project, file_upload=file_upload, is_labeled=False)

        assert file_upload.get_annotation_status() == 'not_started'

    def test_get_annotation_status_in_progress(self):
        """Test get_annotation_status returns 'in_progress' when some tasks are labeled"""
        file_upload = FileUploadFactory(project=self.project, user=self.user)
        TaskFactory.create_batch(2, project=self.project, file_upload=file_upload, is_labeled=False)
        TaskFactory.create(project=self.project, file_upload=file_upload, is_labeled=True)

        assert file_upload.get_annotation_status() == 'in_progress'

    def test_get_annotation_status_completed(self):
        """Test get_annotation_status returns 'completed' when all tasks are labeled"""
        file_upload = FileUploadFactory(project=self.project, user=self.user)
        TaskFactory.create_batch(3, project=self.project, file_upload=file_upload, is_labeled=True)

        assert file_upload.get_annotation_status() == 'completed'

    def test_get_annotation_status_uses_cache(self):
        """Test get_annotation_status uses cached task counts"""
        file_upload = FileUploadFactory(project=self.project, user=self.user)
        TaskFactory.create_batch(2, project=self.project, file_upload=file_upload, is_labeled=False)

        first_status = file_upload.get_annotation_status()

        TaskFactory.create(project=self.project, file_upload=file_upload, is_labeled=True)

        cached_status = file_upload.get_annotation_status()
        assert first_status == cached_status == 'not_started'


class TestPDFImageRelationshipModel(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.organization = OrganizationFactory()
        cls.project = ProjectFactory(organization=cls.organization)
        cls.user = cls.organization.created_by

    def test_pdf_image_relationship_creation(self):
        """Test basic PDFImageRelationship creation"""
        pdf_file = FileUploadFactory(project=self.project, user=self.user)
        image_file = FileUploadFactory(project=self.project, user=self.user)

        relationship = PDFImageRelationshipFactory(
            pdf_file=pdf_file,
            image_file=image_file,
            page_number=1
        )

        assert relationship.pdf_file == pdf_file
        assert relationship.image_file == image_file
        assert relationship.page_number == 1

    def test_unique_together_constraint(self):
        """Test that pdf_file + page_number must be unique"""
        from django.db import IntegrityError

        pdf_file = FileUploadFactory(project=self.project, user=self.user)
        image_file_1 = FileUploadFactory(project=self.project, user=self.user)
        image_file_2 = FileUploadFactory(project=self.project, user=self.user)

        PDFImageRelationshipFactory(
            pdf_file=pdf_file,
            image_file=image_file_1,
            page_number=1
        )

        with self.assertRaises(IntegrityError):
            PDFImageRelationshipFactory(
                pdf_file=pdf_file,
                image_file=image_file_2,
                page_number=1
            )
