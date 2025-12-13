import { type FC, useCallback, useEffect, useState } from 'react';
import { Switch, Route, Redirect, useHistory, useParams, useRouteMatch } from 'react-router-dom';
import { AviationShell } from './layout';
import { ProjectListView, TaskListView, AnnotationView, CreateProjectModal } from './views';
import { useProjects } from '../hooks';
import type { AviationProject } from '../types';

const ProjectListPage: FC = () => {
  const history = useHistory();
  const { projects, loading, error, fetchProjects } = useProjects();
  const [createModalOpen, setCreateModalOpen] = useState(false);

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

  return (
    <>
      <ProjectListView
        projects={projects}
        loading={loading}
        error={error}
        onSelect={handleSelect}
        onCreate={handleCreate}
        onRetry={fetchProjects}
      />
      <CreateProjectModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
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

  const handleUpload = useCallback(() => {
    history.push(`/aviation/projects/${projectId}/upload`);
  }, [history, projectId]);

  if (!projectId || Number.isNaN(numericProjectId)) {
    return <Redirect to="/aviation/projects" />;
  }

  return (
    <TaskListView
      projectId={numericProjectId}
      onSelect={handleSelect}
      onUpload={handleUpload}
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
        <Route path={`${path}/tasks`}>
          <Redirect to={`${path}/projects`} />
        </Route>
      </Switch>
    </AviationShell>
  );
};

export default AviationModule;
