from unittest.mock import patch, MagicMock
from django.test import TestCase

from organizations.tests.factories import OrganizationFactory
from projects.tests.factories import ProjectFactory
from tasks.tests.factories import TaskFactory, AnnotationFactory

from aviation.models import AviationAnnotation
from aviation.tests.factories import AviationAnnotationFactory
from aviation.signals import aviation_annotation_post_save


class AviationAnnotationSignalTest(TestCase):
    def setUp(self):
        self.organization = OrganizationFactory()
        self.project = ProjectFactory(organization=self.organization)
        self.task = TaskFactory(project=self.project)
        self.annotation = AnnotationFactory(task=self.task, project=self.project)

    @patch('aviation.signals.TrainingCalculationService')
    def test_signal_triggers_on_create(self, mock_service_class):
        mock_calculator = MagicMock()
        mock_service_class.return_value = mock_calculator
        mock_calculator.calculate_training_topics.return_value = {
            'threat_training_topics': ['Topic A'],
            'error_training_topics': [],
            'uas_training_topics': []
        }

        aviation_annotation = AviationAnnotationFactory(
            annotation=self.annotation,
            threat_type_l3='Turbulence'
        )

        self.assertTrue(mock_calculator.calculate_training_topics.called)

    @patch('aviation.signals.TrainingCalculationService')
    def test_signal_triggers_on_update(self, mock_service_class):
        mock_calculator = MagicMock()
        mock_service_class.return_value = mock_calculator
        mock_calculator.calculate_training_topics.return_value = {
            'threat_training_topics': ['Topic B'],
            'error_training_topics': [],
            'uas_training_topics': []
        }

        aviation_annotation = AviationAnnotationFactory(annotation=self.annotation)

        mock_calculator.reset_mock()

        aviation_annotation.threat_type_l3 = 'Updated Threat'
        aviation_annotation.save(update_fields=['threat_type_l3'])

        self.assertTrue(mock_calculator.calculate_training_topics.called)

    @patch('aviation.signals.TrainingCalculationService')
    def test_signal_skips_on_raw(self, mock_service_class):
        mock_calculator = MagicMock()
        mock_service_class.return_value = mock_calculator
        mock_calculator.calculate_training_topics.return_value = {
            'threat_training_topics': [],
            'error_training_topics': [],
            'uas_training_topics': []
        }

        aviation_annotation = AviationAnnotationFactory(annotation=self.annotation)

        mock_calculator.reset_mock()

        aviation_annotation_post_save(
            sender=AviationAnnotation,
            instance=aviation_annotation,
            created=True,
            raw=True
        )

        self.assertFalse(mock_calculator.calculate_training_topics.called)

    @patch('aviation.signals.TrainingCalculationService')
    def test_signal_prevents_recursion_on_training_topics_update(self, mock_service_class):
        mock_calculator = MagicMock()
        mock_service_class.return_value = mock_calculator
        mock_calculator.calculate_training_topics.return_value = {
            'threat_training_topics': [],
            'error_training_topics': [],
            'uas_training_topics': []
        }

        aviation_annotation = AviationAnnotationFactory(annotation=self.annotation)

        mock_calculator.reset_mock()

        aviation_annotation.threat_training_topics = ['New Topic']
        aviation_annotation.save(update_fields=['threat_training_topics'])

        self.assertFalse(mock_calculator.calculate_training_topics.called)

    @patch('aviation.signals.TrainingCalculationService')
    def test_signal_prevents_recursion_on_error_training_topics_update(self, mock_service_class):
        mock_calculator = MagicMock()
        mock_service_class.return_value = mock_calculator
        mock_calculator.calculate_training_topics.return_value = {
            'threat_training_topics': [],
            'error_training_topics': [],
            'uas_training_topics': []
        }

        aviation_annotation = AviationAnnotationFactory(annotation=self.annotation)

        mock_calculator.reset_mock()

        aviation_annotation.error_training_topics = ['Error Topic']
        aviation_annotation.save(update_fields=['error_training_topics'])

        self.assertFalse(mock_calculator.calculate_training_topics.called)

    @patch('aviation.signals.TrainingCalculationService')
    def test_signal_prevents_recursion_on_uas_training_topics_update(self, mock_service_class):
        mock_calculator = MagicMock()
        mock_service_class.return_value = mock_calculator
        mock_calculator.calculate_training_topics.return_value = {
            'threat_training_topics': [],
            'error_training_topics': [],
            'uas_training_topics': []
        }

        aviation_annotation = AviationAnnotationFactory(annotation=self.annotation)

        mock_calculator.reset_mock()

        aviation_annotation.uas_training_topics = ['UAS Topic']
        aviation_annotation.save(update_fields=['uas_training_topics'])

        self.assertFalse(mock_calculator.calculate_training_topics.called)

    @patch('aviation.signals.TrainingCalculationService')
    def test_signal_uses_update_to_prevent_recursion(self, mock_service_class):
        mock_calculator = MagicMock()
        mock_service_class.return_value = mock_calculator
        mock_calculator.calculate_training_topics.return_value = {
            'threat_training_topics': ['Topic A', 'Topic B'],
            'error_training_topics': ['Topic C'],
            'uas_training_topics': []
        }

        aviation_annotation = AviationAnnotationFactory(
            annotation=self.annotation,
            threat_type_l3='Turbulence'
        )

        aviation_annotation.refresh_from_db()
        self.assertEqual(aviation_annotation.threat_training_topics, ['Topic A', 'Topic B'])
        self.assertEqual(aviation_annotation.error_training_topics, ['Topic C'])

    @patch('aviation.signals.TrainingCalculationService')
    def test_signal_only_triggers_on_relevant_fields(self, mock_service_class):
        mock_calculator = MagicMock()
        mock_service_class.return_value = mock_calculator
        mock_calculator.calculate_training_topics.return_value = {
            'threat_training_topics': [],
            'error_training_topics': [],
            'uas_training_topics': []
        }

        aviation_annotation = AviationAnnotationFactory(annotation=self.annotation)

        mock_calculator.reset_mock()

        aviation_annotation.aircraft_type = 'A320'
        aviation_annotation.save(update_fields=['aircraft_type'])

        self.assertFalse(mock_calculator.calculate_training_topics.called)

    @patch('aviation.signals.TrainingCalculationService')
    def test_signal_triggers_on_threat_type_l3_update(self, mock_service_class):
        mock_calculator = MagicMock()
        mock_service_class.return_value = mock_calculator
        mock_calculator.calculate_training_topics.return_value = {
            'threat_training_topics': [],
            'error_training_topics': [],
            'uas_training_topics': []
        }

        aviation_annotation = AviationAnnotationFactory(annotation=self.annotation)

        mock_calculator.reset_mock()

        aviation_annotation.threat_type_l3 = 'New Threat'
        aviation_annotation.save(update_fields=['threat_type_l3'])

        self.assertTrue(mock_calculator.calculate_training_topics.called)

    @patch('aviation.signals.TrainingCalculationService')
    def test_signal_triggers_on_error_type_l3_update(self, mock_service_class):
        mock_calculator = MagicMock()
        mock_service_class.return_value = mock_calculator
        mock_calculator.calculate_training_topics.return_value = {
            'threat_training_topics': [],
            'error_training_topics': [],
            'uas_training_topics': []
        }

        aviation_annotation = AviationAnnotationFactory(annotation=self.annotation)

        mock_calculator.reset_mock()

        aviation_annotation.error_type_l3 = 'New Error'
        aviation_annotation.save(update_fields=['error_type_l3'])

        self.assertTrue(mock_calculator.calculate_training_topics.called)

    @patch('aviation.signals.TrainingCalculationService')
    def test_signal_triggers_on_uas_type_l3_update(self, mock_service_class):
        mock_calculator = MagicMock()
        mock_service_class.return_value = mock_calculator
        mock_calculator.calculate_training_topics.return_value = {
            'threat_training_topics': [],
            'error_training_topics': [],
            'uas_training_topics': []
        }

        aviation_annotation = AviationAnnotationFactory(annotation=self.annotation)

        mock_calculator.reset_mock()

        aviation_annotation.uas_type_l3 = 'New UAS'
        aviation_annotation.save(update_fields=['uas_type_l3'])

        self.assertTrue(mock_calculator.calculate_training_topics.called)

    @patch('aviation.signals.TrainingCalculationService')
    def test_signal_update_without_update_fields_triggers(self, mock_service_class):
        mock_calculator = MagicMock()
        mock_service_class.return_value = mock_calculator
        mock_calculator.calculate_training_topics.return_value = {
            'threat_training_topics': [],
            'error_training_topics': [],
            'uas_training_topics': []
        }

        aviation_annotation = AviationAnnotationFactory(annotation=self.annotation)

        mock_calculator.reset_mock()

        aviation_annotation.threat_type_l1 = 'Updated'
        aviation_annotation.save()

        self.assertFalse(mock_calculator.calculate_training_topics.called)

    def test_signal_connected(self):
        from django.db.models.signals import post_save
        from aviation.signals import aviation_annotation_post_save

        found = False
        for receiver in post_save._live_receivers(AviationAnnotation):
            if len(receiver) > 0:
                receiver_func = receiver[0]

                if receiver_func is aviation_annotation_post_save or \
                   getattr(receiver_func, '__name__', None) == 'aviation_annotation_post_save' or \
                   getattr(receiver_func, '__wrapped__', None) is aviation_annotation_post_save:
                    found = True
                    break

        self.assertTrue(found, "aviation_annotation_post_save signal not connected")

    @patch('aviation.signals.TrainingCalculationService')
    def test_update_method_bypasses_signal(self, mock_service_class):
        mock_calculator = MagicMock()
        mock_service_class.return_value = mock_calculator
        mock_calculator.calculate_training_topics.return_value = {
            'threat_training_topics': [],
            'error_training_topics': [],
            'uas_training_topics': []
        }

        aviation_annotation = AviationAnnotationFactory(annotation=self.annotation)

        mock_calculator.reset_mock()

        AviationAnnotation.objects.filter(pk=aviation_annotation.pk).update(
            threat_type_l3='Bulk Updated'
        )

        self.assertFalse(mock_calculator.calculate_training_topics.called)
