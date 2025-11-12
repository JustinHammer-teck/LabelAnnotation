import { useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ToastType, useToast } from '@humansignal/ui';
import { useAPI } from '../../../../providers/ApiProvider';
import { queryClient } from '../../../../utils/query-client';
import type {
  ProjectPermission,
  TogglePermissionPayload,
  TogglePermissionParams,
} from '../types/ProjectPermission';

interface UseProjectPermissionsProps {
  projectId: number;
}

interface UseProjectPermissionsReturn {
  permissions: ProjectPermission[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  togglePermission: (userId: number, currentPermission: boolean) => Promise<void>;
  isToggling: boolean;
}

const PERMISSIONS_QUERY_KEY = 'projectPermissions';

export const useProjectPermissions = ({
  projectId,
}: UseProjectPermissionsProps): UseProjectPermissionsReturn => {
  const api = useAPI();
  const toast = useToast();

  const {
    data: permissions = [],
    isLoading,
    isError,
    error,
  } = useQuery<ProjectPermission[], Error>({
    queryKey: [PERMISSIONS_QUERY_KEY, projectId],
    queryFn: async () => {
      const result = await api.callApi<ProjectPermission[]>('userPermission', {
        params: { pk: projectId },
      });

      if (!result || result.error) {
        throw new Error('Failed to fetch user permissions');
      }

      return Array.isArray(result) ? result : [];
    },
    enabled: !!projectId,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  const togglePermissionMutation = useMutation<void, Error, TogglePermissionParams>({
    mutationFn: async ({ userId, hasPermission, projectId }: TogglePermissionParams) => {
      const payload: TogglePermissionPayload = {
        users: [{ user_id: userId, has_permission: hasPermission }],
      };

      const result = await api.callApi('assignProject', {
        params: { pk: projectId },
        body: payload,
        suppressError: true,
      });

      if (!result || result.error) {
        throw new Error(result?.error || 'Failed to update permission');
      }
    },
    onMutate: async ({ userId, hasPermission }) => {
      await queryClient.cancelQueries({ queryKey: [PERMISSIONS_QUERY_KEY, projectId] });

      const previousPermissions = queryClient.getQueryData<ProjectPermission[]>([
        PERMISSIONS_QUERY_KEY,
        projectId,
      ]);

      queryClient.setQueryData<ProjectPermission[]>([PERMISSIONS_QUERY_KEY, projectId], (old = []) =>
        old.map((user) =>
          user.user_id === userId ? { ...user, has_permission: hasPermission } : user
        )
      );

      return { previousPermissions };
    },
    onError: (error, { userId }, context) => {
      if (context?.previousPermissions) {
        queryClient.setQueryData<ProjectPermission[]>(
          [PERMISSIONS_QUERY_KEY, projectId],
          context.previousPermissions
        );
      }

      toast?.show({
        message: `Failed to update permission: ${error.message}`,
        type: ToastType.error,
      });
    },
    onSuccess: (_, { userId, hasPermission }) => {
      const user = permissions.find((p) => p.user_id === userId);
      const permissionStatus = hasPermission ? 'granted' : 'revoked';

      toast?.show({
        message: `Permission ${permissionStatus} for ${user?.user_email || 'user'}`,
        type: ToastType.success,
      });
    },
  });

  const togglePermission = useCallback(
    async (userId: number, currentPermission: boolean) => {
      await togglePermissionMutation.mutateAsync({
        userId,
        hasPermission: !currentPermission,
        projectId,
      });
    },
    [togglePermissionMutation, projectId]
  );

  return {
    permissions,
    isLoading,
    isError,
    error: error as Error | null,
    togglePermission,
    isToggling: togglePermissionMutation.isPending,
  };
};
