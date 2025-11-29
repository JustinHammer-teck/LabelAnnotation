import React, { useState, useEffect, useContext } from 'react';
import { Modal } from '../../../../components/Modal/Modal';
import { Button } from '../../../../components/Button/Button';
import { Space } from '../../../../components/Space/Space';
import { ApiContext } from '../../../../providers/ApiProvider';
import { useTranslation } from 'react-i18next';
import styles from './AviationProjectModal.module.scss';

interface AviationProjectModalProps {
  projectId?: number | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface ProjectData {
  title: string;
  description: string;
}

export const AviationProjectModal: React.FC<AviationProjectModalProps> = ({
  projectId,
  onClose,
  onSuccess,
}) => {
  const api = useContext(ApiContext);
  const { t } = useTranslation();
  const [formData, setFormData] = useState<ProjectData>({ title: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = Boolean(projectId);

  useEffect(() => {
    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  const fetchProject = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const data = await api.callApi('aviationProject', {
        params: { pk: projectId },
      });
      if (data) {
        setFormData({
          title: data.title || '',
          description: data.description || '',
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      setError(t('aviation.project.title_required', 'Project title is required'));
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (isEditMode && projectId) {
        await api.callApi('updateAviationProject', {
          params: { pk: projectId },
          body: formData,
        });
      } else {
        await api.callApi('createAviationProject', {
          body: formData,
        });
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to save project');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof ProjectData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    setError(null);
  };

  return (
    <Modal
      title={isEditMode ? t('aviation.project.edit_project') : t('aviation.project.create_project')}
      visible={true}
      onHide={onClose}
      width={500}
    >
      <div className={styles.modalContent}>
        {loading ? (
          <div className={styles.loading}>Loading...</div>
        ) : (
          <>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="project-title">
                {t('aviation.project.title')} <span className={styles.required}>*</span>
              </label>
              <input
                id="project-title"
                type="text"
                className={styles.input}
                value={formData.title}
                onChange={handleChange('title')}
                placeholder={t('aviation.project.title_placeholder', 'Enter project title')}
                autoFocus
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="project-description">
                {t('aviation.project.description')}
              </label>
              <textarea
                id="project-description"
                className={styles.textarea}
                value={formData.description}
                onChange={handleChange('description')}
                placeholder={t('aviation.project.description_placeholder', 'Enter project description (optional)')}
                rows={4}
              />
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.actions}>
              <Space align="end">
                <Button onClick={onClose} size="compact">
                  {t('common.cancel', 'Cancel')}
                </Button>
                <Button
                  look="primary"
                  onClick={handleSubmit}
                  disabled={saving || !formData.title.trim()}
                  waiting={saving}
                  size="compact"
                >
                  {isEditMode
                    ? t('aviation.project.save', 'Save')
                    : t('aviation.project.create', 'Create')}
                </Button>
              </Space>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
