import { useCallback } from 'react';
import { useAtom } from 'jotai';
import { useAviationApi } from '../api';
import { projectsAtom, projectsLoadingAtom, projectsErrorAtom, currentProjectAtom } from '../stores';
import type { CreateProjectData, AviationProject } from '../types';

export const useProjects = () => {
  const api = useAviationApi();
  const [projects, setProjects] = useAtom(projectsAtom);
  const [loading, setLoading] = useAtom(projectsLoadingAtom);
  const [error, setError] = useAtom(projectsErrorAtom);
  const [currentProject, setCurrentProject] = useAtom(currentProjectAtom);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getProjects();
      setProjects(data);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [api, setProjects, setLoading, setError]);

  const fetchProject = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getProject(id);
      setCurrentProject(data);
      return data;
    } catch (e) {
      setError(String(e));
      return null;
    } finally {
      setLoading(false);
    }
  }, [api, setCurrentProject, setLoading, setError]);

  const createProject = useCallback(async (data: CreateProjectData) => {
    setLoading(true);
    setError(null);
    try {
      const newProject = await api.createProject(data);
      setProjects(prev => [...prev, newProject]);
      return newProject;
    } catch (e) {
      setError(String(e));
      return null;
    } finally {
      setLoading(false);
    }
  }, [api, setProjects, setLoading, setError]);

  const updateProject = useCallback(async (id: number, data: Partial<AviationProject>) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await api.updateProject(id, data);
      setProjects(prev => prev.map(p => p.id === id ? updated : p));
      if (currentProject?.id === id) {
        setCurrentProject(updated);
      }
      return updated;
    } catch (e) {
      setError(String(e));
      return null;
    } finally {
      setLoading(false);
    }
  }, [api, currentProject, setProjects, setCurrentProject, setLoading, setError]);

  const deleteProject = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await api.deleteProject(id);
      setProjects(prev => prev.filter(p => p.id !== id));
      if (currentProject?.id === id) {
        setCurrentProject(null);
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [api, currentProject, setProjects, setCurrentProject, setLoading, setError]);

  return {
    projects,
    currentProject,
    loading,
    error,
    fetchProjects,
    fetchProject,
    createProject,
    updateProject,
    deleteProject,
    setCurrentProject,
  };
};
