import { type FC, useState, useCallback, useId } from 'react';
import type { FeedbackType } from '../../types';
import { Button } from '../common/button';
import { Select } from '../common/select';
import { TextArea } from '../common/text-area';
import styles from './inline-field-rejection.module.scss';

export interface InlineFieldRejectionProps {
  fieldName: string;
  fieldLabel: string;
  onAddFeedback: (feedback: { feedback_type: FeedbackType; feedback_comment: string }) => void;
  onCancel: () => void;
}

const FEEDBACK_TYPE_OPTIONS = [
  { value: 'partial', label: 'Partial Issue - Field has some issues but is partially correct' },
  { value: 'full', label: 'Rejected - Field is completely incorrect' },
  { value: 'revision', label: 'Needs Revision - Field needs clarification or changes' },
];

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
  const [feedbackType, setFeedbackType] = useState<FeedbackType | null>(null);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [errors, setErrors] = useState<{ type?: string; comment?: string }>({});

  const formId = useId();
  const typeSelectId = `${formId}-type`;
  const commentId = `${formId}-comment`;

  const validateForm = useCallback((): boolean => {
    const newErrors: { type?: string; comment?: string } = {};

    if (!feedbackType) {
      newErrors.type = 'Please select a feedback type';
    }

    if (!feedbackComment.trim()) {
      newErrors.comment = 'Please provide a comment explaining the issue';
    } else if (feedbackComment.trim().length < 10) {
      newErrors.comment = 'Comment must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [feedbackType, feedbackComment]);

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
        <h5 className={styles.title}>Add Feedback for Field</h5>
        <span className={styles.fieldLabel}>{fieldLabel}</span>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label htmlFor={typeSelectId} className={styles.label}>
            Feedback Type <span className={styles.required}>*</span>
          </label>
          <Select
            id={typeSelectId}
            value={feedbackType}
            onChange={handleTypeChange}
            options={FEEDBACK_TYPE_OPTIONS}
            placeholder="Select feedback type..."
            error={errors.type}
            aria-label="Feedback type"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor={commentId} className={styles.label}>
            Comment <span className={styles.required}>*</span>
          </label>
          <TextArea
            id={commentId}
            value={feedbackComment}
            onChange={handleCommentChange}
            placeholder="Explain the issue with this field..."
            rows={3}
            error={errors.comment}
            aria-label="Feedback comment"
          />
          <span className={styles.hint}>Minimum 10 characters</span>
        </div>

        <div className={styles.actions}>
          <Button
            type="button"
            variant="secondary"
            size="small"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="small"
          >
            Add Feedback
          </Button>
        </div>
      </form>
    </div>
  );
};
