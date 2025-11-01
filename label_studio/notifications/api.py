from rest_framework import generics, permissions
from .models import Notification
from .serializers import NotificationSerializer


class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        user_channel_prefix = f"{user.id}{user.email}"
        queryset = Notification.objects.filter(
            channel__startswith=user_channel_prefix
        )

        unread_only = self.request.query_params.get('unread', None)
        if unread_only and unread_only.lower() in ['true', '1']:
            queryset = queryset.filter(is_read=False)

        return queryset.order_by('-created_at')


class MarkNotificationAsReadView(generics.UpdateAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'pk'

    def get_queryset(self):
        user = self.request.user
        user_channel_prefix = f"{user.id}{user.email}"
        return Notification.objects.filter(
            channel__startswith=user_channel_prefix
        )

    def perform_update(self, serializer):
        serializer.save(is_read=True)