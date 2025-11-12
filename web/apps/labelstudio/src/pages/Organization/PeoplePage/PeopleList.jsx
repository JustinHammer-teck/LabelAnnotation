import { formatDistance } from "date-fns";
import { useCallback, useEffect, useState } from "react";
import { Userpic } from "@humansignal/ui";
import { Pagination, Spinner } from "../../../components";
import { usePage, usePageSize } from "../../../components/Pagination/Pagination";
import { useAPI } from "../../../providers/ApiProvider";
import { Block, Elem } from "../../../utils/bem";
import { isDefined } from "../../../utils/helpers";
import "./PeopleList.scss";
import { CopyableTooltip } from "../../../components/CopyableTooltip/CopyableTooltip";
import { useUserRole } from "../../../hooks/useUserRole";
import { RoleDropdown } from "./RoleDropdown";

export const PeopleList = ({ onSelect, selectedUser, defaultSelected }) => {
  const api = useAPI();
  const { isManagerOrResearcher } = useUserRole();
  const [usersList, setUsersList] = useState();
  const [currentPage] = usePage("page", 1);
  const [currentPageSize] = usePageSize("page_size", 30);
  const [totalItems, setTotalItems] = useState(0);

  const fetchUsers = useCallback(async (page, pageSize) => {
    const response = await api.callApi("memberships", {
      params: {
        pk: 1,
        contributed_to_projects: 1,
        page,
        page_size: pageSize,
      },
    });

    if (response.results) {
      setUsersList(response.results);
      setTotalItems(response.count);
    }
  }, [api]);

  const handleRoleChanged = useCallback((userId, newRole) => {
    setUsersList(prevUsers => {
      if (!prevUsers) return prevUsers;

      return prevUsers.map(item => {
        if (item.user.id === userId) {
          return {
            ...item,
            user: {
              ...item.user,
              role: newRole
            }
          };
        }
        return item;
      });
    });
  }, []);

  const selectUser = useCallback(
    (user) => {
      if (selectedUser?.id === user.id) {
        onSelect?.(null);
      } else {
        onSelect?.(user);
      }
    },
    [selectedUser, onSelect],
  );

  useEffect(() => {
    fetchUsers(currentPage, currentPageSize);
  }, [fetchUsers, currentPage, currentPageSize]);

  useEffect(() => {
    if (isDefined(defaultSelected) && usersList && !selectedUser) {
      const selected = usersList.find(({ user }) => user.id === Number(defaultSelected));

      if (selected) selectUser(selected.user);
    }
  }, [usersList, defaultSelected, selectUser, selectedUser]);

  return (
    <>
      <Block name="people-list">
        <Elem name="wrapper">
          {usersList ? (
            <Elem name="users">
              <Elem name="header">
                <Elem name="column" mix="avatar" />
                <Elem name="column" mix="email">
                  Email
                </Elem>
                <Elem name="column" mix="name">
                  Name
                </Elem>
                <Elem name="column" mix="last-activity">
                  Last Activity
                </Elem>
                <Elem name="column" mix="role">
                  Role
                </Elem>
              </Elem>
              <Elem name="body">
                {usersList.map(({ user }) => {
                  const active = user.id === selectedUser?.id;

                  return (
                    <Elem key={`user-${user.id}`} name="user" mod={{ active }} onClick={() => selectUser(user)}>
                      <Elem name="field" mix="avatar">
                        <CopyableTooltip title={`User ID: ${user.id}`} textForCopy={user.id}>
                          <Userpic user={user} style={{ width: 28, height: 28 }} />
                        </CopyableTooltip>
                      </Elem>
                      <Elem name="field" mix="email">
                        {user.email}
                      </Elem>
                      <Elem name="field" mix="name">
                        {user.first_name} {user.last_name}
                      </Elem>
                      <Elem name="field" mix="last-activity">
                        {formatDistance(new Date(user.last_activity), new Date(), { addSuffix: true })}
                      </Elem>
                      <Elem name="field" mix="role">
                        <RoleDropdown
                          user={user}
                          canEdit={isManagerOrResearcher}
                          onRoleChanged={handleRoleChanged}
                        />
                      </Elem>
                    </Elem>
                  );
                })}
              </Elem>
            </Elem>
          ) : (
            <Elem name="loading">
              <Spinner size={36} />
            </Elem>
          )}
        </Elem>
        <Pagination
          page={currentPage}
          urlParamName="page"
          totalItems={totalItems}
          pageSize={currentPageSize}
          pageSizeOptions={[30, 50, 100]}
          onPageLoad={fetchUsers}
          style={{ paddingTop: 16 }}
        />
      </Block>
    </>
  );
};
