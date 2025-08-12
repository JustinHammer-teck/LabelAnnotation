from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView


class NotificationService(APIView):
    permission_classes = [IsAuthenticated]
    required_permissions = ''
