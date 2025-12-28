import { render, screen, fireEvent } from '@testing-library/react';
import { ProjectListView } from '../ProjectListView';
import type { AviationProject } from '../../../types';

// Mock the Table component to simplify testing
jest.mock('../../common', () => ({
  Table: ({ columns, data, onRowClick, loading }: any) => {
    if (loading) {
      return <div data-testid="loading">Loading...</div>;
    }
    return (
      <table role="table">
        <thead>
          <tr>
            {columns.map((col: any) => (
              <th key={col.key} role="columnheader">{col.title}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row: any) => (
            <tr key={row.id} onClick={() => onRowClick(row)} role="row">
              {columns.map((col: any) => (
                <td key={col.key}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  },
  Button: ({ children, onClick, variant }: any) => (
    <button onClick={onClick} data-variant={variant}>{children}</button>
  ),
}));

const mockProjects: AviationProject[] = [
  {
    id: 1,
    project: { id: 1, title: 'Project Alpha' },
    default_workflow: 'standard',
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-02T10:00:00Z',
  } as AviationProject,
  {
    id: 2,
    project: { id: 2, title: 'Project Beta' },
    default_workflow: 'review',
    created_at: '2024-01-03T10:00:00Z',
    updated_at: '2024-01-04T10:00:00Z',
  } as AviationProject,
];

describe('ProjectListView', () => {
  const defaultProps = {
    projects: mockProjects,
    onSelect: jest.fn(),
    onCreate: jest.fn(),
    loading: false,
    error: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the title', () => {
      render(<ProjectListView {...defaultProps} />);
      expect(screen.getByText('Aviation Projects')).toBeInTheDocument();
    });

    it('should render Create Project button', () => {
      render(<ProjectListView {...defaultProps} />);
      expect(screen.getByText('Create Project')).toBeInTheDocument();
    });

    it('should render project list with correct data', () => {
      render(<ProjectListView {...defaultProps} />);
      expect(screen.getByText('Project Alpha')).toBeInTheDocument();
      expect(screen.getByText('Project Beta')).toBeInTheDocument();
    });

    it('should render settings button for each project when onSettings is provided', () => {
      const onSettings = jest.fn();
      render(<ProjectListView {...defaultProps} onSettings={onSettings} />);

      const settingsButtons = screen.getAllByLabelText('Project settings');
      expect(settingsButtons).toHaveLength(2);
    });

    it('should not render settings button when onSettings is not provided', () => {
      render(<ProjectListView {...defaultProps} />);

      const settingsButtons = screen.queryAllByLabelText('Project settings');
      expect(settingsButtons).toHaveLength(0);
    });

    it('should render delete button for each project when onDelete is provided', () => {
      const onDelete = jest.fn();
      render(<ProjectListView {...defaultProps} onDelete={onDelete} />);

      const deleteButtons = screen.getAllByLabelText('Delete project');
      expect(deleteButtons).toHaveLength(2);
    });

    it('should not render delete button when onDelete is not provided', () => {
      render(<ProjectListView {...defaultProps} />);

      const deleteButtons = screen.queryAllByLabelText('Delete project');
      expect(deleteButtons).toHaveLength(0);
    });

    it('should render both settings and delete buttons when both handlers provided', () => {
      const onSettings = jest.fn();
      const onDelete = jest.fn();
      render(<ProjectListView {...defaultProps} onSettings={onSettings} onDelete={onDelete} />);

      expect(screen.getAllByLabelText('Project settings')).toHaveLength(2);
      expect(screen.getAllByLabelText('Delete project')).toHaveLength(2);
    });
  });

  describe('Interactions', () => {
    it('should call onSettings with project id when settings button is clicked', () => {
      const onSettings = jest.fn();
      render(<ProjectListView {...defaultProps} onSettings={onSettings} />);

      const settingsButtons = screen.getAllByLabelText('Project settings');
      fireEvent.click(settingsButtons[0]);

      expect(onSettings).toHaveBeenCalledTimes(1);
      expect(onSettings).toHaveBeenCalledWith(1);
    });

    it('should call onSettings with correct id for second project', () => {
      const onSettings = jest.fn();
      render(<ProjectListView {...defaultProps} onSettings={onSettings} />);

      const settingsButtons = screen.getAllByLabelText('Project settings');
      fireEvent.click(settingsButtons[1]);

      expect(onSettings).toHaveBeenCalledWith(2);
    });

    it('should stop event propagation when settings button is clicked', () => {
      const onSettings = jest.fn();
      const onSelect = jest.fn();
      render(<ProjectListView {...defaultProps} onSettings={onSettings} onSelect={onSelect} />);

      const settingsButtons = screen.getAllByLabelText('Project settings');
      fireEvent.click(settingsButtons[0]);

      // onSettings should be called but onSelect should not
      expect(onSettings).toHaveBeenCalledWith(1);
      expect(onSelect).not.toHaveBeenCalled();
    });

    it('should call onDelete with project id when delete button is clicked', () => {
      const onDelete = jest.fn();
      render(<ProjectListView {...defaultProps} onDelete={onDelete} />);

      const deleteButtons = screen.getAllByLabelText('Delete project');
      fireEvent.click(deleteButtons[0]);

      expect(onDelete).toHaveBeenCalledTimes(1);
      expect(onDelete).toHaveBeenCalledWith(1);
    });

    it('should stop event propagation when delete button is clicked', () => {
      const onDelete = jest.fn();
      const onSelect = jest.fn();
      render(<ProjectListView {...defaultProps} onDelete={onDelete} onSelect={onSelect} />);

      const deleteButtons = screen.getAllByLabelText('Delete project');
      fireEvent.click(deleteButtons[0]);

      expect(onDelete).toHaveBeenCalledWith(1);
      expect(onSelect).not.toHaveBeenCalled();
    });

    it('should call onCreate when Create Project button is clicked', () => {
      const onCreate = jest.fn();
      render(<ProjectListView {...defaultProps} onCreate={onCreate} />);

      const createButton = screen.getByText('Create Project');
      fireEvent.click(createButton);

      expect(onCreate).toHaveBeenCalledTimes(1);
    });

    it('should call onSelect when row is clicked', () => {
      const onSelect = jest.fn();
      render(<ProjectListView {...defaultProps} onSelect={onSelect} />);

      const rows = screen.getAllByRole('row');
      // First row is header, so click second row (first data row)
      fireEvent.click(rows[1]);

      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith(1);
    });
  });

  describe('Loading State', () => {
    it('should show loading indicator when loading is true', () => {
      render(<ProjectListView {...defaultProps} projects={[]} loading={true} />);

      expect(screen.getByTestId('loading')).toBeInTheDocument();
    });

    it('should not show empty state when loading', () => {
      render(<ProjectListView {...defaultProps} projects={[]} loading={true} />);

      expect(screen.queryByText('No projects found')).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should show error message when error is provided', () => {
      render(<ProjectListView {...defaultProps} error="Network error" />);

      expect(screen.getByText('Failed to load projects')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    it('should show retry button when onRetry is provided', () => {
      const onRetry = jest.fn();
      render(<ProjectListView {...defaultProps} error="Network error" onRetry={onRetry} />);

      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('should not show retry button when onRetry is not provided', () => {
      render(<ProjectListView {...defaultProps} error="Network error" />);

      expect(screen.queryByText('Retry')).not.toBeInTheDocument();
    });

    it('should call onRetry when retry button is clicked', () => {
      const onRetry = jest.fn();
      render(<ProjectListView {...defaultProps} error="Network error" onRetry={onRetry} />);

      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);

      expect(onRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no projects and not loading', () => {
      render(<ProjectListView {...defaultProps} projects={[]} loading={false} />);

      expect(screen.getByText('No projects found')).toBeInTheDocument();
      expect(screen.getByText('Create your first aviation project to get started')).toBeInTheDocument();
    });

    it('should show Create Project button in empty state', () => {
      render(<ProjectListView {...defaultProps} projects={[]} loading={false} />);

      const createButtons = screen.getAllByText('Create Project');
      expect(createButtons.length).toBeGreaterThanOrEqual(1);
    });

    it('should not show empty state when there is an error', () => {
      render(<ProjectListView {...defaultProps} projects={[]} error="Error" />);

      expect(screen.queryByText('No projects found')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible table structure', () => {
      render(<ProjectListView {...defaultProps} />);

      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getAllByRole('columnheader').length).toBeGreaterThan(0);
      expect(screen.getAllByRole('row').length).toBeGreaterThan(0);
    });

    it('should have accessible labels on action buttons', () => {
      const onSettings = jest.fn();
      const onDelete = jest.fn();
      render(<ProjectListView {...defaultProps} onSettings={onSettings} onDelete={onDelete} />);

      const settingsButtons = screen.getAllByLabelText('Project settings');
      const deleteButtons = screen.getAllByLabelText('Delete project');

      expect(settingsButtons.length).toBe(2);
      expect(deleteButtons.length).toBe(2);
    });
  });
});
