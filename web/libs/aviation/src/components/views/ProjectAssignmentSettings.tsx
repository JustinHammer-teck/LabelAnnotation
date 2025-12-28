import { type FC, useCallback } from 'react';
import { useProjectAssignments } from '../../hooks/use-project-assignments.hook';
import styles from './ProjectAssignmentSettings.module.scss';

export interface ProjectAssignmentSettingsProps {
  projectId: number;
  currentUserId: number;
  showToast?: (options: { message: string; type: 'success' | 'error' }) => void;
}

export const ProjectAssignmentSettings: FC<ProjectAssignmentSettingsProps> = ({
  projectId,
  currentUserId,
  showToast,
}) => {
  const {
    assignments,
    isLoading,
    isError,
    error,
    toggleAssignment,
    isToggling,
    refetch,
  } = useProjectAssignments({ projectId, showToast });

  const handleToggle = useCallback(
    async (userId: number, currentPermission: boolean) => {
      try {
        await toggleAssignment(userId, currentPermission);
      } catch (err) {
        // Error already handled by hook
      }
    },
    [toggleAssignment]
  );

  if (isLoading) {
    return (
      <div className={styles.container}>
        <h2 className={styles.title}>Project Assignment Settings</h2>
        <div className={styles.loading}>Loading assignments...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={styles.container}>
        <h2 className={styles.title}>Project Assignment Settings</h2>
        <div className={styles.error}>
          <p>Failed to load assignments: {error?.message}</p>
          <button onClick={refetch} className={styles.retryButton}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className={styles.container}>
        <h2 className={styles.title}>Project Assignment Settings</h2>
        <div className={styles.empty}>No users found in organization</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Project Assignment Settings</h2>
      <p className={styles.description}>
        Assign users to this aviation project. Annotators can only see projects they are assigned to.
      </p>

      <table className={styles.assignmentTable} role="table">
        <thead>
          <tr>
            <th role="columnheader">Email</th>
            <th role="columnheader">Assigned</th>
          </tr>
        </thead>
        <tbody>
          {assignments.map((assignment) => {
            const isCurrentUser = assignment.user_id === currentUserId;
            const isDisabled = isCurrentUser || isToggling;

            return (
              <tr
                key={assignment.user_id}
                className={assignment.has_permission ? styles.assigned : ''}
                title={isCurrentUser ? 'You cannot modify yourself' : undefined}
              >
                <td>{assignment.user_email}</td>
                <td>
                  <input
                    type="checkbox"
                    checked={assignment.has_permission}
                    disabled={isDisabled}
                    onChange={() =>
                      handleToggle(assignment.user_id, assignment.has_permission)
                    }
                    aria-label={`Assign ${assignment.user_email} to project`}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {isToggling && (
        <div className={styles.togglingOverlay}>
          <span>Updating assignments...</span>
        </div>
      )}
    </div>
  );
};
