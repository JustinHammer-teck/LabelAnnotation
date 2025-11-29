import React, { useState, useCallback, useContext } from 'react';
import { Modal } from '../../../../components/Modal/Modal';
import { Button } from '../../../../components/Button/Button';
import { Space } from '../../../../components/Space/Space';
import { ApiContext } from '../../../../providers/ApiProvider';
import styles from './ExcelUploadModal.module.scss';

interface ExcelUploadModalProps {
  projectId: number | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface ValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
  preview?: any;
}

interface UploadResult {
  success: boolean;
  message?: string;
  tasks_created?: number;
  errors?: string[];
}

export const ExcelUploadModal: React.FC<ExcelUploadModalProps> = ({
  projectId,
  onClose,
  onSuccess,
}) => {
  const api = useContext(ApiContext);
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [validating, setValidating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls')) {
        setFile(droppedFile);
        setValidationResult(null);
        setUploadResult(null);
      } else {
        alert('Please upload an Excel file (.xlsx or .xls)');
      }
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setValidationResult(null);
      setUploadResult(null);
    }
  };

  const handleValidate = async () => {
    if (!file || !projectId) return;

    setValidating(true);
    setValidationResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const result = await api.callApi('aviationValidate', {
        params: { pk: projectId },
        headers: { 'Content-Type': 'multipart/form-data' },
        body: formData,
      });

      setValidationResult({
        valid: result?.valid ?? true,
        errors: result?.errors || (result?.error ? [result.error] : []) || (result?.message ? [result.message] : []),
        warnings: result?.warnings || [],
        preview: result?.preview,
      });
    } catch (error: any) {
      setValidationResult({
        valid: false,
        errors: [error.message || 'Validation failed'],
      });
    } finally {
      setValidating(false);
    }
  };

  const handleUpload = async () => {
    if (!file || !projectId) return;

    setUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const result = await api.callApi('aviationUpload', {
        params: { pk: projectId },
        headers: { 'Content-Type': 'multipart/form-data' },
        body: formData,
      });

      setUploadResult({
        success: true,
        message: result?.message || 'Upload successful',
        tasks_created: result?.created_tasks || result?.tasks_created || result?.count,
      });

      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (error: any) {
      setUploadResult({
        success: false,
        message: error.message || 'Upload failed',
        errors: error.errors || [error.message],
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/aviation/export/template/');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'aviation_incidents_template.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download template:', error);
    }
  };

  return (
    <Modal
      title="Upload Aviation Incidents"
      visible={true}
      onHide={onClose}
      width={600}
    >
      <div className={styles.modalContent}>
        <div className={styles.section}>
          <div className={styles.downloadTemplate}>
            <p>Need a template?</p>
            <Button size="small" onClick={handleDownloadTemplate}>
              Download Template
            </Button>
          </div>
        </div>

        <div className={styles.section}>
          <div
            className={`${styles.dropzone} ${dragActive ? styles.dragActive : ''} ${
              file ? styles.hasFile : ''
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="file-upload"
              className={styles.fileInput}
              accept=".xlsx,.xls"
              onChange={handleFileChange}
            />
            <label htmlFor="file-upload" className={styles.fileLabel}>
              {file ? (
                <div className={styles.fileInfo}>
                  <div className={styles.fileName}>{file.name}</div>
                  <div className={styles.fileSize}>
                    {(file.size / 1024).toFixed(2)} KB
                  </div>
                </div>
              ) : (
                <div className={styles.uploadPrompt}>
                  <div className={styles.uploadIcon}>📄</div>
                  <p>Drop Excel file here or click to browse</p>
                  <span className={styles.uploadHint}>Supports .xlsx and .xls files</span>
                </div>
              )}
            </label>
          </div>
        </div>

        {validationResult && (
          <div className={styles.section}>
            <div
              className={`${styles.resultBox} ${
                validationResult.valid ? styles.success : styles.error
              }`}
            >
              <div className={styles.resultTitle}>
                {validationResult.valid ? '✓ Validation Passed' : '✗ Validation Failed'}
              </div>
              {validationResult.errors && validationResult.errors.length > 0 && (
                <div className={styles.resultList}>
                  <strong>Errors:</strong>
                  <ul>
                    {validationResult.errors.map((error, idx) => (
                      <li key={idx}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
              {validationResult.warnings && validationResult.warnings.length > 0 && (
                <div className={styles.resultList}>
                  <strong>Warnings:</strong>
                  <ul>
                    {validationResult.warnings.map((warning, idx) => (
                      <li key={idx}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {uploadResult && (
          <div className={styles.section}>
            <div
              className={`${styles.resultBox} ${
                uploadResult.success ? styles.success : styles.error
              }`}
            >
              <div className={styles.resultTitle}>
                {uploadResult.success ? '✓ Upload Successful' : '✗ Upload Failed'}
              </div>
              <p>{uploadResult.message}</p>
              {uploadResult.tasks_created && (
                <p>Created {uploadResult.tasks_created} tasks</p>
              )}
              {uploadResult.errors && uploadResult.errors.length > 0 && (
                <div className={styles.resultList}>
                  <ul>
                    {uploadResult.errors.map((error, idx) => (
                      <li key={idx}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        <div className={styles.actions}>
          <Space align="end">
            <Button onClick={onClose} size="compact">
              {uploadResult?.success ? 'Close' : 'Cancel'}
            </Button>
            {!uploadResult?.success && (
              <>
                <Button
                  onClick={handleValidate}
                  disabled={!file || validating || uploading}
                  waiting={validating}
                  size="compact"
                >
                  Validate
                </Button>
                <Button
                  look="primary"
                  onClick={handleUpload}
                  disabled={!file || !validationResult?.valid || uploading}
                  waiting={uploading}
                  size="compact"
                >
                  Upload
                </Button>
              </>
            )}
          </Space>
        </div>
      </div>
    </Modal>
  );
};
