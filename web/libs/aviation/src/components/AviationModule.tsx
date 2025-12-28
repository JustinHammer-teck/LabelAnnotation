import { type FC, useCallback, useEffect, useState } from 'react';
import { Switch, Route, Redirect, useHistory, useParams, useRouteMatch } from 'react-router-dom';
import { useCurrentUserAtom } from '@humansignal/core/lib/hooks/useCurrentUser';
import { AviationShell } from './layout';
import { ProjectListView, TaskListView, AnnotationView, CreateProjectModal, ProjectAssignmentSettings } from './views';
import { ConfirmDialog } from './common';
import { useProjects, useAviationToast } from '../hooks';
import type { AviationProject } from '../types';
import { initAviationI18n } from '../i18n';

// Initialize aviation i18n resources
initAviationI18n();

const ProjectListPage: FC = () => {
  const history = useHistory();
  const { projects, loading, error, fetchProjects, deleteProject } = useProjects();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<number | null>(null);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleSelect = useCallback(
    (id: number) => {
      history.push(`/aviation/projects/${id}/events`);
    },
    [history]
  );

  const handleCreate = useCallback(() => {
    setCreateModalOpen(true);
  }, []);

  const handleCreateSuccess = useCallback(
    (project: AviationProject) => {
      setCreateModalOpen(false);
      history.push(`/aviation/projects/${project.id}/events`);
    },
    [history]
  );

  const handleDeleteRequest = useCallback((id: number) => {
    setProjectToDelete(id);
    setDeleteConfirmOpen(true);
  }, []);

  const handleSettings = useCallback(
    (id: number) => {
      history.push(`/aviation/projects/${id}/settings/assignment`);
    },
    [history]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (projectToDelete !== null) {
      await deleteProject(projectToDelete);
      setProjectToDelete(null);
    }
  }, [projectToDelete, deleteProject]);

  const projectToDeleteName = projectToDelete
    ? projects.find((p) => p.id === projectToDelete)?.project.title
    : '';

  return (
    <>
      <ProjectListView
        projects={projects}
        loading={loading}
        error={error}
        onSelect={handleSelect}
        onCreate={handleCreate}
        onDelete={handleDeleteRequest}
        onSettings={handleSettings}
        onRetry={fetchProjects}
      />
      <CreateProjectModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={handleDeleteConfirm}
        title="Delete Project"
        description={`Are you sure you want to delete "${projectToDeleteName}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
      />
    </>
  );
};

const TaskListPage: FC = () => {
  const history = useHistory();
  const { projectId } = useParams<{ projectId: string }>();
  const numericProjectId = Number(projectId);

  const handleSelect = useCallback(
    (eventId: number) => {
      history.push(`/aviation/projects/${projectId}/events/${eventId}`);
    },
    [history, projectId]
  );

  if (!projectId || Number.isNaN(numericProjectId)) {
    return <Redirect to="/aviation/projects" />;
  }

  return (
    <TaskListView
      projectId={numericProjectId}
      onSelect={handleSelect}
    />
  );
};

const AnnotationPage: FC = () => {
  const { projectId, eventId } = useParams<{ projectId: string; eventId: string }>();
  const numericProjectId = Number(projectId);
  const numericEventId = Number(eventId);

  if (!projectId || Number.isNaN(numericProjectId) || !eventId || Number.isNaN(numericEventId)) {
    return <Redirect to="/aviation/projects" />;
  }

  return <AnnotationView eventId={numericEventId} projectId={numericProjectId} />;
};

const ProjectAssignmentPage: FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const numericProjectId = Number(projectId);
  const { user } = useCurrentUserAtom();
  const toast = useAviationToast();

  if (!projectId || Number.isNaN(numericProjectId)) {
    return <Redirect to="/aviation/projects" />;
  }

  const handleShowToast = (options: { message: string; type: 'success' | 'error' }) => {
    if (!toast) return;
    if (options.type === 'success') {
      toast.success(options.message);
    } else {
      toast.error(options.message);
    }
  };

  return (
    <ProjectAssignmentSettings
      projectId={numericProjectId}
      currentUserId={user?.id ?? 0}
      showToast={handleShowToast}
    />
  );
};

export const AviationModule: FC = () => {
  const { path } = useRouteMatch();

  return (
    <AviationShell>
      <Switch>
        <Route exact path={path}>
          <Redirect to={`${path}/projects`} />
        </Route>
        <Route exact path={`${path}/projects`}>
          <ProjectListPage />
        </Route>
        <Route exact path={`${path}/projects/:projectId/events`}>
          <TaskListPage />
        </Route>
        <Route exact path={`${path}/projects/:projectId/events/:eventId`}>
          <AnnotationPage />
        </Route>
        <Route exact path={`${path}/projects/:projectId/settings/assignment`}>
          <ProjectAssignmentPage />
        </Route>
        <Route path={`${path}/tasks`}>
          <Redirect to={`${path}/projects`} />
        </Route>
      </Switch>
    </AviationShell>
  );
};

export default AviationModule;
