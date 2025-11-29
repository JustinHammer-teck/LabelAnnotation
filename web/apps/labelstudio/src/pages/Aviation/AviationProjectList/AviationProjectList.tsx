import React, { useState, useEffect, useContext } from 'react';
import { useHistory } from 'react-router-dom';
import { format } from 'date-fns';
import { Button, Pagination, Spinner } from '../../../components';
import { Block, Elem } from '../../../utils/bem';
import { ApiContext } from '../../../providers/ApiProvider';
import { Oneof } from '../../../components/Oneof/Oneof';
import { ExcelUploadModal } from '../components/ExcelUploadModal/ExcelUploadModal';
import { useAbortController } from '@humansignal/core';
import styles from './AviationProjectList.module.scss';

interface Project {
  id: number;
  title: string;
  description?: string;
  created_at: string;
  task_number?: number;
  aviation_task_count?: number;
}

export const AviationProjectList: React.FC = () => {
  const api = useContext(ApiContext);
  const history = useHistory();
  const abortController = useAbortController();
  const [projects, setProjects] = useState<Project[]>([]);
  const [networkState, setNetworkState] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const pageSize = 12;

  const fetchProjects = async (page = currentPage) => {
    setNetworkState('loading');
    abortController.renew();

    try {
      const data = await api.callApi('projects', {
        params: {
          page,
          page_size: pageSize,
          include: 'id,title,description,created_at,task_number',
        },
        signal: abortController.controller.current.signal,
        errorFilter: (e: any) => e.error.includes('aborted'),
      });

      setTotalItems(data?.count ?? 0);
      setProjects(data.results ?? []);
      setNetworkState('loaded');
    } catch (error) {
      console.error('Error fetching projects:', error);
      setNetworkState('error');
    }
  };

  const loadNextPage = async (page: number) => {
    setCurrentPage(page);
    await fetchProjects(page);
  };

  const handleProjectClick = (projectId: number) => {
    history.push(`/aviation/${projectId}/tasks`);
  };

  const handleUploadClick = (projectId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedProjectId(projectId);
    setUploadModalOpen(true);
  };

  const handleUploadComplete = () => {
    setUploadModalOpen(false);
    setSelectedProjectId(null);
    fetchProjects();
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <Block name="aviation-projects">
      <Elem name="header">
        <Elem name="title">Aviation Safety Projects</Elem>
        <Button
          look="primary"
          onClick={() => {
            setSelectedProjectId(null);
            setUploadModalOpen(true);
          }}
        >
          Upload Incidents
        </Button>
      </Elem>

      <Oneof value={networkState}>
        <Elem name="loading" case="loading">
          <Spinner size={64} />
        </Elem>

        <Elem name="content" case="loaded">
          {projects.length > 0 ? (
            <>
              <Elem name="list">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className={styles.projectCard}
                    onClick={() => handleProjectClick(project.id)}
                  >
                    <div className={styles.cardHeader}>
                      <div className={styles.cardTitle}>{project.title}</div>
                      <Button
                        size="small"
                        onClick={(e) => handleUploadClick(project.id, e)}
                      >
                        Upload
                      </Button>
                    </div>

                    <div className={styles.cardBody}>
                      {project.description && (
                        <div className={styles.cardDescription}>
                          {project.description}
                        </div>
                      )}

                      <div className={styles.cardStats}>
                        <div className={styles.statItem}>
                          <span className={styles.statLabel}>Total Tasks:</span>
                          <span className={styles.statValue}>{project.task_number || 0}</span>
                        </div>
                      </div>
                    </div>

                    <div className={styles.cardFooter}>
                      <span className={styles.cardDate}>
                        {format(new Date(project.created_at), "dd MMM 'yy, HH:mm")}
                      </span>
                    </div>
                  </div>
                ))}
              </Elem>

              <Elem name="pagination">
                <Pagination
                  name="aviation-projects"
                  label="Projects"
                  page={currentPage}
                  totalItems={totalItems}
                  urlParamName="page"
                  pageSize={pageSize}
                  pageSizeOptions={[12, 24, 48]}
                  onPageLoad={(page) => loadNextPage(page)}
                />
              </Elem>
            </>
          ) : (
            <Elem name="empty">
              <p>No projects found. Create a project and upload aviation incidents to get started.</p>
              <Button
                look="primary"
                onClick={() => setUploadModalOpen(true)}
              >
                Upload Incidents
              </Button>
            </Elem>
          )}
        </Elem>

        <Elem name="error" case="error">
          <p>Failed to load projects. Please try again.</p>
          <Button onClick={() => fetchProjects()}>Retry</Button>
        </Elem>
      </Oneof>

      {uploadModalOpen && (
        <ExcelUploadModal
          projectId={selectedProjectId}
          onClose={() => {
            setUploadModalOpen(false);
            setSelectedProjectId(null);
          }}
          onSuccess={handleUploadComplete}
        />
      )}
    </Block>
  );
};
