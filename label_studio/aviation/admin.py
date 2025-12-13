from django.contrib import admin

from .models import (
    AviationEvent,
    AviationProject,
    LabelingItem,
    LabelingItemPerformance,
    ResultPerformance,
    TypeHierarchy,
)


@admin.register(AviationProject)
class AviationProjectAdmin(admin.ModelAdmin):
    list_display = ['id', 'project', 'default_workflow', 'require_uas_assessment', 'created_at']
    list_filter = ['require_uas_assessment', 'auto_calculate_training']
    search_fields = ['project__title']
    raw_id_fields = ['project']


@admin.register(AviationEvent)
class AviationEventAdmin(admin.ModelAdmin):
    list_display = ['id', 'event_number', 'date', 'airport', 'flight_phase', 'created_at']
    list_filter = ['date', 'flight_phase']
    search_fields = ['event_number', 'event_description', 'airport']
    raw_id_fields = ['task', 'file_upload']
    date_hierarchy = 'date'


@admin.register(TypeHierarchy)
class TypeHierarchyAdmin(admin.ModelAdmin):
    list_display = ['id', 'category', 'level', 'code', 'label', 'display_order', 'is_active']
    list_filter = ['category', 'level', 'is_active']
    search_fields = ['code', 'label', 'label_zh']
    raw_id_fields = ['parent']
    ordering = ['category', 'level', 'display_order']


@admin.register(LabelingItem)
class LabelingItemAdmin(admin.ModelAdmin):
    list_display = ['id', 'event', 'sequence_number', 'status', 'created_by', 'created_at']
    list_filter = ['status', 'uas_applicable']
    search_fields = ['event__event_number', 'notes']
    raw_id_fields = [
        'event', 'created_by', 'reviewed_by',
        'threat_type_l1', 'threat_type_l2', 'threat_type_l3',
        'error_type_l1', 'error_type_l2', 'error_type_l3',
        'uas_type_l1', 'uas_type_l2', 'uas_type_l3',
    ]


@admin.register(ResultPerformance)
class ResultPerformanceAdmin(admin.ModelAdmin):
    list_display = ['id', 'aviation_project', 'event_type', 'severity', 'status', 'created_at']
    list_filter = ['status', 'event_type']
    search_fields = ['training_goals', 'recommendations']
    raw_id_fields = ['aviation_project', 'created_by', 'reviewed_by']


@admin.register(LabelingItemPerformance)
class LabelingItemPerformanceAdmin(admin.ModelAdmin):
    list_display = ['id', 'labeling_item', 'result_performance', 'contribution_weight', 'created_at']
    raw_id_fields = ['labeling_item', 'result_performance']
