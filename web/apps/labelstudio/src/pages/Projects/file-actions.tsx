import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { IconEyeOpened, IconFileDownload, IconPencil } from '@humansignal/icons';
import { Button } from '../../components';
import { Block, Elem } from '../../utils/bem';
import { useAPI } from '../../providers/ApiProvider';
import type { FileItem } from './hooks/useFilesList';
import { showFileViewer } from './file-viewer-modal';
import './file-actions.scss';

interface FileActionsProps {
  file: FileItem;
  onView?: (file: FileItem) => void;
}

export const FileActions: React.FC<FileActionsProps> = ({ file, onView }) => {
  const api = useAPI();
  const history = useHistory();
  const [downloading, setDownloading] = useState(false);
  const [annotating, setAnnotating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleView = async () => {
    setError(null);

    try {
      const result = await api.callApi<{ download_url?: string; url?: string }>('fileUploadDownload', {
        params: { pk: file.id },
        suppressError: true,
      });

      if (!result) {
        setError('Failed to view file');
        return;
      }

      const fileUrl = result.download_url || result.url;
      if (!fileUrl) {
        setError('File URL not available');
        return;
      }

      showFileViewer({
        fileUrl,
        fileName: file.file_name,
        fileType: file.file_type,
      });

      if (onView) {
        onView(file);
      }
    } catch (err) {
      setError('Failed to view file');
    }
  };

  const handleAnnotate = async () => {
    setError(null);
    setAnnotating(true);

    try {
      const result = await api.callApi<{ task_id: number; project_id: number }>('fileUploadTask', {
        params: { pk: file.id },
        suppressError: true,
      });

      if (!result || !result.task_id) {
        setError('Failed to navigate to task');
        setAnnotating(false);
        return;
      }

      const projectId = result.project_id || file.project_id;
      history.push(`/projects/${projectId}/data?task=${result.task_id}`);
      setAnnotating(false);
    } catch (err) {
      setError('Failed to navigate to task');
      setAnnotating(false);
    }
  };

  const handleDownload = async () => {
    setError(null);
    setDownloading(true);

    try {
      const result = await api.callApi<{ download_url?: string; url?: string }>('fileUploadDownload', {
        params: { pk: file.id },
        suppressError: true,
      });

      if (!result) {
        setError('Failed to download file');
        setDownloading(false);
        return;
      }

      const downloadUrl = result.download_url || result.url;
      if (!downloadUrl) {
        setError('Download URL not available');
        setDownloading(false);
        return;
      }

      const anchor = document.createElement('a');
      anchor.href = downloadUrl;
      anchor.download = file.file_name || 'download';
      anchor.rel = 'noopener noreferrer';
      anchor.click();

      setDownloading(false);
    } catch (err) {
      setError('Failed to download file');
      setDownloading(false);
    }
  };

  return (
    <Block name="file-actions">
      <Elem name="buttons">
        <Button
          size="small"
          type="text"
          icon={<IconEyeOpened />}
          onClick={handleView}
          title="View file"
        />
        <Button
          size="small"
          type="text"
          icon={<IconPencil />}
          onClick={handleAnnotate}
          waiting={annotating}
          disabled={annotating || file.task_count === 0}
          title={file.task_count === 0 ? 'No tasks available' : 'Annotate task'}
        />
        <Button
          size="small"
          type="text"
          icon={<IconFileDownload />}
          onClick={handleDownload}
          waiting={downloading}
          disabled={downloading}
          title="Download file"
        />
      </Elem>
      {error && (
        <Elem name="error">{error}</Elem>
      )}
    </Block>
  );
};
