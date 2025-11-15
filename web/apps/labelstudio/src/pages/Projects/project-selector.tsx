import React, { useEffect, useState, useContext, useRef } from 'react';
import { Select } from '@humansignal/ui';
import { Block, Elem } from '../../utils/bem';
import { ApiContext } from '../../providers/ApiProvider';
import './project-selector.scss';

interface Project {
  id: number;
  title: string;
}

interface ProjectSelectorProps {
  selectedProject?: number | null;
  onProjectChange?: (projectId: number | null) => void;
}

export const ProjectSelector: React.FC<ProjectSelectorProps> = ({ selectedProject, onProjectChange }) => {
  const api = useContext(ApiContext);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasAutoSelected = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const fetchProjects = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await api.callApi('projects', {
          params: {
            page_size: 1000,
            include: 'id,title',
          },
        });

        if (cancelled) return;

        if (response?.results) {
          setProjects(response.results);
        } else if (response?.error) {
          setError(response.error);
        }
      } catch (err) {
        if (!cancelled) {
          setError('Failed to load projects');
          console.error('Error fetching projects:', err);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchProjects();

    return () => {
      cancelled = true;
    };
  }, [api]);

  useEffect(() => {
    if (!selectedProject && projects.length > 0 && !isLoading && !hasAutoSelected.current) {
      hasAutoSelected.current = true;
      const firstProjectId = projects[0].id;
      onProjectChange?.(firstProjectId);
    }
  }, [projects, selectedProject, isLoading]);

  const handleProjectChange = (value: number) => {
    onProjectChange?.(value);
  };

  const projectOptions = projects.map((project) => ({
    value: project.id,
    label: project.title || `Project ${project.id}`,
  }));

  const selectedOption = projectOptions.find((opt) => opt.value === selectedProject);

  if (error) {
    return (
      <Block name="project-selector">
        <Elem name="error">Error loading projects: {error}</Elem>
      </Block>
    );
  }

  if (isLoading) {
    return (
      <Block name="project-selector">
        <Elem name="loading">Loading projects...</Elem>
      </Block>
    );
  }

  if (projects.length === 0) {
    return (
      <Block name="project-selector">
        <Elem name="empty">No projects available</Elem>
      </Block>
    );
  }

  return (
    <Block name="project-selector">
      <Elem name="label">Filter by Project:</Elem>
      <Elem name="select">
        <Select
          options={projectOptions}
          value={selectedOption}
          onChange={(option: any) => handleProjectChange(option.value)}
          searchable={projects.length > 10}
          searchPlaceholder="Search projects..."
          disabled={projects.length === 1}
          size="medium"
        />
      </Elem>
    </Block>
  );
};