import React, { useState, useEffect, useContext } from 'react';
import { useHistory } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { Button, Pagination, Spinner } from '../../../components';
import { ApiContext } from '../../../providers/ApiProvider';
import { Oneof } from '../../../components/Oneof/Oneof';
import { ExcelUploadModal } from '../components/ExcelUploadModal/ExcelUploadModal';
import { AviationProjectModal } from '../components/AviationProjectModal/AviationProjectModal';
import { useAbortController } from '@humansignal/core';
import { Empty } from 'antd';
import { PlusOutlined, UploadOutlined, FolderOpenOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
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
  const { t } = useTranslation();
  const abortController = useAbortController();
  const [projects, setProjects] = useState<Project[]>([]);
  const [networkState, setNetworkState] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const pageSize = 12;

  const fetchProjects = async (page = currentPage) => {
    setNetworkState('loading');
    abortController.renew();

    try {
      const data = await api.callApi('aviationProjects', {
        params: {
          page,
          page_size: pageSize,
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

  const handleEditClick = (projectId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedProjectId(projectId);
    setProjectModalOpen(true);
  };

  const handleDeleteClick = async (projectId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(t('aviation.project.confirm_delete', 'Are you sure you want to delete this project?'))) {
      return;
    }
    try {
      await api.callApi('deleteAviationProject', {
        params: { pk: projectId },
      });
      fetchProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const handleProjectModalSuccess = () => {
    setProjectModalOpen(false);
    setSelectedProjectId(null);
    fetchProjects();
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <div className={styles.container}>
      {projects.length > 0 && (
        <div className={styles.header}>
          <div className={styles.headerButtons}>
            <Button
              look="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setSelectedProjectId(null);
                setProjectModalOpen(true);
              }}
            >
              {t('aviation.project.create_project')}
            </Button>
            <Button
              icon={<UploadOutlined />}
              onClick={() => {
                setSelectedProjectId(null);
                setUploadModalOpen(true);
              }}
            >
              {t('aviation.project.upload_incidents', 'Upload Incidents')}
            </Button>
          </div>
        </div>
      )}

      <Oneof value={networkState}>
        <div className={styles.loading} case="loading">
          <Spinner size={64} />
        </div>

        <div className={styles.content} case="loaded">
          {projects.length > 0 ? (
            <>
              <div className={styles.list}>
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className={styles.projectCard}
                    onClick={() => handleProjectClick(project.id)}
                  >
                    <div className={styles.cardHeader}>
                      <div className={styles.cardTitle}>{project.title}</div>
                      <div className={styles.cardActions}>
                        <Button
                          size="small"
                          icon={<UploadOutlined />}
                          onClick={(e) => handleUploadClick(project.id, e)}
                        >
                          {t('aviation.project.upload', 'Upload')}
                        </Button>
                        <Button
                          size="small"
                          icon={<EditOutlined />}
                          onClick={(e) => handleEditClick(project.id, e)}
                        >
                          {t('aviation.project.edit', 'Edit')}
                        </Button>
                        <Button
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={(e) => handleDeleteClick(project.id, e)}
                        >
                          {t('aviation.project.delete', 'Delete')}
                        </Button>
                      </div>
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
                        {format(parseISO(project.created_at), "dd MMM yyyy, HH:mm")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.pagination}>
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
              </div>
            </>
          ) : (
            <div className={styles.empty}>
              <Empty
                image={<FolderOpenOutlined className={styles.emptyIcon} />}
                imageStyle={{ height: 'auto' }}
                description={
                  <div className={styles.emptyDescription}>
                    <div className={styles.emptyTitle}>
                      {t('aviation.project.empty_state_title', 'No Projects Yet')}
                    </div>
                    <div className={styles.emptyText}>
                      {t('aviation.project.empty_state_message', 'Create your first aviation safety project to start tracking and analyzing safety incidents.')}
                    </div>
                  </div>
                }
              >
                <div className={styles.emptyAction}>
                  <Button
                    look="primary"
                    icon={<PlusOutlined />}
                    size="large"
                    onClick={() => setProjectModalOpen(true)}
                  >
                    {t('aviation.project.create_project')}
                  </Button>
                </div>
              </Empty>
            </div>
          )}
        </div>

        <div className={styles.error} case="error">
          <p>Failed to load projects. Please try again.</p>
          <Button onClick={() => fetchProjects()}>Retry</Button>
        </div>
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

      {projectModalOpen && (
        <AviationProjectModal
          projectId={selectedProjectId}
          onClose={() => {
            setProjectModalOpen(false);
            setSelectedProjectId(null);
          }}
          onSuccess={handleProjectModalSuccess}
        />
      )}
    </div>
  );
};
