import { type FC, useMemo, useEffect, useState, useCallback, type ReactNode } from 'react';
import { useHistory } from 'react-router-dom';
import { Table, Button, type TableColumn } from '../common';
import { ExcelUploadModal } from '../excel-upload';
import { useEvents, useExcelUpload } from '../../hooks';
import type { AviationEvent } from '../../types';
import styles from './TaskListView.module.scss';

export interface TaskListViewProps {
  projectId: number;
  onSelect: (id: number) => void;
}

export const TaskListView: FC<TaskListViewProps> = ({
  projectId,
  onSelect,
}) => {
  const history = useHistory();
  const { events, loading, error, fetchEvents } = useEvents(projectId);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const {
    uploadProgress,
    uploadStatus,
    createdCount,
    firstEventId,
    uploadErrors,
    errorMessage,
    upload,
    reset,
  } = useExcelUpload();

  const handleOpenModal = useCallback(() => {
    reset();
    setIsModalOpen(true);
  }, [reset]);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    if (uploadStatus === 'success') {
      if (firstEventId) {
        history.push(`/aviation/projects/${projectId}/events/${firstEventId}`);
      } else {
        fetchEvents();
      }
    }
  }, [uploadStatus, firstEventId, history, projectId, fetchEvents]);

  const handleUpload = useCallback(
    async (file: File) => {
      const result = await upload(projectId, file);
      if (result) {
        setTimeout(() => {
          setIsModalOpen(false);
          if (result.firstEventId) {
            history.push(`/aviation/projects/${projectId}/events/${result.firstEventId}`);
          } else {
            fetchEvents();
          }
        }, 1500);
      }
    },
    [upload, projectId, history, fetchEvents]
  );

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const columns: TableColumn<AviationEvent>[] = useMemo(
    () => [
      {
        key: 'event_number',
        title: 'Event Number',
        width: 150,
      },
      {
        key: 'date',
        title: 'Date',
        width: 120,
        render: (value) => {
          const date = new Date(value as string);
          return date.toLocaleDateString();
        },
      },
      {
        key: 'location',
        title: 'Location',
        width: 150,
      },
      {
        key: 'airport',
        title: 'Airport',
        width: 120,
      },
      {
        key: 'flight_phase',
        title: 'Flight Phase',
        width: 130,
      },
      {
        key: 'aircraft_type',
        title: 'Aircraft',
        width: 120,
      },
    ],
    []
  );

  const emptyContent: ReactNode = (
    <div className={styles.emptyState}>
      <p className={styles.emptyText}>No events in this project</p>
      <p className={styles.emptySubtext}>Import an Excel file or upload a single event to start annotating</p>
      <div className={styles.emptyActions}>
        <Button variant="primary" onClick={handleOpenModal}>
          Import Excel
        </Button>
      </div>
    </div>
  );

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Events</h1>
        </div>
        <div className={styles.errorState}>
          <p className={styles.errorText}>Failed to load events</p>
          <p className={styles.errorDetail}>{error}</p>
          <Button variant="primary" onClick={fetchEvents}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Events</h1>
        <div className={styles.headerActions}>
          <Button variant="primary" onClick={handleOpenModal}>
            Import Excel
          </Button>
        </div>
      </div>
      <div className={styles.tableContainer}>
        {!loading && events.length === 0 ? (
          emptyContent
        ) : (
          <Table<AviationEvent>
            columns={columns}
            data={events}
            rowKey="id"
            onRowClick={(record) => onSelect(record.id)}
            loading={loading}
          />
        )}
      </div>
      <ExcelUploadModal
        open={isModalOpen}
        onClose={handleCloseModal}
        onUpload={handleUpload}
        uploadProgress={uploadProgress}
        uploadStatus={uploadStatus}
        createdCount={createdCount}
        uploadErrors={uploadErrors}
        errorMessage={errorMessage}
      />
    </div>
  );
};
