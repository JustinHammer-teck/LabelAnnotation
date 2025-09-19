# Release v1.0.1

**Release Date**: 2025-01-18
**Type**: Bug Fix Release

## 🐛 Bug Fixes

### OCR Processing Missing in Async Reimport
**Issue**: OCR processing was not triggered for async file reimports, causing documents to import to MinIO without text extraction.

**Solution**: Added `async_reimport_with_ocr_success_handler` as RQ success callback to trigger OCR processing after successful file import.

**Files Modified**: `label_studio/data_import/api.py`

### SSE Notification System Fixes
**Issue**: Multiple critical errors preventing real-time notifications.

**Fixes Applied**:
- **Timezone Import**: Fixed `AttributeError: 'int' object has no attribute 'now'` by changing `from time import timezone` to `from django.utils import timezone`
- **Service Instantiation**: Fixed `TypeError: missing 1 required positional argument: 'self'` by properly instantiating NotificationService
- **Notification Recipients**: Corrected notifications being sent to wrong user (request_user → assign_user)
- **Frontend Null Context**: Added null checks before SSE connection creation to prevent `Cannot read property 'id' of undefined`
- **Redis PubSub**: Fixed `TypeError: PubSub.__init__() got an unexpected keyword argument 'host'`
- **Async Generator**: Made SSE events view function async to resolve `'async_generator' object is not iterable`

**Files Modified**:
- `label_studio/projects/api.py`
- `label_studio/notifications/services.py`
- `label_studio/notifications/urls.py`
- `web/apps/labelstudio/src/components/Notification/Notification.jsx`

## ✅ Impact
- OCR processing now works correctly for async reimports
- Real-time notifications function properly for project assignments
- SSE connections establish without frontend errors
- Notifications sent to correct recipients
- Consistent behavior between sync and async workflows

## 🧪 Testing Required
- Async reimport with PDF/image files → verify OCR triggering
- Project user assignment → verify notification delivery
- SSE connection stability and message delivery
- Error handling for OCR/Redis failures

## 🚀 Deployment
**Requirements**: `OCR_ENABLED=True`, Redis server running, RQ workers active
**Compatibility**: ✅ Backward compatible, no database changes required