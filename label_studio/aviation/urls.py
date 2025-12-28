from django.urls import include, path, re_path
from rest_framework.routers import DefaultRouter

from . import api, views

app_name = 'aviation'

router = DefaultRouter()
router.register(r'projects', api.AviationProjectViewSet, basename='aviation-project')
router.register(r'events', api.AviationEventViewSet, basename='aviation-event')
router.register(r'types', api.TypeHierarchyViewSet, basename='aviation-type')
router.register(r'items', api.LabelingItemViewSet, basename='aviation-item')
router.register(r'performances', api.ResultPerformanceViewSet, basename='aviation-performance')
router.register(r'item-performances', api.LabelingItemPerformanceViewSet, basename='aviation-item-performance')

urlpatterns = [
    path('api/aviation/', include(router.urls)),
    path('api/aviation/projects/<int:pk>/import-excel/', api.AviationExcelUploadView.as_view(), name='aviation-excel-upload'),
    path('api/aviation/projects/<int:pk>/export/', api.AviationExportView.as_view(), name='aviation-export'),
    path('api/aviation/projects/<int:pk>/assignment/', api.AviationProjectAssignmentAPI.as_view(), name='aviation-project-assignment'),

    # Review System Endpoints
    path('api/aviation/items/<int:pk>/submit/', api.ItemSubmitAPI.as_view(), name='item-submit'),
    path('api/aviation/items/<int:pk>/approve/', api.ReviewApproveAPI.as_view(), name='item-approve'),
    path('api/aviation/items/<int:pk>/reject/', api.ReviewRejectAPI.as_view(), name='item-reject'),
    path('api/aviation/items/<int:pk>/revision/', api.ReviewRevisionAPI.as_view(), name='item-revision'),
    path('api/aviation/items/<int:pk>/resubmit/', api.ReviewResubmitAPI.as_view(), name='item-resubmit'),
    path('api/aviation/items/<int:pk>/review-history/', api.ReviewHistoryAPI.as_view(), name='item-review-history'),

    re_path(r'^aviation(?:/(?P<path>.*))?$', views.aviation_page, name='aviation-page'),
]
