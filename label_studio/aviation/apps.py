from django.apps import AppConfig


class AviationConfig(AppConfig):
    name = 'aviation'
    verbose_name = 'Aviation Safety Event Annotation'

    def ready(self):
        from . import signals
