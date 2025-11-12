export interface ProjectPermission {
  user_id: number;
  user_email: string;
  has_permission: boolean;
}

export interface TogglePermissionPayload {
  users: Array<{
    user_id: number;
    has_permission: boolean;
  }>;
}

export interface TogglePermissionParams {
  userId: number;
  hasPermission: boolean;
  projectId: number;
}
