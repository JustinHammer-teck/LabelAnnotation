# ASGI Migration Plan for SSE Support in Label Studio

## Executive Summary

Label Studio currently has Server-Sent Events (SSE) implementation in the notifications system (`label_studio/notifications/`) but is running on WSGI/uWSGI, which doesn't properly support async operations and long-lived connections required for SSE. This plan outlines the migration to ASGI to enable full SSE functionality for real-time notifications in OCR labeling workflows.

**Important Note: This is SSE-only implementation. No WebSockets are needed, which significantly simplifies the migration.**

## Current State Analysis

### Existing SSE Implementation
- **Location**: `label_studio/notifications/`
- **Components**:
  - SSE endpoint: `/events/<event_name>` in `urls.py`
  - Async streaming function: `streamed_events()`
  - Redis pub/sub integration: `RedisClient` class
  - Notification service: `NotificationService`

### Current WSGI Setup
- **Server**: uWSGI (`deploy/uwsgi.ini`)
- **Application**: WSGI via `core.wsgi:application`
- **Processes**: 4 worker processes (default)
- **Limitations**: Cannot handle async operations or long-lived connections

### ASGI Foundation Already Present
- **ASGI app**: `label_studio/core/asgi.py` (basic setup - perfect for SSE)
- **Dependencies**: Daphne 4.2.1+ already included in `pyproject.toml` (this is all we need!)
- **Redis**: Already configured for pub/sub operations
- **SSE Code**: Already ASGI-ready with async/await syntax

## Migration Strategy

### Phase 1: ASGI Infrastructure Setup (Simplified)

#### 1.1 ASGI Configuration (No Changes Needed!)
**File**: `label_studio/core/asgi.py` - **ALREADY PERFECT**

```python
import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

application = get_asgi_application()
```

**Why this works**: For SSE, we only need standard ASGI HTTP handling. No WebSocket routing required!

#### 1.2 Dependencies (Already Present!)
**File**: `pyproject.toml` - **NO CHANGES NEEDED**

```toml
# This line already exists and is all we need:
"daphne (>=4.2.1,<5.0.0)"

# We DON'T need:
# ❌ channels
# ❌ channels-redis
# ❌ WebSocket libraries
```

#### 1.3 Settings Configuration (Minimal)
**File**: `label_studio/core/settings/base.py`

```python
# ONLY add this line:
ASGI_APPLICATION = 'core.asgi.application'

# Optional SSE Configuration
SSE_HEARTBEAT_INTERVAL = 30  # Send heartbeat every 30 seconds
SSE_CONNECTION_TIMEOUT = 300  # 5 minutes timeout

# We DON'T need:
# ❌ CHANNEL_LAYERS
# ❌ channels in INSTALLED_APPS
# ❌ WebSocket routing
```

### Phase 2: Docker Build Modifications (Simplified)

#### 2.1 Simplified Dockerfile.asgi
**File**: `Dockerfile.asgi`

```dockerfile
# Same as existing Dockerfile until the final CMD
# Just replace uWSGI with Daphne - that's it!

FROM python:3.12-slim AS production

# ... (copy ALL existing production stage setup - no changes until CMD)

ENV LS_DIR=/label-studio \
    HOME=/label-studio \
    LABEL_STUDIO_BASE_DATA_DIR=/label-studio/data \
    OPT_DIR=/opt/heartex/instance-data/etc \
    PATH="/label-studio/.venv/bin:$PATH" \
    DJANGO_SETTINGS_MODULE=core.settings.label_studio \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# ... (all existing setup remains the same)

USER 1001
EXPOSE 8080

ENTRYPOINT ["./deploy/docker-entrypoint.sh"]
# ONLY change: replace uWSGI with Daphne
CMD ["daphne", "-b", "0.0.0.0", "-p", "8080", "--access-log", "-", "--proxy-headers", "core.asgi:application"]
```

**Key Point**: This is almost identical to your existing Dockerfile - we just change the final CMD from uWSGI to Daphne!

#### 2.2 Nginx Configuration (Minor Updates)
**File**: `deploy/default.conf` (update existing file)

```nginx
# Update existing upstream to point to Daphne instead of uWSGI
upstream app {
    server 127.0.0.1:8080;  # Daphne running on 8080
}

server {
    listen 8080;
    server_name _;

    # SSE specific configuration - ADD this location block
    location /api/notifications/events/ {
        proxy_pass http://app;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # SSE specific headers (NO WebSocket headers needed!)
        proxy_cache off;
        proxy_buffering off;
        proxy_read_timeout 24h;
        proxy_send_timeout 24h;

        # Essential for SSE
        add_header Cache-Control "no-cache";
        add_header X-Accel-Buffering "no";
    }

    # All other locations remain the same
    location / {
        proxy_pass http://app;
        # ... existing configuration
    }
}
```

**Note**: You might not even need a separate nginx config file - just update the existing `deploy/default.conf` with the SSE-specific location block.

#### 2.3 Docker Entrypoint (Minor Update)
**File**: `deploy/docker-entrypoint.sh` (update existing file)

```bash
#!/bin/bash
set -e ${DEBUG:+-x}

# Keep all existing logic...
source_inject_envvars() {
  # ... (existing code)
}

exec_or_wrap_n_exec() {
  # ... (existing code)
}

# ADD support for daphne command
if [ "$1" = "nginx" ]; then
  # ... (existing nginx logic)
elif [ "$1" = "label-studio-uwsgi" ]; then
  # ... (existing uwsgi logic)
elif [ "$1" = "label-studio-migrate" ]; then
  # ... (existing migrate logic)
elif [ "$1" = "daphne" ]; then
  # NEW: Add Daphne support
  exec_entrypoint "$ENTRYPOINT_PATH/app/"
  exec_or_wrap_n_exec daphne -b 0.0.0.0 -p 8080 --access-log - --proxy-headers core.asgi:application
else
  exec_or_wrap_n_exec "$@"
fi
```

**Alternative**: You might not need a separate entrypoint file. The existing one might work fine with the Daphne CMD.

### Phase 3: SSE Code Review (Already Perfect!)

#### 3.1 Current SSE Implementation Analysis
**File**: `label_studio/notifications/urls.py` - **NO CHANGES NEEDED**

Your existing SSE implementation is already ASGI-ready:

```python
# This code is ALREADY perfect for ASGI!
async def streamed_events(event_name: str, request: HttpRequest) -> AsyncGenerator[str, None]:
    """Listen for events and generate an SSE message for each event"""
    try:
        async with redis_client.get_pubsub_client() as pubsub:
            await pubsub.subscribe(event_name)
            while True:
                msg = await pubsub.get_message(ignore_subscribe_messages=True, timeout=None)
                if msg is None:
                    continue

                data = json.loads(msg['data'])
                ctx = data['context']
                msg_time = datetime.fromtimestamp(ctx['message_time']).isoformat().__str__()
                ctx['message_time'] = msg_time

                yield f'data: {json.dumps(ctx)}\n\n'
    except asyncio.CancelledError:
        raise

def events(request: HttpRequest, event_name: str) -> HttpResponseBase:
    """Start an SSE connection for event_name"""
    if request.method != 'GET':
        return HttpResponseNotAllowed(['GET'])

    return StreamingHttpResponse(
        streaming_content=streamed_events(event_name, request),
        content_type='text/event-stream',
    )
```

**Why this works perfectly**:
- ✅ Uses `async def` and `AsyncGenerator`
- ✅ Proper `StreamingHttpResponse` with `text/event-stream`
- ✅ Redis pub/sub with async client
- ✅ Correct SSE format: `data: ...\n\n`
- ✅ Handles `asyncio.CancelledError` for cleanup

#### 3.2 Optional Enhancements (Not Required)
If you want to add improvements later:
- Add authentication with `@login_required`
- Add heartbeat mechanism for long connections
- Add better error handling and logging
- Add connection timeout handling

#### 3.2 OCR-Specific Notification Events
**File**: `label_studio/notifications/ocr_events.py`

```python
from enum import Enum
from .services import NotificationService
from django.utils import timezone

class OCREventType(Enum):
    TASK_ASSIGNED = "ocr.task.assigned"
    ANNOTATION_STARTED = "ocr.annotation.started"
    ANNOTATION_COMPLETED = "ocr.annotation.completed"
    BATCH_PROCESSED = "ocr.batch.processed"
    ERROR_OCCURRED = "ocr.error.occurred"

class OCRNotificationService(NotificationService):
    """OCR-specific notification service"""

    async def notify_task_assigned(self, user_id: int, task_id: int, document_name: str):
        await self.send_notification(
            channel=f"user_{user_id}",
            event_type=OCREventType.TASK_ASSIGNED.value,
            subject="New OCR Task Assigned",
            message=f"Document '{document_name}' assigned for annotation",
            ts=timezone.now(),
            user=user_id
        )

    async def notify_annotation_progress(self, user_id: int, task_id: int, progress: dict):
        await self.send_notification(
            channel=f"user_{user_id}",
            event_type=OCREventType.ANNOTATION_STARTED.value,
            subject="OCR Annotation Progress",
            message=f"Task {task_id}: {progress['regions_completed']}/{progress['total_regions']} regions completed",
            ts=timezone.now(),
            user=user_id
        )
```

### Phase 4: Infrastructure Changes

#### 4.1 Docker Compose Updates
**File**: `docker-compose.asgi.yml`

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.asgi
    ports:
      - "8080:8080"
    environment:
      - DJANGO_DB=default
      - REDIS_HOST=redis://redis:6379/0
      - DJANGO_SETTINGS_MODULE=core.settings.label_studio
    depends_on:
      - redis
      - postgres
    volumes:
      - ./data:/label-studio/data
    command: ["supervisord", "-c", "/etc/supervisor/supervisord.conf"]

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=labelstudio
      - POSTGRES_USER=labelstudio
      - POSTGRES_PASSWORD=labelstudio
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  redis_data:
  postgres_data:
```

#### 4.2 Build Script Modifications
**File**: `scripts/build_docker_asgi.sh`

```bash
#!/bin/bash
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

if bash ${SCRIPT_DIR}/../deploy/prebuild.sh; then
  docker build -f Dockerfile.asgi -t heartexlabs/label-studio:asgi ${SCRIPT_DIR}/..
fi
```

### Phase 5: Migration Strategy

#### 5.1 Staged Rollout Plan

**Stage 1: Development Environment**
1. Build ASGI-enabled development image
2. Test SSE functionality locally
3. Validate notification system
4. Performance testing with concurrent connections

**Stage 2: Testing Environment**
1. Deploy ASGI version to staging
2. Load testing with multiple SSE connections
3. Integration testing with OCR workflows
4. Monitoring and logging validation

**Stage 3: Production Deployment**
1. Blue-green deployment strategy
2. Gradual traffic migration
3. Monitoring for connection stability
4. Rollback plan if issues arise

#### 5.2 Compatibility Considerations

**Backward Compatibility**:
- All existing WSGI endpoints remain functional
- REST API unchanged
- Database schema compatible
- Frontend requires no immediate changes

**Performance Considerations**:
- ASGI handles both sync and async views
- Connection pooling for Redis
- Memory usage monitoring for long-lived connections
- Horizontal scaling with Redis cluster

### Phase 6: Monitoring and Observability

#### 6.1 Metrics to Track
```python
# Custom metrics for SSE monitoring
SSE_ACTIVE_CONNECTIONS = Counter('sse_active_connections_total')
SSE_MESSAGES_SENT = Counter('sse_messages_sent_total')
SSE_CONNECTION_DURATION = Histogram('sse_connection_duration_seconds')
SSE_ERRORS = Counter('sse_errors_total')
```

#### 6.2 Health Checks
**File**: `label_studio/core/health.py`

```python
async def sse_health_check():
    """Health check for SSE infrastructure"""
    try:
        redis_client = RedisClient()
        await redis_client._get_async_client().ping()
        return {"sse": "healthy", "redis": "connected"}
    except Exception as e:
        return {"sse": "unhealthy", "error": str(e)}
```

## Simplified Implementation Timeline

### Day 1: Create ASGI Dockerfile
- [ ] Copy existing Dockerfile to Dockerfile.asgi
- [ ] Change final CMD from uWSGI to Daphne
- [ ] Add ASGI_APPLICATION setting to base.py

### Day 2: Test Locally
- [ ] Build ASGI image: `docker build -f Dockerfile.asgi -t ls:asgi .`
- [ ] Test SSE endpoint works: `curl -N http://localhost:8080/api/notifications/events/test`
- [ ] Verify existing functionality still works

### Day 3: Nginx Configuration
- [ ] Update `deploy/default.conf` with SSE location block
- [ ] Test with nginx proxy in front
- [ ] Verify SSE streaming works through nginx

### Day 4: Production Testing
- [ ] Deploy to staging environment
- [ ] Load test with multiple SSE connections
- [ ] Monitor for connection stability and performance

## Benefits for OCR Workflows

1. **Real-time Progress Updates**: Users get immediate feedback on OCR processing status
2. **Collaborative Annotation**: Multiple annotators can see real-time updates on shared documents
3. **System Notifications**: Instant alerts for batch processing completion, errors, or task assignments
4. **Improved User Experience**: No need for page refreshes to see updates
5. **Efficient Resource Usage**: Long-lived connections reduce server load compared to polling

## Risk Mitigation

1. **Connection Management**: Implement connection limits and cleanup
2. **Memory Usage**: Monitor for memory leaks in long-lived connections
3. **Redis Scaling**: Plan for Redis clustering if connection load increases
4. **Fallback Strategy**: Keep REST polling as backup for SSE failures
5. **Gradual Migration**: Maintain WSGI compatibility during transition

## Summary: Why This Migration is Simple

### What Makes This Easy
1. **SSE Code Already Perfect**: Your existing `notifications/urls.py` needs zero changes
2. **Dependencies Already Present**: Daphne is already in `pyproject.toml`
3. **ASGI App Already Exists**: `core/asgi.py` is already perfect for SSE
4. **Minimal Docker Changes**: Just swap uWSGI → Daphne in the CMD
5. **No New Libraries Needed**: No channels, no WebSockets, no complex routing

### What You're NOT Doing
- ❌ Adding WebSocket support
- ❌ Installing channels/channels-redis
- ❌ Complex ASGI routing configuration
- ❌ Rewriting existing SSE code
- ❌ Major infrastructure changes

### What You ARE Doing
- ✅ Changing Dockerfile CMD: `uwsgi` → `daphne`
- ✅ Adding one settings line: `ASGI_APPLICATION = 'core.asgi.application'`
- ✅ Updating nginx config for SSE buffering
- ✅ Testing that SSE works properly under load

### The Bottom Line
This is essentially a **server swap** (uWSGI → Daphne) rather than a major architectural change. Your existing SSE implementation is already ASGI-ready and will work immediately with Daphne.

**Estimated effort**: 1-2 days for implementation, 1-2 days for testing.

This approach provides robust SSE functionality for OCR workflows while maintaining full compatibility and simplicity.
