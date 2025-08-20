import asyncio
import json
import logging
from datetime import datetime
from typing import AsyncGenerator

from django.http import HttpRequest, HttpResponseBase, HttpResponseNotAllowed, StreamingHttpResponse
from django.urls import path

from .services import RedisClient

logger = logging.getLogger(__name__)
app_name = 'notifications'

redis_client = RedisClient()

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
        # Do any cleanup when the client disconnects
        # Note: this will only be called starting from Django 5.0; until then, there is no cleanup,
        # and you get some spammy 'took too long to shut down and was killed' log messages from Daphne etc.
        raise


def events(request: HttpRequest, event_name: str) -> HttpResponseBase:
    """Start an SSE connection for event_name"""
    print(f'event name: {event_name}')
    if request.method != 'GET':
        return HttpResponseNotAllowed(
            [
                'GET',
            ]
        )

    return StreamingHttpResponse(
        streaming_content=streamed_events(event_name, request),
        content_type='text/event-stream',
    )


# _api_urlpatterns = [
#     path('', api.NotificationsAPIList.as_view(), name='notification-list'),
#     path('<int:pk>/', api.NotificationAPI.as_view(), name='notification-detail'),
# ]


urlpatterns = [
    path('events/<str:event_name>', events, name='server-events'),
]
