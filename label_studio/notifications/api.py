# from .models import NotificationStatus
# from .serializers import NotificationStatusSerializer
#
#
# class NotificationListView(generics.ListAPIView):
#     """
#     API view to retrieve a list of notifications for the authenticated user.
#     """
#
#     serializer_class = NotificationStatusSerializer
#     permission_classes = [permissions.IsAuthenticated]
#
#     def get_queryset(self):
#         """
#         This view should return a list of all the notifications
#         for the currently authenticated user.
#         """
#         user = self.request.user
#         return (
#             NotificationStatus.objects.filter(user=user)
#             .select_related('notification')
#             .order_by('-notification__created_at')
#         )
#
#
# class MarkNotificationAsReadView(generics.UpdateAPIView):
#     """
#     API view to mark a specific notification as read.
#     """
#
#     serializer_class = NotificationStatusSerializer
#     permission_classes = [permissions.IsAuthenticated]
#     lookup_field = 'notification_id'
#
#     def get_queryset(self):
#         """
#         Ensure that the user can only mark their own notifications as read.
#         """
#         return NotificationStatus.objects.filter(user=self.request.user)
#
#     def perform_update(self, serializer):
#         serializer.save(is_read=True)
