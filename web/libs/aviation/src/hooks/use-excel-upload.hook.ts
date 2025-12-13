import { useCallback, useState, useRef } from 'react';
import { useAviationApi } from '../api';
import type { ExcelUploadRowError } from '../types';
import type { UploadStatus } from '../components/excel-upload';

interface UploadSuccessResult {
  firstEventId: number | null;
  createdCount: number;
}

interface UseExcelUploadResult {
  uploadProgress: number;
  uploadStatus: UploadStatus;
  createdCount: number;
  firstEventId: number | null;
  uploadErrors: ExcelUploadRowError[];
  errorMessage: string | null;
  upload: (projectId: number, file: File) => Promise<UploadSuccessResult | null>;
  reset: () => void;
}

export const useExcelUpload = (): UseExcelUploadResult => {
  const api = useAviationApi();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [createdCount, setCreatedCount] = useState(0);
  const [firstEventId, setFirstEventId] = useState<number | null>(null);
  const [uploadErrors, setUploadErrors] = useState<ExcelUploadRowError[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const uploadingRef = useRef(false);

  const upload = useCallback(
    async (projectId: number, file: File): Promise<UploadSuccessResult | null> => {
      if (uploadingRef.current) return null;
      uploadingRef.current = true;

      setUploadProgress(0);
      setUploadStatus('uploading');
      setCreatedCount(0);
      setFirstEventId(null);
      setUploadErrors([]);
      setErrorMessage(null);

      try {
        const result = await api.uploadExcel(projectId, file, (progress) => {
          setUploadProgress(progress);
        });

        if (result.success) {
          setCreatedCount(result.created_count);
          setFirstEventId(result.first_event_id);
          setUploadStatus('success');
          uploadingRef.current = false;
          return {
            firstEventId: result.first_event_id,
            createdCount: result.created_count,
          };
        }

        setUploadErrors(result.errors);
        setUploadStatus('error');
        uploadingRef.current = false;
        return null;
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Upload failed';
        setErrorMessage(message);
        setUploadStatus('error');
        uploadingRef.current = false;
        return null;
      }
    },
    [api]
  );

  const reset = useCallback(() => {
    setUploadProgress(0);
    setUploadStatus('idle');
    setCreatedCount(0);
    setFirstEventId(null);
    setUploadErrors([]);
    setErrorMessage(null);
    uploadingRef.current = false;
  }, []);

  return {
    uploadProgress,
    uploadStatus,
    createdCount,
    firstEventId,
    uploadErrors,
    errorMessage,
    upload,
    reset,
  };
};
