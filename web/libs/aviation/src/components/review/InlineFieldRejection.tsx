import { type FC, useState, useCallback, useId, useMemo } from 'react';
import type { FeedbackType } from '../../types';
import { Button } from '../common/button';
import { Select } from '../common/select';
import { TextArea } from '../common/text-area';
import { useAviationTranslation } from '../../i18n';
import styles from './inline-field-rejection.module.scss';

export interface InlineFieldRejectionProps {
  fieldName: string;
  fieldLabel: string;
  onAddFeedback: (feedback: { feedback_type: FeedbackType; feedback_comment: string }) => void;
  onCancel: () => void;
}

/**
 * Inline UI for reviewer to add feedback on a specific field.
 * Shows: dropdown for feedback type + textarea for comment + submit/cancel buttons.
 */
export const InlineFieldRejection: FC<InlineFieldRejectionProps> = ({
  fieldName,
  fieldLabel,
  onAddFeedback,
  onCancel,
}) => {
  const { t } = useAviationTranslation();
  const [feedbackType, setFeedbackType] = useState<FeedbackType | null>(null);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [errors, setErrors] = useState<{ type?: string; comment?: string }>({});

  const formId = useId();
  const typeSelectId = `${formId}-type`;
  const commentId = `${formId}-comment`;

  // Build feedback type options with translations
  const feedbackTypeOptions = useMemo(() => [
    { value: 'partial', label: `${t('feedback.type.partial')} - ${t('feedback.type.partial_desc')}` },
    { value: 'full', label: `${t('feedback.type.full')} - ${t('feedback.type.full_desc')}` },
    { value: 'revision', label: `${t('feedback.type.revision')} - ${t('feedback.type.revision_desc')}` },
  ], [t]);

  const validateForm = useCallback((): boolean => {
    const newErrors: { type?: string; comment?: string } = {};

    if (!feedbackType) {
      newErrors.type = t('feedback.form.required_type');
    }

    if (!feedbackComment.trim()) {
      newErrors.comment = t('feedback.form.required_comment');
    } else if (feedbackComment.trim().length < 10) {
      newErrors.comment = t('feedback.form.min_length_comment');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [feedbackType, feedbackComment, t]);

  const handleSubmit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();

      if (!validateForm()) {
        return;
      }

      onAddFeedback({
        feedback_type: feedbackType as FeedbackType,
        feedback_comment: feedbackComment.trim(),
      });
    },
    [feedbackType, feedbackComment, validateForm, onAddFeedback],
  );

  const handleTypeChange = useCallback((value: string | null) => {
    setFeedbackType(value as FeedbackType | null);
    setErrors((prev) => ({ ...prev, type: undefined }));
  }, []);

  const handleCommentChange = useCallback((value: string) => {
    setFeedbackComment(value);
    setErrors((prev) => ({ ...prev, comment: undefined }));
  }, []);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel();
      }
    },
    [onCancel],
  );

  return (
    <div
      className={styles.container}
      data-testid="inline-field-rejection"
      data-field={fieldName}
      onKeyDown={handleKeyDown}
    >
      <div className={styles.header}>
        <h5 className={styles.title}>{t('feedback.form.title')}</h5>
        <span className={styles.fieldLabel}>{fieldLabel}</span>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label htmlFor={typeSelectId} className={styles.label}>
            {t('feedback.form.type_label')} <span className={styles.required}>*</span>
          </label>
          <Select
            id={typeSelectId}
            value={feedbackType}
            onChange={handleTypeChange}
            options={feedbackTypeOptions}
            placeholder={t('feedback.form.type_placeholder')}
            error={errors.type}
            aria-label={t('feedback.form.type_label')}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor={commentId} className={styles.label}>
            {t('feedback.form.comment_label')} <span className={styles.required}>*</span>
          </label>
          <TextArea
            id={commentId}
            value={feedbackComment}
            onChange={handleCommentChange}
            placeholder={t('feedback.form.comment_placeholder')}
            rows={3}
            error={errors.comment}
            aria-label={t('feedback.form.comment_label')}
          />
          <span className={styles.hint}>{t('feedback.form.comment_hint')}</span>
        </div>

        <div className={styles.actions}>
          <Button
            type="button"
            variant="secondary"
            size="small"
            onClick={onCancel}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="small"
          >
            {t('feedback.form.submit')}
          </Button>
        </div>
      </form>
    </div>
  );
};
