import { type FC, useMemo, useCallback, type ReactNode, type MouseEvent } from 'react';
import { Table, Button, type TableColumn } from '../common';
import type { AviationProject } from '../../types';
import styles from './ProjectListView.module.scss';

export interface ProjectListViewProps {
  projects: AviationProject[];
  onSelect: (id: number) => void;
  onCreate: () => void;
  onDelete?: (id: number) => void;
  onRetry?: () => void;
  loading?: boolean;
  error?: string | null;
}

export const ProjectListView: FC<ProjectListViewProps> = ({
  projects,
  onSelect,
  onCreate,
  onDelete,
  onRetry,
  loading = false,
  error = null,
}) => {
  const handleDeleteClick = useCallback(
    (e: MouseEvent, id: number) => {
      e.stopPropagation();
      onDelete?.(id);
    },
    [onDelete]
  );

  const columns: TableColumn<AviationProject>[] = useMemo(
    () => [
      {
        key: 'project',
        title: 'Project Name',
        render: (_, record) => record.project.title,
      },
      {
        key: 'default_workflow',
        title: 'Workflow',
        width: 150,
      },
      {
        key: 'created_at',
        title: 'Created',
        width: 150,
        render: (value) => {
          const date = new Date(value as string);
          return date.toLocaleDateString();
        },
      },
      {
        key: 'updated_at',
        title: 'Updated',
        width: 150,
        render: (value) => {
          const date = new Date(value as string);
          return date.toLocaleDateString();
        },
      },
      ...(onDelete
        ? [
            {
              key: 'actions',
              title: 'Actions',
              width: 100,
              render: (_: unknown, record: AviationProject) => (
                <button
                  type="button"
                  className={styles.deleteButton}
                  onClick={(e) => handleDeleteClick(e, record.id)}
                  aria-label="Delete project"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                    <path
                      d="M3 4h8M5.5 4V3a1 1 0 011-1h1a1 1 0 011 1v1M10 4v7a1 1 0 01-1 1H5a1 1 0 01-1-1V4"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      fill="none"
                    />
                  </svg>
                </button>
              ),
            },
          ]
        : []),
    ],
    [onDelete, handleDeleteClick]
  );

  const emptyContent: ReactNode = (
    <div className={styles.emptyState}>
      <p className={styles.emptyText}>No projects found</p>
      <p className={styles.emptySubtext}>Create your first aviation project to get started</p>
      <Button variant="primary" onClick={onCreate}>
        Create Project
      </Button>
    </div>
  );

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Aviation Projects</h1>
        </div>
        <div className={styles.error}>
          <p className={styles.errorText}>Failed to load projects</p>
          <p className={styles.errorDetail}>{error}</p>
          {onRetry && (
            <Button variant="primary" onClick={onRetry}>
              Retry
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Aviation Projects</h1>
        <Button variant="primary" onClick={onCreate}>
          Create Project
        </Button>
      </div>
      <div className={styles.tableContainer}>
        {!loading && projects.length === 0 ? (
          emptyContent
        ) : (
          <Table<AviationProject>
            columns={columns}
            data={projects}
            rowKey="id"
            onRowClick={(record) => onSelect(record.id)}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
};
