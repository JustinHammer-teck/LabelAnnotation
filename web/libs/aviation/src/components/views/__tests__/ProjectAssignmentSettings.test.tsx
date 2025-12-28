import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { Provider } from 'jotai';
import { ProjectAssignmentSettings } from '../ProjectAssignmentSettings';
import { AviationApiContext } from '../../../api/context';
import type { AviationApiClient } from '../../../api/api-client';
import type { AviationProjectAssignment } from '../../../types/assignment.types';

describe('ProjectAssignmentSettings', () => {
  let mockApiClient: Partial<AviationApiClient>;
  let mockShowToast: jest.Mock;

  const mockAssignments: AviationProjectAssignment[] = [
    { user_id: 1, user_email: 'user1@test.com', has_permission: true },
    { user_id: 2, user_email: 'user2@test.com', has_permission: false },
    { user_id: 3, user_email: 'user3@test.com', has_permission: false },
  ];

  beforeEach(() => {
    mockShowToast = jest.fn();

    mockApiClient = {
      getProjectAssignments: jest.fn().mockResolvedValue(mockAssignments),
      toggleProjectAssignment: jest.fn().mockResolvedValue(undefined),
    };
  });

  const renderComponent = (projectId = 42, currentUserId = 1) => {
    return render(
      <AviationApiContext.Provider value={mockApiClient as AviationApiClient}>
        <Provider>
          <ProjectAssignmentSettings
            projectId={projectId}
            currentUserId={currentUserId}
            showToast={mockShowToast}
          />
        </Provider>
      </AviationApiContext.Provider>
    );
  };

  describe('Rendering', () => {
    it('should render component with title', async () => {
      renderComponent();

      expect(screen.getByText(/Project Assignment/i)).toBeInTheDocument();
    });

    it('should show loading state initially', () => {
      renderComponent();

      expect(screen.getByText(/Loading/i)).toBeInTheDocument();
    });

    it('should render user table after loading', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
      });

      expect(screen.getByText('user1@test.com')).toBeInTheDocument();
      expect(screen.getByText('user2@test.com')).toBeInTheDocument();
      expect(screen.getByText('user3@test.com')).toBeInTheDocument();
    });

    it('should render checkboxes for each user', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
      });

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(3);
    });

    it('should show checked state for assigned users', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
      });

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes[0]).toBeChecked(); // user1 has permission
      expect(checkboxes[1]).not.toBeChecked(); // user2 no permission
      expect(checkboxes[2]).not.toBeChecked(); // user3 no permission
    });

    it('should render table headers', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
      });

      const headers = screen.getAllByRole('columnheader');
      expect(headers).toHaveLength(2);
      expect(headers[0]).toHaveTextContent('Email');
      expect(headers[1]).toHaveTextContent('Assigned');
    });
  });

  describe('Interactions', () => {
    it('should toggle assignment when checkbox clicked', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
      });

      const checkboxes = screen.getAllByRole('checkbox');

      // Click second checkbox (user2)
      fireEvent.click(checkboxes[1]);

      await waitFor(() => {
        expect(mockApiClient.toggleProjectAssignment).toHaveBeenCalledWith(42, {
          users: [{ user_id: 2, has_permission: true }],
        });
      });
    });

    it('should disable checkbox for current user', async () => {
      renderComponent(42, 1); // currentUserId = 1

      await waitFor(() => {
        expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
      });

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes[0]).toBeDisabled(); // First user is current user
      expect(checkboxes[1]).not.toBeDisabled();
    });

    it('should show tooltip on disabled current user checkbox', async () => {
      renderComponent(42, 1);

      await waitFor(() => {
        expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
      });

      const disabledRow = screen.getByText('user1@test.com').closest('tr');
      expect(disabledRow).toHaveAttribute('title', expect.stringContaining('yourself'));
    });

    it('should disable all checkboxes while toggling', async () => {
      let resolveToggle: (value: void) => void;
      const togglePromise = new Promise<void>((resolve) => {
        resolveToggle = resolve;
      });

      mockApiClient.toggleProjectAssignment = jest.fn().mockReturnValue(togglePromise);

      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
      });

      const checkboxes = screen.getAllByRole('checkbox');

      // Start toggle
      fireEvent.click(checkboxes[1]);

      // All non-current-user checkboxes should be disabled during toggle
      await waitFor(() => {
        expect(checkboxes[1]).toBeDisabled();
        expect(checkboxes[2]).toBeDisabled();
      });

      // Complete toggle
      resolveToggle!();

      await waitFor(() => {
        expect(checkboxes[1]).not.toBeDisabled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error message on fetch failure', async () => {
      mockApiClient.getProjectAssignments = jest
        .fn()
        .mockRejectedValue(new Error('Failed to load'));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Failed to load/i)).toBeInTheDocument();
      });
    });

    it('should show retry button on error', async () => {
      mockApiClient.getProjectAssignments = jest
        .fn()
        .mockRejectedValue(new Error('Failed to load'));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });
    });

    it('should retry fetch when retry button clicked', async () => {
      mockApiClient.getProjectAssignments = jest
        .fn()
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce(mockAssignments);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('user1@test.com')).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty message when no users', async () => {
      mockApiClient.getProjectAssignments = jest.fn().mockResolvedValue([]);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/No users found/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have accessible table structure', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
      });

      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();

      const headers = screen.getAllByRole('columnheader');
      expect(headers.length).toBeGreaterThan(0);
    });

    it('should have aria-labels on checkboxes', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
      });

      const checkbox = screen.getAllByRole('checkbox')[0];
      expect(checkbox).toHaveAttribute('aria-label', expect.any(String));
    });
  });

  describe('Styling', () => {
    it('should apply CSS module classes', async () => {
      const { container } = renderComponent();

      await waitFor(() => {
        expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
      });

      const table = container.querySelector('table');
      expect(table?.className).toContain('assignmentTable');
    });

    it('should highlight assigned rows', async () => {
      const { container } = renderComponent();

      await waitFor(() => {
        expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
      });

      const rows = container.querySelectorAll('tbody tr');
      expect(rows[0].className).toContain('assigned'); // user1 is assigned
      expect(rows[1].className).not.toContain('assigned');
    });
  });
});
