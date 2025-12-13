import { type FC, useMemo, type ReactNode } from 'react';
import { Table, Button, type TableColumn } from '../common';
import type { AviationProject } from '../../types';
import styles from './ProjectListView.module.scss';

export interface ProjectListViewProps {
  projects: AviationProject[];
  onSelect: (id: number) => void;
  onCreate: () => void;
  onRetry?: () => void;
  loading?: boolean;
  error?: string | null;
}

export const ProjectListView: FC<ProjectListViewProps> = ({
  projects,
  onSelect,
  onCreate,
  onRetry,
  loading = false,
  error = null,
}) => {
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
    ],
    []
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
