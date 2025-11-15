import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { Block, Elem } from '../../utils/bem';
import { Spinner } from '../../components/Spinner/Spinner';
import { Button, Pagination } from '../../components';
import { Oneof } from '../../components/Oneof/Oneof';
import { FileStatusBadge } from './file-status-badge';
import { FileActions } from './file-actions';
import type { FileItem } from './hooks/useFilesList';
import './files-table.scss';

interface FilesTableProps {
  files: FileItem[];
  totalFiles: number;
  isLoading: boolean;
  isError: boolean;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number, pageSize: number) => void;
  onRefetch: () => void;
  onViewFile?: (file: FileItem) => void;
}

type LoadingState = 'loading' | 'loaded' | 'error' | 'empty';

export const FilesTable: React.FC<FilesTableProps> = ({
  files,
  totalFiles,
  isLoading,
  isError,
  currentPage,
  pageSize,
  onPageChange,
  onRefetch,
  onViewFile,
}) => {
  const loadingState = useMemo<LoadingState>(() => {
    if (isLoading) return 'loading';
    if (isError) return 'error';
    if (files.length === 0) return 'empty';
    return 'loaded';
  }, [isLoading, isError, files.length]);

  const getFileExtension = (fileName: string): string => {
    const parts = fileName.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : 'FILE';
  };

  return (
    <Block name="files-table">
      <Oneof value={loadingState}>
        <Elem name="loading" case="loading">
          <Elem name="loading-container">
            <Spinner size={64} />
            <Elem name="loading-text">Loading files...</Elem>
          </Elem>
        </Elem>

        <Elem name="content" case="loaded">
          <Elem name="table-wrapper">
            <Elem name="table" tag="table">
              <Elem name="thead" tag="thead">
                <Elem name="tr" tag="tr">
                  <Elem name="th" tag="th">ID</Elem>
                  <Elem name="th" tag="th">File Name</Elem>
                  <Elem name="th" tag="th">File Type</Elem>
                  <Elem name="th" tag="th">Project</Elem>
                  <Elem name="th" tag="th">Uploaded Date</Elem>
                  <Elem name="th" tag="th">Status</Elem>
                  <Elem name="th" tag="th">Actions</Elem>
                </Elem>
              </Elem>
              <Elem name="tbody" tag="tbody">
                {files.map((file) => (
                  <Elem name="tr" tag="tr" key={file.id}>
                    <Elem name="td" tag="td" mod={{ type: 'id' }}>
                      {file.id}
                    </Elem>
                    <Elem name="td" tag="td" mod={{ type: 'filename' }}>
                      <Elem name="filename-text" title={file.file_name}>
                        {file.file_name}
                      </Elem>
                    </Elem>
                    <Elem name="td" tag="td" mod={{ type: 'type' }}>
                      <Elem name="file-type-badge">
                        {getFileExtension(file.file_name)}
                      </Elem>
                    </Elem>
                    <Elem name="td" tag="td" mod={{ type: 'project' }}>
                      {file.project_title || '-'}
                    </Elem>
                    <Elem name="td" tag="td" mod={{ type: 'date' }}>
                      {format(new Date(file.created_at), 'dd MMM yyyy, HH:mm')}
                    </Elem>
                    <Elem name="td" tag="td" mod={{ type: 'status' }}>
                      <FileStatusBadge status={file.status as any} />
                    </Elem>
                    <Elem name="td" tag="td" mod={{ type: 'actions' }}>
                      <FileActions file={file} onView={onViewFile} />
                    </Elem>
                  </Elem>
                ))}
              </Elem>
            </Elem>
          </Elem>

          <Elem name="footer">
            <Pagination
              name="files-list"
              label="Files"
              page={currentPage}
              totalItems={totalFiles}
              pageSize={pageSize}
              urlParamName="page"
              pageSizeOptions={[10, 30, 50, 100]}
              onPageLoad={async (page, pageSize) => {
                onPageChange(page, pageSize);
              }}
            />
          </Elem>
        </Elem>

        <Elem name="empty" case="empty">
          <Elem name="empty-container">
            <Elem name="empty-icon">📁</Elem>
            <Elem name="empty-title" tag="h2">
              No files uploaded yet
            </Elem>
            <Elem name="empty-description" tag="p">
              Files uploaded to your projects will appear here.
            </Elem>
          </Elem>
        </Elem>

        <Elem name="error" case="error">
          <Elem name="error-container">
            <Elem name="error-icon">⚠️</Elem>
            <Elem name="error-message">
              Failed to load files
            </Elem>
            <Elem name="error-action" tag={Button} onClick={onRefetch} look="primary">
              Retry
            </Elem>
          </Elem>
        </Elem>
      </Oneof>
    </Block>
  );
};
