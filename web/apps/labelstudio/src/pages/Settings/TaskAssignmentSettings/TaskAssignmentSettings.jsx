import { Block, Elem } from "../../../utils/bem";
import {Toggle} from "../../../components/Form";
import {useAPI} from "../../../providers/ApiProvider";
import React, {useCallback, useContext, useEffect, useState} from "react";
import {ProjectContext} from "../../../providers/ProjectProvider";
import {useCurrentUser} from "../../../providers/CurrentUser";
import {Spinner, ToastType, useToast} from "@humansignal/ui";

export const TaskAssignmentSettings = () => {
  const { project } = useContext(ProjectContext);
  const { user } = useCurrentUser();
  const api = useAPI()
  const [users, setUsers] = useState([]);
  const [changes, setChanges] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState(null);

  const fetchPermissions = async (project_id) => {
    setIsLoading(true);
    const result = await api.callApi("userPermission", {
      params: { pk: project_id },
    });

    if (result && Array.isArray(result)) {
      setUsers(result);
    } else {
      setUsers([]);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchPermissions(project.id);
  }, [project.id]);

  const togglePermission = async (userId, current) => {
    const newPermission = !current;

    setUsers((prev) =>
      prev.map((u) =>
        u.user_id === userId ? { ...u, has_permission: newPermission } : u,
      ),
    );
    setUpdatingUserId(userId);

    const payload = {
      users: [{ user_id: userId, has_permission: newPermission }],
    };

    try {
      await api.callApi("assignProject", {
        params: { pk: project.id },
        body: payload
      });

      fetchPermissions(project.id);

      setUpdatingUserId(null);
    } catch (error) {
      console.log("something when wrong ")
      setUsers((prev) =>
        prev.map((u) =>
          u.user_id === userId ? { ...u, has_permission: current } : u,
        ),
      );
    }
  };

  return (
    <Block name="annotation-settings">
      <Elem name={"wrapper"}>
        <h1>Task Assignment Settings</h1>
          <Block name="settings-wrapper">
            <Elem name={"header"}>User Permissions</Elem>
            {isLoading ? (
              <div className="h-64 flex justify-center items-center">
                <Spinner />
              </div> )
              :
              <div>
                 <table className="w-full border">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="text-left p-2">Email</th>
                      <th className="text-left p-2">Has Permission</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => {
                      const current = changes.hasOwnProperty(user.user_id)
                        ? changes[user.user_id]
                        : user.has_permission;

                      return (
                        <tr key={user.user_id} className="border-t">
                          <td className="p-2">{user.user_email}</td>
                          <td className="p-2">
                            <Toggle
                              checked={current}
                              onChange={() => togglePermission(user.user_id, current)}
                              label={null}
                              name={`user-${user.user_id}`}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            }
          </Block>
      </Elem>
    </Block>
  );
};

TaskAssignmentSettings.title = "Task Assignment Settings";
TaskAssignmentSettings.path = "/taskassign";
