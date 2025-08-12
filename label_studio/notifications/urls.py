import asyncio
import json
import logging
from datetime import datetime
from functools import cache
from typing import AsyncGenerator

import redis
import redis.asyncio as aredis
from django.conf import settings
from django.http import HttpRequest, HttpResponseBase, HttpResponseNotAllowed, StreamingHttpResponse
from django.urls import path

logger = logging.getLogger(__name__)
app_name = 'notifications'


@cache
def get_async_client() -> aredis.Redis:
    return aredis.from_url(settings.REDIS_HOST)


@cache
def get_client() -> redis.Redis:
    return redis.from_url(settings.REDIS_HOST)


def send_notification(
    event: str,
    subject: str,
    message: str,
    ts: datetime,
):
    logging.debug(f'received event {events}')

    get_client().publish(
        event,
        json.dumps(
            {
                'context': {
                    'type': 'info',
                    'subject': subject,
                    'message': message,
                    'message_time': ts.timestamp(),
                },
            }
        ),
    )


## Async Event Listener from REDIS pub/sub
async def streamed_events(event_name: str, request: HttpRequest) -> AsyncGenerator[str, None]:
    """Listen for events and generate an SSE message for each event"""
    try:
        async with get_async_client().pubsub() as pubsub:
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

urlpatterns = [
    path('events/<str:event_name>', events, name='server-events'),
]
