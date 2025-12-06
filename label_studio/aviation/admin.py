from django.contrib import admin
from .models import AviationProject, AviationIncident, AviationAnnotation, AviationDropdownOption


@admin.register(AviationProject)
class AviationProjectAdmin(admin.ModelAdmin):
    list_display = ['id', 'project', 'created_at']
    list_filter = ['created_at']
    search_fields = ['project__title']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(AviationIncident)
class AviationIncidentAdmin(admin.ModelAdmin):
    list_display = ['event_number', 'date', 'airport', 'flight_phase']
    list_filter = ['date', 'airport', 'flight_phase']
    search_fields = ['event_number', 'event_description', 'location']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'date'


@admin.register(AviationAnnotation)
class AviationAnnotationAdmin(admin.ModelAdmin):
    list_display = ['id', 'annotation', 'threat_type_l1', 'error_type_l1', 'created_at']
    list_filter = ['threat_type_l1', 'error_type_l1', 'uas_type_l1', 'created_at']
    search_fields = ['threat_description', 'error_description', 'notes']
    readonly_fields = [
        'created_at',
        'updated_at',
        'threat_training_topics',
        'error_training_topics',
        'uas_training_topics'
    ]
    fieldsets = (
        ('Basic Info', {
            'fields': ('annotation', 'aircraft_type', 'event_labels')
        }),
        ('Threat Identification', {
            'fields': (
                'threat_type_l1', 'threat_type_l2', 'threat_type_l3',
                'threat_management', 'threat_outcome', 'threat_description',
                'threat_training_topics'
            )
        }),
        ('Error Identification', {
            'fields': (
                'error_relevancy', 'error_type_l1', 'error_type_l2', 'error_type_l3',
                'error_management', 'error_outcome', 'error_description',
                'error_training_topics'
            )
        }),
        ('UAS Identification', {
            'fields': (
                'uas_relevancy', 'uas_type_l1', 'uas_type_l2', 'uas_type_l3',
                'uas_management', 'uas_description', 'uas_training_topics'
            )
        }),
        ('Training & Competency', {
            'fields': (
                'competency_indicators', 'likelihood', 'severity',
                'training_benefit', 'competency_selections',
                'training_plan_ideas', 'goals_to_achieve'
            )
        }),
        ('Metadata', {
            'fields': ('notes', 'created_at', 'updated_at')
        }),
    )


@admin.register(AviationDropdownOption)
class AviationDropdownOptionAdmin(admin.ModelAdmin):
    list_display = ['category', 'level', 'code', 'label', 'parent', 'display_order', 'is_active']
    list_filter = ['category', 'level', 'is_active']
    search_fields = ['code', 'label']
    list_editable = ['display_order', 'is_active']
    ordering = ['category', 'level', 'display_order']
