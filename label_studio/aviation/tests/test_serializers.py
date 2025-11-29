from django.test import TestCase
from rest_framework.exceptions import ValidationError

from organizations.tests.factories import OrganizationFactory
from projects.tests.factories import ProjectFactory
from tasks.tests.factories import TaskFactory, AnnotationFactory
from users.tests.factories import UserFactory

from aviation.models import AviationAnnotation, AviationDropdownOption
from aviation.serializers import (
    AviationIncidentSerializer,
    AviationAnnotationSerializer,
    AviationDropdownOptionSerializer,
    ExcelUploadSerializer
)
from aviation.tests.factories import (
    AviationIncidentFactory,
    AviationAnnotationFactory,
    AviationDropdownOptionFactory
)
from io import BytesIO
from django.core.files.uploadedfile import SimpleUploadedFile


class AviationIncidentSerializerTest(TestCase):
    def setUp(self):
        self.organization = OrganizationFactory()
        self.project = ProjectFactory(organization=self.organization)
        self.task = TaskFactory(project=self.project)

    def test_serialize_incident(self):
        incident = AviationIncidentFactory(task=self.task)
        serializer = AviationIncidentSerializer(incident)

        data = serializer.data
        self.assertEqual(data['task_id'], self.task.id)
        self.assertEqual(data['project_id'], self.project.id)
        self.assertEqual(data['event_number'], incident.event_number)
        self.assertEqual(data['event_description'], incident.event_description)

    def test_task_id_read_only(self):
        incident = AviationIncidentFactory(task=self.task)
        serializer = AviationIncidentSerializer(incident)

        self.assertIn('task_id', serializer.data)
        self.assertEqual(serializer.data['task_id'], self.task.id)

    def test_project_id_read_only(self):
        incident = AviationIncidentFactory(task=self.task)
        serializer = AviationIncidentSerializer(incident)

        self.assertIn('project_id', serializer.data)
        self.assertEqual(serializer.data['project_id'], self.project.id)

    def test_created_at_read_only(self):
        serializer = AviationIncidentSerializer()
        self.assertIn('created_at', serializer.Meta.read_only_fields)
        self.assertIn('updated_at', serializer.Meta.read_only_fields)


class AviationAnnotationSerializerTest(TestCase):
    def setUp(self):
        self.organization = OrganizationFactory()
        self.project = ProjectFactory(organization=self.organization)
        self.task = TaskFactory(project=self.project)
        self.annotation = AnnotationFactory(task=self.task, project=self.project)

    def test_serialize_annotation(self):
        aviation_annotation = AviationAnnotationFactory(annotation=self.annotation)
        serializer = AviationAnnotationSerializer(aviation_annotation)

        data = serializer.data
        self.assertEqual(data['annotation_id'], self.annotation.id)
        self.assertEqual(data['task_id'], self.task.id)

    def test_calculated_training_aggregation(self):
        aviation_annotation = AviationAnnotationFactory(
            annotation=self.annotation,
            threat_training_topics=['Topic A', 'Topic B'],
            error_training_topics=['Topic C', 'Topic A'],
            uas_training_topics=['Topic D'],
            crm_training_topics=['Topic B', 'Topic E']
        )
        serializer = AviationAnnotationSerializer(aviation_annotation)

        calculated = serializer.data['calculated_training']
        self.assertEqual(len(calculated), 5)
        self.assertIn('Topic A', calculated)
        self.assertIn('Topic B', calculated)
        self.assertIn('Topic C', calculated)
        self.assertIn('Topic D', calculated)
        self.assertIn('Topic E', calculated)

    def test_calculated_training_sorted(self):
        aviation_annotation = AviationAnnotationFactory(
            annotation=self.annotation,
            threat_training_topics=['Zebra', 'Apple'],
            error_training_topics=['Banana'],
            uas_training_topics=[],
            crm_training_topics=[]
        )
        serializer = AviationAnnotationSerializer(aviation_annotation)

        calculated = serializer.data['calculated_training']
        self.assertEqual(calculated, ['Apple', 'Banana', 'Zebra'])

    def test_validation_at_least_one_section_required(self):
        data = {
            'annotation': self.annotation.id,
            'aircraft_type': 'B737',
            'threat_type_l1': '',
            'threat_type_l2': '',
            'threat_type_l3': '',
            'error_type_l1': '',
            'error_type_l2': '',
            'error_type_l3': '',
            'uas_type_l1': '',
            'uas_type_l2': '',
            'uas_type_l3': ''
        }

        serializer = AviationAnnotationSerializer(data=data)
        with self.assertRaises(ValidationError) as context:
            serializer.is_valid(raise_exception=True)

        self.assertIn('At least one identification section', str(context.exception))

    def test_validation_threat_section_valid(self):
        data = {
            'annotation': self.annotation.id,
            'threat_type_l1': 'Environmental',
            'error_type_l1': '',
            'uas_type_l1': ''
        }

        serializer = AviationAnnotationSerializer(data=data)
        self.assertTrue(serializer.is_valid())

    def test_validation_error_section_valid(self):
        annotation2 = AnnotationFactory(task=self.task, project=self.project)
        data = {
            'annotation': annotation2.id,
            'error_type_l2': 'Communication',
            'threat_type_l1': '',
            'uas_type_l1': ''
        }

        serializer = AviationAnnotationSerializer(data=data)
        self.assertTrue(serializer.is_valid())

    def test_validation_uas_section_valid(self):
        annotation3 = AnnotationFactory(task=self.task, project=self.project)
        data = {
            'annotation': annotation3.id,
            'uas_type_l3': 'Quadcopter',
            'threat_type_l1': '',
            'error_type_l1': ''
        }

        serializer = AviationAnnotationSerializer(data=data)
        self.assertTrue(serializer.is_valid())

    def test_read_only_fields(self):
        serializer = AviationAnnotationSerializer()
        read_only = serializer.Meta.read_only_fields

        self.assertIn('created_at', read_only)
        self.assertIn('updated_at', read_only)
        self.assertIn('threat_training_topics', read_only)
        self.assertIn('error_training_topics', read_only)
        self.assertIn('uas_training_topics', read_only)

    def test_annotation_id_read_only(self):
        aviation_annotation = AviationAnnotationFactory(annotation=self.annotation)
        serializer = AviationAnnotationSerializer(aviation_annotation)

        self.assertEqual(serializer.data['annotation_id'], self.annotation.id)

    def test_task_id_read_only(self):
        aviation_annotation = AviationAnnotationFactory(annotation=self.annotation)
        serializer = AviationAnnotationSerializer(aviation_annotation)

        self.assertEqual(serializer.data['task_id'], self.task.id)


class AviationDropdownOptionSerializerTest(TestCase):
    def test_serialize_dropdown_option(self):
        option = AviationDropdownOptionFactory(
            category='threat',
            level=1,
            code='ENV',
            label='Environmental'
        )
        serializer = AviationDropdownOptionSerializer(option)

        data = serializer.data
        self.assertEqual(data['category'], 'threat')
        self.assertEqual(data['level'], 1)
        self.assertEqual(data['code'], 'ENV')
        self.assertEqual(data['label'], 'Environmental')

    def test_has_children_true(self):
        parent = AviationDropdownOptionFactory(category='threat', level=1)
        child = AviationDropdownOptionFactory(category='threat', level=2, parent=parent)

        serializer = AviationDropdownOptionSerializer(parent)
        self.assertTrue(serializer.data['has_children'])

    def test_has_children_false(self):
        option = AviationDropdownOptionFactory(category='threat', level=1)
        serializer = AviationDropdownOptionSerializer(option)
        self.assertFalse(serializer.data['has_children'])

    def test_parent_label(self):
        parent = AviationDropdownOptionFactory(
            category='threat',
            level=1,
            label='Parent Label'
        )
        child = AviationDropdownOptionFactory(
            category='threat',
            level=2,
            parent=parent
        )

        serializer = AviationDropdownOptionSerializer(child)
        self.assertEqual(serializer.data['parent_label'], 'Parent Label')

    def test_parent_label_null(self):
        option = AviationDropdownOptionFactory(category='threat', level=1)
        serializer = AviationDropdownOptionSerializer(option)
        self.assertIsNone(serializer.data['parent_label'])


class ExcelUploadSerializerTest(TestCase):
    def setUp(self):
        self.organization = OrganizationFactory()
        self.user = self.organization.created_by
        self.project = ProjectFactory(organization=self.organization)

    def test_valid_xlsx_file(self):
        file = SimpleUploadedFile(
            "test.xlsx",
            b"file_content",
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )

        serializer = ExcelUploadSerializer(data={
            'file': file,
            'project': self.project.id
        }, context={'request': type('Request', (), {'user': self.user})()})

        self.assertTrue(serializer.is_valid())

    def test_valid_xls_file(self):
        file = SimpleUploadedFile(
            "test.xls",
            b"file_content",
            content_type="application/vnd.ms-excel"
        )

        serializer = ExcelUploadSerializer(data={
            'file': file,
            'project': self.project.id
        }, context={'request': type('Request', (), {'user': self.user})()})

        self.assertTrue(serializer.is_valid())

    def test_invalid_file_format(self):
        file = SimpleUploadedFile(
            "test.pdf",
            b"file_content",
            content_type="application/pdf"
        )

        serializer = ExcelUploadSerializer(data={
            'file': file,
            'project': self.project.id
        }, context={'request': type('Request', (), {'user': self.user})()})

        self.assertFalse(serializer.is_valid())
        self.assertIn('file', serializer.errors)

    def test_file_too_large(self):
        large_content = b"0" * (51 * 1024 * 1024)
        file = SimpleUploadedFile(
            "test.xlsx",
            large_content,
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )

        serializer = ExcelUploadSerializer(data={
            'file': file,
            'project': self.project.id
        }, context={'request': type('Request', (), {'user': self.user})()})

        self.assertFalse(serializer.is_valid())
        self.assertIn('file', serializer.errors)
        self.assertIn('size too large', str(serializer.errors['file']))

    def test_project_filtering_by_organization(self):
        other_org = OrganizationFactory()
        other_project = ProjectFactory(organization=other_org)

        mock_request = type('Request', (), {'user': self.user})()
        serializer = ExcelUploadSerializer(context={'request': mock_request})

        project_queryset = serializer.fields['project'].queryset
        self.assertIn(self.project, project_queryset)
        self.assertNotIn(other_project, project_queryset)

    def test_project_queryset_without_request(self):
        serializer = ExcelUploadSerializer()
        project_queryset = serializer.fields['project'].queryset
        self.assertEqual(project_queryset.model, ProjectFactory._meta.get_model_class())

    def test_file_extension_case_insensitive(self):
        file = SimpleUploadedFile(
            "test.XLSX",
            b"file_content",
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )

        serializer = ExcelUploadSerializer(data={
            'file': file,
            'project': self.project.id
        }, context={'request': type('Request', (), {'user': self.user})()})

        self.assertTrue(serializer.is_valid())
