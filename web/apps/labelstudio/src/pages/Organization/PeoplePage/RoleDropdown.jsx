import { useState } from "react";
import { useToast } from "@humansignal/ui";
import { Button } from "../../../components/Button/Button";
import { Dropdown } from "../../../components/Dropdown/Dropdown";
import { Menu } from "../../../components/Menu/Menu";
import { confirm } from "../../../components/Modal/Modal";
import { useAPI } from "../../../providers/ApiProvider";
import { useCurrentUser } from "../../../providers/CurrentUser";

const ROLES = ['Manager', 'Researcher', 'Annotator'];

export const RoleDropdown = ({ user, canEdit, onRoleChanged }) => {
  const api = useAPI();
  const toast = useToast();
  const { user: currentUser } = useCurrentUser();
  const [isUpdating, setIsUpdating] = useState(false);
  const currentRole = user.role || 'No Role';
  const isOwnRole = currentUser?.id === user.id;
  const isAnnotator = currentUser?.role === 'Annotator';

  const handleRoleSelect = async (newRole) => {
    if (newRole === currentRole) return;

    if (isOwnRole) {
      confirm({
        title: "Confirm Role Change",
        body: `You are about to change your own role from "${currentRole}" to "${newRole}". This may affect your permissions. Do you want to continue?`,
        okText: "Yes, Change My Role",
        buttonLook: "primary",
        onOk: async () => {
          await performRoleChange(newRole);
        },
      });
      return;
    }

    await performRoleChange(newRole);
  };

  const performRoleChange = async (newRole) => {
    const previousRole = currentRole;
    setIsUpdating(true);

    onRoleChanged?.(user.id, newRole);

    try {
      await api.callApi('assignRole', {
        params: { pk: user.id },
        body: { role: newRole }
      });

      toast.show({
        message: `Successfully assigned ${newRole} role to ${user.email}`,
        type: 'success'
      });
    } catch (error) {
      onRoleChanged?.(user.id, previousRole);

      toast.show({
        message: `Failed to assign role: ${error.message || 'Unknown error'}`,
        type: 'error'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (!canEdit || isAnnotator) {
    return <span>{currentRole}</span>;
  }

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Dropdown.Trigger content={(
        <Menu closeDropdownOnItemClick>
          {ROLES.map(role => (
            <Menu.Item
              key={role}
              onClick={() => handleRoleSelect(role)}
            >
              {role}
            </Menu.Item>
          ))}
        </Menu>
      )}>
        <Button
          size="small"
          look="outlined"
          waiting={isUpdating}
          disabled={isUpdating}
        >
          {currentRole}
        </Button>
      </Dropdown.Trigger>
    </div>
  );
};
