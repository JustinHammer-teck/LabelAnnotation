import {
  type FC,
  type DragEvent,
  type ChangeEvent,
  useState,
  useCallback,
  useRef,
} from 'react';
import { Modal, Button } from '../common';
import type { ExcelUploadRowError } from '../../types';
import styles from './excel-upload-modal.module.scss';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = ['.xlsx', '.xls'];
const ACCEPTED_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
];

export type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

export interface ExcelUploadModalProps {
  open: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<void>;
  uploadProgress: number;
  uploadStatus: UploadStatus;
  createdCount: number;
  uploadErrors: ExcelUploadRowError[];
  errorMessage: string | null;
}

function validateFile(file: File): string | null {
  const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
  if (!ACCEPTED_EXTENSIONS.includes(extension)) {
    return `Invalid file type. Please upload an Excel file (${ACCEPTED_EXTENSIONS.join(', ')})`;
  }
  if (file.size > MAX_FILE_SIZE) {
    return `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`;
  }
  return null;
}

export const ExcelUploadModal: FC<ExcelUploadModalProps> = ({
  open,
  onClose,
  onUpload,
  uploadProgress,
  uploadStatus,
  createdCount,
  uploadErrors,
  errorMessage,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((selectedFile: File) => {
    const error = validateFile(selectedFile);
    if (error) {
      setValidationError(error);
      setFile(null);
      return;
    }
    setValidationError(null);
    setFile(selectedFile);
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        handleFileSelect(droppedFile);
      }
    },
    [handleFileSelect]
  );

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        handleFileSelect(selectedFile);
      }
    },
    [handleFileSelect]
  );

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleUpload = useCallback(async () => {
    if (!file) return;
    await onUpload(file);
  }, [file, onUpload]);

  const handleClose = useCallback(() => {
    setFile(null);
    setValidationError(null);
    setIsDragging(false);
    onClose();
  }, [onClose]);

  const isUploading = uploadStatus === 'uploading';
  const isSuccess = uploadStatus === 'success';
  const hasErrors = uploadStatus === 'error' || uploadErrors.length > 0;

  const footer = (
    <>
      <Button variant="secondary" onClick={handleClose} disabled={isUploading}>
        {isSuccess ? 'Close' : 'Cancel'}
      </Button>
      {!isSuccess && (
        <Button
          variant="primary"
          onClick={handleUpload}
          disabled={!file || isUploading || !!validationError}
        >
          {isUploading ? 'Uploading...' : 'Upload'}
        </Button>
      )}
    </>
  );

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Import Excel"
      footer={footer}
      className={styles.modal}
    >
      <div className={styles.content}>
        {isSuccess ? (
          <div className={styles.successMessage}>
            <svg className={styles.successIcon} viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
              <path d="M8 12l2.5 2.5L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className={styles.successText}>
              Successfully imported {createdCount} event{createdCount !== 1 ? 's' : ''}
            </p>
          </div>
        ) : (
          <>
            <div
              className={`${styles.dropzone} ${isDragging ? styles.dragging : ''} ${file ? styles.hasFile : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleBrowseClick}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleBrowseClick();
                }
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_MIME_TYPES.join(',')}
                onChange={handleInputChange}
                className={styles.hiddenInput}
              />
              <svg className={styles.uploadIcon} viewBox="0 0 24 24" fill="none">
                <path d="M12 15V3m0 0l-4 4m4-4l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 17l.621 2.485A2 2 0 004.561 21h14.878a2 2 0 001.94-1.515L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {file ? (
                <p className={styles.fileName}>{file.name}</p>
              ) : (
                <>
                  <p className={styles.dropText}>
                    Drag and drop your Excel file here
                  </p>
                  <p className={styles.browseText}>or click to browse</p>
                </>
              )}
              <p className={styles.acceptedFormats}>
                Accepted formats: .xlsx, .xls (max 10MB)
              </p>
            </div>

            {isUploading && (
              <div className={styles.progressContainer}>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <span className={styles.progressText}>{uploadProgress}%</span>
              </div>
            )}

            {(validationError || errorMessage) && (
              <div className={styles.errorAlert}>
                <svg className={styles.errorIcon} viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                  <path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <span>{validationError || errorMessage}</span>
              </div>
            )}

            {hasErrors && uploadErrors.length > 0 && (
              <div className={styles.rowErrors}>
                <p className={styles.rowErrorsTitle}>
                  Errors in {uploadErrors.length} row{uploadErrors.length !== 1 ? 's' : ''}:
                </p>
                <ul className={styles.rowErrorsList}>
                  {uploadErrors.slice(0, 10).map((err) => (
                    <li key={err.row} className={styles.rowErrorItem}>
                      <span className={styles.rowNumber}>Row {err.row}:</span>
                      <span className={styles.rowMessage}>{err.message}</span>
                    </li>
                  ))}
                  {uploadErrors.length > 10 && (
                    <li className={styles.rowErrorItem}>
                      ... and {uploadErrors.length - 10} more errors
                    </li>
                  )}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};
