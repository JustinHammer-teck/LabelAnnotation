from django.db import transaction


class ExcelParserService:
    """Parse aviation incident Excel files

    TODO: Phase 2 implementation
    - parse_incidents_async() - Enqueue async job for large Excel files
    - parse_incidents() - Parse Excel synchronously for small files
    - validate_structure() - Validate Excel format compliance
    """

    def parse_incidents(self, file, project):
        """Parse Excel synchronously for small files

        TODO: Implement Excel parsing logic
        """
        raise NotImplementedError("Excel parsing not yet implemented - Phase 2")

    def validate_structure(self, file):
        """Validate Excel format compliance

        TODO: Implement Excel validation logic
        """
        raise NotImplementedError("Excel validation not yet implemented - Phase 2")


class TrainingCalculationService:
    """Calculate training recommendations based on selections

    TODO: Phase 2 implementation
    - calculate_and_update() - Auto-calculate training topics based on threat/error/UAS selections
    - get_training_for_threat() - Get training topics for threat type
    - get_training_for_error() - Get training topics for error type
    - get_training_for_uas() - Get training topics for UAS type
    """

    def calculate_and_update(self, instance):
        """Auto-calculate training topics after save

        TODO: Implement auto-calculation logic
        """
        raise NotImplementedError("Training calculation not yet implemented - Phase 2")

    def calculate_training_topics(self, instance):
        """Calculate training topics for an annotation instance

        TODO: Implement training topic calculation logic
        """
        raise NotImplementedError("Training calculation not yet implemented - Phase 2")


class ExcelExportService:
    """Generate Excel exports with annotations

    TODO: Phase 2 implementation
    - export_annotations() - Export project annotations to Excel
    - generate_template() - Generate empty Excel template
    """

    def export_annotations(self, project):
        """Export annotations to Excel

        TODO: Implement Excel export logic
        """
        raise NotImplementedError("Export not yet implemented - Phase 2")

    def generate_template(self):
        """Generate empty Excel template

        TODO: Implement template generation logic
        """
        raise NotImplementedError("Template generation not yet implemented - Phase 2")
