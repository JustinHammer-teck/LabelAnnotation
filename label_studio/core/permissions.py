"""This file and its contents are licensed under the Apache License 2.0. Please see the included NOTICE for copyright information and LICENSE for a copy of the license.
"""
import logging   # noqa: I001
from typing import Optional

from pydantic import BaseModel, ConfigDict

import rules

logger = logging.getLogger(__name__)


class AllPermissions(BaseModel):
    model_config = ConfigDict(protected_namespaces=('__.*__', '_.*'))

    organizations_create: str = 'organizations.create'
    organizations_view: str = 'organizations.view'
    organizations_change: str = 'organizations.change'
    organizations_delete: str = 'organizations.delete'
    organizations_invite: str = 'organizations.invite'
    projects_create: str = 'projects.create'
    projects_view: str = 'projects.view'
    projects_change: str = 'projects.change'
    projects_delete: str = 'projects.delete'
    tasks_create: str = 'tasks.create'
    tasks_view: str = 'tasks.view'
    tasks_change: str = 'tasks.change'
    tasks_delete: str = 'tasks.delete'
    annotations_create: str = 'annotations.create'
    annotations_view: str = 'annotations.view'
    annotations_change: str = 'annotations.change'
    annotations_delete: str = 'annotations.delete'
    actions_perform: str = 'actions.perform'
    predictions_any: str = 'predictions.any'
    avatar_any: str = 'avatar.any'
    labels_create: str = 'labels.create'
    labels_view: str = 'labels.view'
    labels_change: str = 'labels.change'
    labels_delete: str = 'labels.delete'
    models_create: str = 'models.create'
    models_view: str = 'models.view'
    models_change: str = 'models.change'
    models_delete: str = 'models.delete'
    model_provider_connection_create: str = 'model_provider_connection.create'
    model_provider_connection_view: str = 'model_provider_connection.view'
    model_provider_connection_change: str = 'model_provider_connection.change'
    model_provider_connection_delete: str = 'model_provider_connection.delete'
    webhooks_view: str = 'webhooks.view'
    webhooks_change: str = 'webhooks.change'


all_permissions = AllPermissions()


class ViewClassPermission(BaseModel):
    GET: Optional[str] = None
    PATCH: Optional[str] = None
    PUT: Optional[str] = None
    DELETE: Optional[str] = None
    POST: Optional[str] = None


def make_perm(name, pred, overwrite=False):
    if rules.perm_exists(name):
        if overwrite:
            rules.remove_perm(name)
        else:
            return
    rules.add_perm(name, pred)

# Predicates for each role
is_annotator = rules.is_group_member('Annotator')
is_researcher = rules.is_group_member('Researcher')
is_manager = rules.is_group_member('Manager')

# Role definitions with permission inheritance
# Annotator permissions
annotator_permissions = {
    all_permissions.tasks_view,
    all_permissions.annotations_create,
    all_permissions.annotations_view,
    all_permissions.annotations_change,
    all_permissions.annotations_delete,
}

# Researcher permissions inherit from Annotator
researcher_permissions = annotator_permissions.union({
    all_permissions.labels_view,
    all_permissions.labels_change,
    all_permissions.labels_delete,
    all_permissions.models_view,
    all_permissions.model_provider_connection_view,
    all_permissions.predictions_any,
})

# Manager permissions inherit from Researcher
manager_permissions = researcher_permissions.union({
    all_permissions.organizations_create,
    all_permissions.organizations_view,
    all_permissions.organizations_change,
    all_permissions.organizations_delete,
    all_permissions.organizations_invite,
    all_permissions.projects_create,
    all_permissions.projects_change,
    all_permissions.projects_delete,
    all_permissions.tasks_create,
    all_permissions.tasks_change,
    all_permissions.tasks_delete,
    all_permissions.actions_perform,
    all_permissions.avatar_any,
    all_permissions.labels_create,
    all_permissions.models_create,
    all_permissions.models_change,
    all_permissions.models_delete,
    all_permissions.model_provider_connection_create,
    all_permissions.model_provider_connection_change,
    all_permissions.model_provider_connection_delete,
    all_permissions.webhooks_view,
    all_permissions.webhooks_change,
})

# Assign permissions to roles
for permission_name in all_permissions:
    if permission_name[1] in manager_permissions:
        make_perm(permission_name[1], is_manager | is_researcher | is_annotator)
    elif permission_name[1] in researcher_permissions:
        make_perm(permission_name[1], is_researcher | is_annotator)
    elif permission_name[1] in annotator_permissions:
        make_perm(permission_name[1], is_annotator)
    else:
        # Default to authenticated user for any permissions not explicitly assigned to a role
        make_perm(permission_name[1], rules.is_authenticated)