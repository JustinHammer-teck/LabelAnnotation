from django.urls import path
from . import api

app_name = 'aviation'

urlpatterns = [
    path(
        'projects/<int:pk>/aviation/upload/',
        api.AviationExcelUploadAPI.as_view(),
        name='aviation-excel-upload'
    ),
    path(
        'projects/<int:pk>/aviation/validate/',
        api.AviationExcelValidateAPI.as_view(),
        name='aviation-excel-validate'
    ),
    path(
        'aviation/annotations/',
        api.AviationAnnotationListAPI.as_view(),
        name='aviation-annotation-list'
    ),
    path(
        'aviation/annotations/<int:pk>/',
        api.AviationAnnotationDetailAPI.as_view(),
        name='aviation-annotation-detail'
    ),
    path(
        'aviation/dropdowns/',
        api.AviationDropdownListAPI.as_view(),
        name='aviation-dropdown-list'
    ),
    path(
        'aviation/dropdowns/hierarchy/',
        api.AviationDropdownHierarchyAPI.as_view(),
        name='aviation-dropdown-hierarchy'
    ),
    path(
        'aviation/dropdowns/search/',
        api.AviationDropdownSearchAPI.as_view(),
        name='aviation-dropdown-search'
    ),
    path(
        'aviation/export/',
        api.AviationExportAPI.as_view(),
        name='aviation-export'
    ),
    path(
        'aviation/export/template/',
        api.AviationExportTemplateAPI.as_view(),
        name='aviation-export-template'
    ),
]
