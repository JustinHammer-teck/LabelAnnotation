import React, { useContext } from 'react';
import { Spinner } from '@humansignal/ui';
import { Block, Elem } from '../../../utils/bem';
import { Toggle } from '../../../components/Form';
import { ProjectContext } from '../../../providers/ProjectProvider';
import { useCurrentUser } from '../../../providers/CurrentUser';
import { useProjectPermissions } from './hooks/useProjectPermissions';

export const TaskAssignmentSettings: React.FC = () => {
  const { project } = useContext(ProjectContext);
  const { user } = useCurrentUser();
  const { permissions, isLoading, togglePermission, isToggling } = useProjectPermissions({
    projectId: project.id,
  });

  const handleTogglePermission = (userId: number, currentPermission: boolean) => {
    void togglePermission(userId, currentPermission);
  };

  return (
    <Block name="annotation-settings">
      <Elem name="wrapper">
        <h1>Task Assignment Settings</h1>
        <Block name="settings-wrapper">
          <Elem name="header">User Permissions</Elem>
          {isLoading ? (
            <div className="h-64 flex justify-center items-center">
              <Spinner />
            </div>
          ) : (
            <div>
              <table className="w-full border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">Has Permission</th>
                  </tr>
                </thead>
                <tbody>
                  {permissions.map((permissionUser) => {
                    const isCurrentUser = permissionUser.user_id === user?.id;
                    const isDisabled = isToggling || (isCurrentUser && permissionUser.has_permission);

                    return (
                      <tr key={permissionUser.user_id} className="border-t">
                        <td className="p-2">
                          {permissionUser.user_email}
                          {isCurrentUser && <span className="text-gray-500 text-sm ml-2">(You)</span>}
                        </td>
                        <td className="p-2">
                          <Toggle
                            checked={permissionUser.has_permission}
                            onChange={() => handleTogglePermission(permissionUser.user_id, permissionUser.has_permission)}
                            label={null}
                            name={`user-${permissionUser.user_id}`}
                            disabled={isDisabled}
                            aria-label={
                              isCurrentUser && permissionUser.has_permission
                                ? `Cannot remove your own permission`
                                : `Toggle permission for ${permissionUser.user_email}`
                            }
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Block>
      </Elem>
    </Block>
  );
};

TaskAssignmentSettings.title = 'Task Assignment Settings';
TaskAssignmentSettings.path = '/task-assign';
