from core.models import ActivityLog
from users.models import User


class AuditLogService:
    @staticmethod
    def create(user: User, action: str):
        activity_log = ActivityLog(user=user, action=action)
        activity_log.save()
