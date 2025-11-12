"""This file and its contents are licensed under the Apache License 2.0. Please see the included NOTICE for copyright information and LICENSE for a copy of the license.
"""
from core.utils.common import load_func
from core.utils.db import fast_first
from django.conf import settings
from organizations.models import OrganizationMember
from rest_flex_fields import FlexFieldsModelSerializer
from rest_framework import serializers

from .models import User


class BaseUserSerializer(FlexFieldsModelSerializer):
    # short form for user presentation
    initials = serializers.SerializerMethodField(default='?', read_only=True)
    avatar = serializers.SerializerMethodField(read_only=True)
    active_organization_meta = serializers.SerializerMethodField(read_only=True)

    def get_avatar(self, instance):
        return instance.avatar_url

    def get_initials(self, instance):
        return instance.get_initials(self._is_deleted(instance))

    def get_active_organization_meta(self, instance):
        organization = instance.active_organization
        if organization is None:
            return {'title': '', 'email': ''}

        title = organization.title
        email = ''

        if organization.created_by is not None and organization.created_by.email is not None:
            email = organization.created_by.email

        return {'title': title, 'email': email}

    def _is_deleted(self, instance):
        if 'deleted_organization_members' in self.context:
            organization_members = self.context.get('deleted_organization_members', None)
            return instance.id in organization_members

        if organization_members := self.context.get('organization_members', None):
            # Finds the first organization_member matching the instance's id. If not found, set to None.
            organization_member_for_user = next(
                (
                    organization_member
                    for organization_member in organization_members
                    if organization_member.user_id == instance.id
                ),
                None,
            )
        else:
            if 'user' in self.context:
                org_id = self.context['user'].active_organization_id
            elif 'request' in self.context:
                org_id = self.context['request'].user.active_organization_id
            else:
                org_id = None

            if not org_id:
                return False

            organization_member_for_user = fast_first(
                OrganizationMember.objects.filter(user_id=instance.id, organization_id=org_id)
            )
            if not organization_member_for_user:
                return True
        return bool(organization_member_for_user.deleted_at)

    def to_representation(self, instance):
        """Returns user with cache, this helps to avoid multiple s3/gcs links resolving for avatars"""

        uid = instance.id
        key = 'user_cache'

        if key not in self.context:
            self.context[key] = {}
        if uid not in self.context[key]:
            self.context[key][uid] = super().to_representation(instance)

        if self._is_deleted(instance):
            for field in ['username', 'first_name', 'last_name', 'email']:
                self.context[key][uid][field] = 'User' if field == 'last_name' else 'Deleted'

        return self.context[key][uid]

    class Meta:
        model = User
        fields = (
            'id',
            'first_name',
            'last_name',
            'username',
            'email',
            'last_activity',
            'avatar',
            'initials',
            'phone',
            'active_organization',
            'active_organization_meta',
            'allow_newsletters',
            'date_joined',
        )


class BaseUserSerializerUpdate(BaseUserSerializer):
    class Meta(BaseUserSerializer.Meta):
        read_only_fields = ('email',)


class UserSimpleSerializer(BaseUserSerializer):
    class Meta:
        model = User
        fields = ('id', 'first_name', 'last_name', 'email', 'avatar')

class UserWithPermissionSerializer(serializers.ModelSerializer):
    has_view_permission = serializers.BooleanField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'has_view_permission']


class UserWithPermissionsSerializer(BaseUserSerializer):
    permissions = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()

    def get_permissions(self, user):
        from core.permissions import all_permissions

        permissions_list = []
        for permission_name in all_permissions.model_fields.keys():
            permission_value = getattr(all_permissions, permission_name)
            if user.has_perm(permission_value):
                permissions_list.append(permission_value)

        return permissions_list

    def get_role(self, user):
        from core.permissions import annotator_permissions, researcher_permissions, manager_permissions

        user_permissions = set(self.get_permissions(user))

        if manager_permissions.issubset(user_permissions):
            return 'Manager'
        elif researcher_permissions.issubset(user_permissions):
            return 'Researcher'
        elif annotator_permissions.issubset(user_permissions):
            return 'Annotator'

        return None

    class Meta(BaseUserSerializer.Meta):
        fields = BaseUserSerializer.Meta.fields + ('permissions', 'role')


class RoleAssignmentSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=['Annotator', 'Researcher', 'Manager'], required=True)

    def validate_role(self, value):
        from django.contrib.auth.models import Group

        if not Group.objects.filter(name=value).exists():
            raise serializers.ValidationError(f"Role group '{value}' does not exist")
        return value


UserSerializer = load_func(settings.USER_SERIALIZER)
UserSerializerUpdate = load_func(settings.USER_SERIALIZER_UPDATE)
