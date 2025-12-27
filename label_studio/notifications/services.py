import json
from functools import cache

import redis
import redis.asyncio as aredis
from django.conf import settings
from users.models import User

from .models import Notification, NotificationEventType


class RedisClient:
    __slots__ = "host"

    def __init__(self):
        self.host = settings.REDIS_URL

    @cache
    def _get_async_client(self) -> aredis.Redis:
        return aredis.from_url(self.host)

    @cache
    def _get_client(self) -> redis.Redis:
        return redis.from_url(self.host)

    def get_pubsub_client(self) -> redis.asyncio.client.PubSub:
        return self._get_async_client().pubsub()

    def publish(self, channel, message):
        self._get_client().publish(channel=channel, message=message)


class NotificationService:
    __slots__ = "redis_client"

    def __init__(self):
        self.redis_client = RedisClient()

    async def send_notification(self,
                                channel_name : str,
                                event_type: NotificationEventType,
                                subject: str,
                                message: str,
                                ts,
                                receive_user: User,
                                path: str = None,
                                action_type: str = None,
                                source: str = None):

            user_channel = receive_user.user_channel_name + "_" + channel_name

            content_data = {
                'subject': subject,
                'message': message,
                'message_time': ts.timestamp(),
            }

            if path:
                content_data['path'] = path
            if action_type:
                content_data['action_type'] = action_type

            notification = await Notification.objects.acreate(
                source=source or '',
                channel= user_channel,
                event_type= event_type,
                content=json.dumps(content_data),
            )

            context_data = {
                'id': notification.id,
                'type': 'info',
                'subject': subject,
                'message': message,
                'message_time': ts.timestamp(),
            }

            if path:
                context_data['path'] = path
            if action_type:
                context_data['action_type'] = action_type

            self.redis_client.publish(
                user_channel,
                json.dumps({
                    'context': context_data,
                }),
            )

    def send_notification_sync(self,
                               channel_name: str,
                               event_type: NotificationEventType,
                               subject: str,
                               message: str,
                               ts,
                               receive_user: User,
                               path: str = None,
                               action_type: str = None,
                               source: str = None):
        """
        Synchronous version of send_notification for use in sync contexts
        like Django REST Framework views.
        """
        user_channel = receive_user.user_channel_name + "_" + channel_name

        content_data = {
            'subject': subject,
            'message': message,
            'message_time': ts.timestamp(),
        }

        if path:
            content_data['path'] = path
        if action_type:
            content_data['action_type'] = action_type

        notification = Notification.objects.create(
            source=source or '',
            channel=user_channel,
            event_type=event_type,
            content=json.dumps(content_data),
        )

        context_data = {
            'id': notification.id,
            'type': 'info',
            'subject': subject,
            'message': message,
            'message_time': ts.timestamp(),
        }

        if path:
            context_data['path'] = path
        if action_type:
            context_data['action_type'] = action_type

        self.redis_client.publish(
            user_channel,
            json.dumps({
                'context': context_data,
            }),
        )