import logging

from core.utils.common import load_func
from core.feature_flags import flag_set
from django.conf import settings
from organizations.serializers import (
    OrganizationMemberListParamsSerializer,
)
from rest_framework import generics
from organizations import api

logger = logging.getLogger(__name__)

HasObjectPermission = load_func(settings.MEMBER_PERM)

class OrganizationMemberListAPIProxy(api.OrganizationMemberListAPI):
    def get_queryset(self):
        from django.db.models import Q

        org = generics.get_object_or_404(self.request.user.organizations, pk=self.kwargs[self.lookup_field])

        if flag_set('fix_backend_dev_3134_exclude_deactivated_users', self.request.user):
            serializer = OrganizationMemberListParamsSerializer(data=self.request.GET)
            serializer.is_valid(raise_exception=True)
            active = serializer.validated_data.get('active')

            if active:
                queryset = org.active_members
            else:
                queryset = org.members
        else:
            queryset = org.members

        requesting_user_groups = set(self.request.user.groups.values_list('name', flat=True))
        requesting_user_role = None

        if 'Manager' in requesting_user_groups:
            requesting_user_role = 'Manager'
        elif 'Researcher' in requesting_user_groups:
            requesting_user_role = 'Researcher'
        elif 'Annotator' in requesting_user_groups:
            requesting_user_role = 'Annotator'

        if requesting_user_role is None:
            queryset = queryset.filter(user__groups__isnull=True)
        elif requesting_user_role == 'Annotator':
            queryset = queryset.filter(
                Q(user__groups__name='Annotator') | Q(user__groups__isnull=True)
            ).distinct()
        elif requesting_user_role == 'Researcher':
            queryset = queryset.filter(
                Q(user__groups__name='Researcher') |
                Q(user__groups__name='Annotator') |
                Q(user__groups__isnull=True)
            ).distinct()
        elif requesting_user_role == 'Manager':
            pass

        return queryset.select_related('user').prefetch_related('user__groups').order_by('user__username')




