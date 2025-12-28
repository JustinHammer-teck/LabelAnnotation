import { type FC, useMemo, useCallback, type ReactNode, type MouseEvent } from 'react';
import { Table, Button, type TableColumn } from '../common';
import type { AviationProject } from '../../types';
import styles from './ProjectListView.module.scss';

export interface ProjectListViewProps {
  projects: AviationProject[];
  onSelect: (id: number) => void;
  onCreate: () => void;
  onDelete?: (id: number) => void;
  onSettings?: (id: number) => void;
  onRetry?: () => void;
  loading?: boolean;
  error?: string | null;
}

export const ProjectListView: FC<ProjectListViewProps> = ({
  projects,
  onSelect,
  onCreate,
  onDelete,
  onSettings,
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

  const handleSettingsClick = useCallback(
    (e: MouseEvent, id: number) => {
      e.stopPropagation();
      onSettings?.(id);
    },
    [onSettings]
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
      ...(onDelete || onSettings
        ? [
            {
              key: 'actions',
              title: 'Actions',
              width: 140,
              render: (_: unknown, record: AviationProject) => (
                <div className={styles.actionsCell}>
                  {onSettings && (
                    <button
                      type="button"
                      className={styles.settingsButton}
                      onClick={(e) => handleSettingsClick(e, record.id)}
                      aria-label="Project settings"
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M7 9a2 2 0 100-4 2 2 0 000 4z" stroke="currentColor" strokeWidth="1.2"/>
                        <path d="M11.4 8.6l.9.5c.2.1.3.4.2.6l-.9 1.5c-.1.2-.4.3-.6.2l-.9-.5c-.4.3-.8.5-1.3.6l-.1 1c0 .3-.2.5-.5.5H6.8c-.3 0-.5-.2-.5-.5l-.1-1c-.5-.1-.9-.3-1.3-.6l-.9.5c-.2.1-.5 0-.6-.2l-.9-1.5c-.1-.2 0-.5.2-.6l.9-.5c0-.2-.1-.4-.1-.6s0-.4.1-.6l-.9-.5c-.2-.1-.3-.4-.2-.6l.9-1.5c.1-.2.4-.3.6-.2l.9.5c.4-.3.8-.5 1.3-.6l.1-1c0-.3.2-.5.5-.5h1.4c.3 0 .5.2.5.5l.1 1c.5.1.9.3 1.3.6l.9-.5c.2-.1.5 0 .6.2l.9 1.5c.1.2 0 .5-.2.6l-.9.5c0 .2.1.4.1.6s0 .4-.1.6z" stroke="currentColor" strokeWidth="1.2"/>
                      </svg>
                    </button>
                  )}
                  {onDelete && (
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
                  )}
                </div>
              ),
            },
          ]
        : []),
    ],
    [onDelete, onSettings, handleDeleteClick, handleSettingsClick]
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
