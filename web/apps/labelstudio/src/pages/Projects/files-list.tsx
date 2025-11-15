import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAtom } from 'jotai';
import { useLocation, useHistory } from 'react-router-dom';
import { Block } from '../../utils/bem';
import { FilesTable } from './files-table';
import { ProjectSelector } from './project-selector';
import { useFilesList } from './hooks/useFilesList';
import { filesPaginationAtom, filesFiltersAtom } from './files-atoms';
import type { FileItem } from './hooks/useFilesList';
import './files-list.scss';

export const FilesList: React.FC = () => {
  const location = useLocation();
  const history = useHistory();
  const [pagination, setPagination] = useAtom(filesPaginationAtom);
  const [filters] = useAtom(filesFiltersAtom);
  const [viewingFile, setViewingFile] = useState<FileItem | null>(null);

  const selectedProject = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    const projectFromUrl = searchParams.get('project');
    if (projectFromUrl) {
      const projectId = parseInt(projectFromUrl, 10);
      return !isNaN(projectId) ? projectId : null;
    }
    return null;
  }, [location.search]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const pageFromUrl = searchParams.get('page');

    if (pageFromUrl) {
      const pageNumber = parseInt(pageFromUrl, 10);
      setPagination(prev => {
        if (!isNaN(pageNumber) && pageNumber !== prev.page) {
          return { ...prev, page: pageNumber };
        }
        return prev;
      });
    }
  }, [location.search, setPagination]);

  const handleProjectChange = useCallback((projectId: number | null) => {
    if (projectId) {
      setPagination(prev => ({ ...prev, page: 1 }));

      const searchParams = new URLSearchParams(location.search);
      searchParams.set('project', projectId.toString());
      searchParams.set('page', '1');

      history.push({
        pathname: location.pathname,
        search: searchParams.toString(),
      });
    }
  }, [location.pathname, location.search, history, setPagination]);

  const { files, totalFiles, isLoading, isError, refetch } = useFilesList({
    projectId: selectedProject,
    page: pagination.page,
    pageSize: pagination.pageSize,
    filters,
    enabled: !!selectedProject,
  });

  useEffect(() => {
    if (!isLoading) {
      setPagination(prev => {
        if (totalFiles !== prev.total) {
          return { ...prev, total: totalFiles };
        }
        return prev;
      });
    }
  }, [totalFiles, isLoading, setPagination]);

  const handlePageChange = useCallback((page: number, pageSize: number) => {
    setPagination(prev => ({ ...prev, page, pageSize }));
  }, [setPagination]);

  const handleViewFile = useCallback((file: FileItem) => {
    setViewingFile(file);
  }, []);

  return (
    <Block name="files-list">
      <ProjectSelector selectedProject={selectedProject} onProjectChange={handleProjectChange} />
      <FilesTable
        files={files}
        totalFiles={totalFiles}
        isLoading={isLoading}
        isError={isError}
        currentPage={pagination.page}
        pageSize={pagination.pageSize}
        onPageChange={handlePageChange}
        onRefetch={refetch}
        onViewFile={handleViewFile}
      />
    </Block>
  );
};
