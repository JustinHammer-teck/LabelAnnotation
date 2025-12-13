import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { format } from 'date-fns';
import { Button, Spinner } from '../../../components';
import { Block, Elem } from '../../../utils/bem';
import { useAPI } from '../../../providers/ApiProvider';
import { Oneof } from '../../../components/Oneof/Oneof';
import { ExcelUploadModal } from '../components/ExcelUploadModal/ExcelUploadModal';
import styles from './AviationTaskList.module.scss';

interface Task {
  id: number;
  task_id: number;
  event_number?: string;
  date?: string;
  location?: string;
  airport?: string;
  flight_phase?: string;
  event_description?: string;
  annotations?: any[];
  total_annotations?: number;
  cancelled_annotations?: number;
}

interface Project {
  id: number;
  project_id: number;
  title: string;
}

type TaskStatus = 'not_started' | 'in_progress' | 'complete' | 'needs_review';
type FilterStatus = TaskStatus | 'all';

interface StatusInfo {
  status: TaskStatus;
  label: string;
  progress: number;
}

const STATUS_CONFIG: Record<TaskStatus, { label: string; icon: string; className: string }> = {
  not_started: { label: 'Not Started', icon: '○', className: styles.statusNotStarted },
  in_progress: { label: 'In Progress', icon: '◐', className: styles.statusInProgress },
  complete: { label: 'Complete', icon: '●', className: styles.statusComplete },
  needs_review: { label: 'Needs Review', icon: '⚠', className: styles.statusNeedsReview },
};

const SKELETON_ROWS = 8;
const SEARCH_DEBOUNCE_MS = 300;

export const AviationTaskList: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const api = useAPI();
  const history = useHistory();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [networkState, setNetworkState] = useState<string | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [airportFilter, setAirportFilter] = useState<string>('all');
  const [flightPhaseFilter, setFlightPhaseFilter] = useState<string>('all');

  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());

  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    searchDebounceRef.current = setTimeout(() => {
      setSearchQuery(value);
    }, SEARCH_DEBOUNCE_MS);
  };

  const clearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
  };

  const fetchProjectAndTasks = async () => {
    setNetworkState('loading');

    try {
      const projectData = await api.callApi('aviationProject', {
        params: { pk: projectId },
        errorFilter: (e: any) => e.error?.includes('aborted'),
      });

      if (projectData) {
        setProject(projectData as Project);
      }

      const tasksData = await api.callApi('aviationIncidents', {
        params: {
          project: projectData?.project_id,
          page_size: 1000,
        },
        errorFilter: (e: any) => e.error?.includes('aborted'),
      });

      if (tasksData) {
        const taskList = (tasksData as any).tasks ?? (tasksData as any).results ?? (tasksData as any) ?? [];
        setTasks(Array.isArray(taskList) ? taskList : []);
      }
      setNetworkState('loaded');
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setNetworkState('error');
    }
  };

  const handleTaskClick = (taskId: number) => {
    history.push(`/aviation/${projectId}/tasks/${taskId}`);
  };

  const handleUploadComplete = () => {
    setUploadModalOpen(false);
    fetchProjectAndTasks();
  };

  const getStatusInfo = useCallback((task: Task): StatusInfo => {
    const annotationCount = task.total_annotations || task.annotations?.length || 0;

    if (annotationCount === 0) {
      return { status: 'not_started', label: 'Not Started', progress: 0 };
    }

    const progress = Math.min(100, annotationCount * 20);

    if (progress >= 100) {
      return { status: 'complete', label: 'Complete', progress: 100 };
    }

    return { status: 'in_progress', label: 'In Progress', progress };
  }, []);

  const uniqueAirports = useMemo(() => {
    const airports = new Set<string>();
    tasks.forEach(task => {
      if (task.airport) {
        airports.add(task.airport);
      }
    });
    return Array.from(airports).sort();
  }, [tasks]);

  const uniqueFlightPhases = useMemo(() => {
    const phases = new Set<string>();
    tasks.forEach(task => {
      if (task.flight_phase) {
        phases.add(task.flight_phase);
      }
    });
    return Array.from(phases).sort();
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (statusFilter !== 'all') {
        const statusInfo = getStatusInfo(task);
        if (statusInfo.status !== statusFilter) return false;
      }

      if (airportFilter !== 'all') {
        if (task.airport !== airportFilter) return false;
      }

      if (flightPhaseFilter !== 'all') {
        if (task.flight_phase !== flightPhaseFilter) return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const searchFields = [
          task.event_number,
          task.location,
          task.airport,
          task.event_description,
        ];
        const matches = searchFields.some(field =>
          field?.toLowerCase().includes(query)
        );
        if (!matches) return false;
      }

      return true;
    });
  }, [tasks, statusFilter, airportFilter, flightPhaseFilter, searchQuery, getStatusInfo]);

  const statusCounts = useMemo(() => {
    const counts = { not_started: 0, in_progress: 0, complete: 0, needs_review: 0 };
    tasks.forEach(task => {
      const statusInfo = getStatusInfo(task);
      counts[statusInfo.status]++;
    });
    return counts;
  }, [tasks, getStatusInfo]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== 'all') count++;
    if (airportFilter !== 'all') count++;
    if (flightPhaseFilter !== 'all') count++;
    if (searchQuery) count++;
    return count;
  }, [statusFilter, airportFilter, flightPhaseFilter, searchQuery]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTasks(new Set(filteredTasks.map(t => t.id)));
    } else {
      setSelectedTasks(new Set());
    }
  };

  const handleSelectTask = (taskId: number, checked: boolean) => {
    const newSelected = new Set(selectedTasks);
    if (checked) {
      newSelected.add(taskId);
    } else {
      newSelected.delete(taskId);
    }
    setSelectedTasks(newSelected);
  };

  const clearFilters = () => {
    setSearchInput('');
    setSearchQuery('');
    setStatusFilter('all');
    setAirportFilter('all');
    setFlightPhaseFilter('all');
  };

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || airportFilter !== 'all' || flightPhaseFilter !== 'all';

  useEffect(() => {
    fetchProjectAndTasks();
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [projectId]);

  const renderStatusBadge = (task: Task) => {
    const statusInfo = getStatusInfo(task);
    const config = STATUS_CONFIG[statusInfo.status];

    return (
      <div className={`${styles.statusBadge} ${config.className}`}>
        <span className={styles.statusIcon}>{config.icon}</span>
        <span className={styles.statusLabel}>{config.label}</span>
        {statusInfo.status === 'in_progress' && (
          <span className={styles.statusProgress} title="Based on annotation completion">
            ({statusInfo.progress}%)
          </span>
        )}
      </div>
    );
  };

  const renderSkeletonRows = () => {
    return Array.from({ length: SKELETON_ROWS }).map((_, index) => (
      <tr key={`skeleton-${index}`} className={styles.skeletonRow}>
        <td><div className={styles.skeletonCheckbox} /></td>
        <td><div className={styles.skeletonCell} style={{ width: '100px' }} /></td>
        <td><div className={styles.skeletonCell} style={{ width: '120px' }} /></td>
        <td><div className={styles.skeletonCell} style={{ width: '80px' }} /></td>
        <td><div className={styles.skeletonCell} style={{ width: '140px' }} /></td>
        <td><div className={styles.skeletonCell} style={{ width: '100px' }} /></td>
        <td><div className={styles.skeletonCell} style={{ width: '100px' }} /></td>
        <td><div className={styles.skeletonCell} style={{ width: '80px' }} /></td>
      </tr>
    ));
  };

  const renderEmptyState = () => {
    if (hasActiveFilters) {
      return (
        <div className={styles.emptyState}>
          <div className={styles.emptyIconWrapper}>
            <svg className={styles.emptyIconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </div>
          <h3 className={styles.emptyTitle}>No incidents match your search</h3>
          <p className={styles.emptyDescription}>
            {searchQuery && <>Searched: "{searchQuery}"<br /></>}
            Try adjusting your filters or search for different keywords.
          </p>
          <Button onClick={clearFilters}>Clear Filters</Button>
        </div>
      );
    }

    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIconWrapper}>
          <svg className={styles.emptyIconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
            <rect x="9" y="3" width="6" height="4" rx="1" />
            <path d="M9 12h6M9 16h6" />
          </svg>
        </div>
        <h3 className={styles.emptyTitle}>No incidents to annotate yet</h3>
        <p className={styles.emptyDescription}>
          Get started by uploading incident data or using our template.
        </p>
        <div className={styles.emptyActions}>
          <Button look="primary" onClick={() => setUploadModalOpen(true)}>
            Upload Excel
          </Button>
          <Button onClick={() => window.open(`/api/aviation/export/template/`, '_blank')}>
            Download Template
          </Button>
        </div>
      </div>
    );
  };

  const renderAllCompleteState = () => {
    const allComplete = tasks.length > 0 && statusCounts.complete === tasks.length;

    if (!allComplete || hasActiveFilters) return null;

    return (
      <div className={styles.completeBanner}>
        <svg className={styles.completeIconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        <span>All {tasks.length} incidents annotated!</span>
        <Button size="small" onClick={() => window.open(`/api/aviation/export/?project=${projectId}`, '_blank')}>
          Export Results
        </Button>
      </div>
    );
  };

  return (
    <Block name="aviation-tasks">
      <Elem name="header">
        <div className={styles.headerLeft}>
          <Button size="compact" onClick={() => history.push('/aviation')}>
            ← Back
          </Button>
          <Elem name="title">
            {project?.title || 'Loading...'}
          </Elem>
          {networkState === 'loaded' && (
            <span className={styles.taskCount}>{tasks.length} incidents</span>
          )}
        </div>
        <Button look="primary" onClick={() => setUploadModalOpen(true)}>
          Upload
        </Button>
      </Elem>

      {networkState === 'loaded' && tasks.length > 0 && (
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <svg className={styles.searchIconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search by event #, location, or description..."
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className={styles.searchInput}
            />
            {searchInput && (
              <button
                className={styles.clearSearch}
                onClick={clearSearch}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          <div className={styles.filters}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
              className={`${styles.filterSelect} ${statusFilter !== 'all' ? styles.filterActive : ''}`}
            >
              <option value="all">All Status ({tasks.length})</option>
              <option value="not_started">Not Started ({statusCounts.not_started})</option>
              <option value="in_progress">In Progress ({statusCounts.in_progress})</option>
              <option value="complete">Complete ({statusCounts.complete})</option>
            </select>

            {uniqueAirports.length > 0 && (
              <select
                value={airportFilter}
                onChange={(e) => setAirportFilter(e.target.value)}
                className={`${styles.filterSelect} ${airportFilter !== 'all' ? styles.filterActive : ''}`}
              >
                <option value="all">All Airports</option>
                {uniqueAirports.map(airport => (
                  <option key={airport} value={airport}>{airport}</option>
                ))}
              </select>
            )}

            {uniqueFlightPhases.length > 0 && (
              <select
                value={flightPhaseFilter}
                onChange={(e) => setFlightPhaseFilter(e.target.value)}
                className={`${styles.filterSelect} ${flightPhaseFilter !== 'all' ? styles.filterActive : ''}`}
              >
                <option value="all">All Flight Phases</option>
                {uniqueFlightPhases.map(phase => (
                  <option key={phase} value={phase}>{phase}</option>
                ))}
              </select>
            )}

            {hasActiveFilters && (
              <button className={styles.clearFilters} onClick={clearFilters}>
                Clear ({activeFilterCount})
              </button>
            )}
          </div>
        </div>
      )}

      {selectedTasks.size > 0 && (
        <div className={styles.batchActions}>
          <span className={styles.selectedCount}>
            {selectedTasks.size} selected
          </span>
          <Button size="small" onClick={() => alert('Export selected')}>Export</Button>
          <Button size="small" onClick={() => setSelectedTasks(new Set())}>Clear</Button>
        </div>
      )}

      {renderAllCompleteState()}

      <div role="status" aria-live="polite" className={styles.srOnly}>
        {networkState === 'loaded' && `${filteredTasks.length} of ${tasks.length} incidents shown`}
      </div>

      <Oneof value={networkState}>
        <Elem name="loading" case="loading">
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: '40px' }}></th>
                  <th>Event #</th>
                  <th>Date</th>
                  <th>Location</th>
                  <th>Airport</th>
                  <th>Flight Phase</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {renderSkeletonRows()}
              </tbody>
            </table>
          </div>
        </Elem>

        <Elem name="content" case="loaded">
          {filteredTasks.length > 0 ? (
            <div className={styles.tableWrapper}>
              <table className={styles.table} role="table" aria-label="Aviation incident tasks">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>
                      <input
                        type="checkbox"
                        checked={selectedTasks.size === filteredTasks.length && filteredTasks.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        aria-label="Select all tasks"
                      />
                    </th>
                    <th>Event #</th>
                    <th>Date</th>
                    <th>Location</th>
                    <th>Airport</th>
                    <th>Flight Phase</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((task) => {
                    return (
                      <tr
                        key={task.id}
                        className={`${styles.tableRow} ${selectedTasks.has(task.id) ? styles.selectedRow : ''}`}
                        onClick={() => handleTaskClick(task.task_id)}
                        role="row"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleTaskClick(task.task_id);
                        }}
                      >
                        <td onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedTasks.has(task.id)}
                            onChange={(e) => handleSelectTask(task.id, e.target.checked)}
                            aria-label={`Select task ${task.event_number || task.id}`}
                          />
                        </td>
                        <td className={styles.eventNumber}>{task.event_number || task.id}</td>
                        <td className={styles.date}>
                          {task.date
                            ? format(new Date(task.date), 'MMM dd, yyyy')
                            : '-'}
                        </td>
                        <td className={styles.location}>{task.location || '-'}</td>
                        <td className={styles.airport}>{task.airport || '-'}</td>
                        <td className={styles.flightPhase}>{task.flight_phase || '-'}</td>
                        <td>{renderStatusBadge(task)}</td>
                        <td>
                          <Button
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTaskClick(task.task_id);
                            }}
                          >
                            Annotate
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            renderEmptyState()
          )}
        </Elem>

        <Elem name="error" case="error">
          <div className={styles.errorState}>
            <div className={styles.emptyIconWrapper}>
              <svg className={styles.emptyIconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h3 className={styles.errorTitle}>Connection Error</h3>
            <p className={styles.errorDescription}>
              Unable to load tasks. Check your network connection.
            </p>
            <Button onClick={() => fetchProjectAndTasks()}>Retry</Button>
          </div>
        </Elem>
      </Oneof>

      {uploadModalOpen && (
        <ExcelUploadModal
          projectId={project?.project_id ?? null}
          onClose={() => setUploadModalOpen(false)}
          onSuccess={handleUploadComplete}
        />
      )}
    </Block>
  );
};
