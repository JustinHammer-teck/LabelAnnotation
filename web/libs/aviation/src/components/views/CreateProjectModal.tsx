import { type FC, type FormEvent, useState, useCallback } from 'react';
import { Modal, Button } from '../common';
import { useProjects } from '../../hooks';
import type { AviationProject } from '../../types';
import styles from './CreateProjectModal.module.scss';

export interface CreateProjectModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (project: AviationProject) => void;
}

export const CreateProjectModal: FC<CreateProjectModalProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { createProject } = useProjects();

  const handleClose = useCallback(() => {
    setTitle('');
    setError(null);
    setIsSubmitting(false);
    onClose();
  }, [onClose]);

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const project = await createProject({ title: title.trim() });

    if (project) {
      setTitle('');
      onSuccess(project);
    } else {
      setError('Failed to create project. Please try again.');
    }

    setIsSubmitting(false);
  }, [title, createProject, onSuccess]);

  const footer = (
    <>
      <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
        Cancel
      </Button>
      <Button
        variant="primary"
        onClick={handleSubmit}
        disabled={!title.trim() || isSubmitting}
      >
        {isSubmitting ? 'Creating...' : 'Create'}
      </Button>
    </>
  );

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Create Project"
      footer={footer}
      className={styles.modal}
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="project-title" className={styles.label}>
            Title <span className={styles.required}>*</span>
          </label>
          <input
            id="project-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter project title"
            className={styles.input}
            disabled={isSubmitting}
            autoFocus
          />
        </div>

        {error && (
          <div className={styles.errorAlert}>
            <svg className={styles.errorIcon} viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
              <path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span>{error}</span>
          </div>
        )}
      </form>
    </Modal>
  );
};
