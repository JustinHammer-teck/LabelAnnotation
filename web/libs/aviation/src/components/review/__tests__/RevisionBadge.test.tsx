import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RevisionBadge } from '../RevisionBadge';

describe('RevisionBadge', () => {
  it('renders "Needs Revision" badge', () => {
    render(<RevisionBadge fieldName="threat_type" comment="Please fix" />);
    expect(screen.getByText('Needs Revision')).toBeInTheDocument();
  });

  it('shows tooltip with comment on hover', async () => {
    const user = userEvent.setup();
    render(<RevisionBadge fieldName="threat_type" comment="Please fix this" />);

    const badge = screen.getByTestId('revision-badge');
    await user.hover(badge);

    await waitFor(() => {
      // Radix Tooltip may render content in multiple places
      expect(screen.getAllByText('Please fix this').length).toBeGreaterThan(0);
    });
  });

  it('does not render when resolved', () => {
    const { container } = render(
      <RevisionBadge fieldName="threat_type" comment="Fixed" isResolved />
    );
    expect(container.firstChild).toBeNull();
  });

  it('calls onMarkResolved when button clicked', async () => {
    const user = userEvent.setup();
    const onMarkResolved = jest.fn();
    render(
      <RevisionBadge
        fieldName="threat_type"
        comment="Fix it"
        onMarkResolved={onMarkResolved}
      />
    );

    const badge = screen.getByTestId('revision-badge');
    await user.hover(badge);

    await waitFor(() => {
      // Radix Tooltip may render content in multiple places
      expect(screen.getAllByText('Mark as Resolved').length).toBeGreaterThan(0);
    });

    // Click the first "Mark as Resolved" button
    await user.click(screen.getAllByText('Mark as Resolved')[0]);

    expect(onMarkResolved).toHaveBeenCalledTimes(1);
  });

  it('does not show "Mark as Resolved" button when callback not provided', async () => {
    const user = userEvent.setup();
    render(<RevisionBadge fieldName="threat_type" comment="Fix it" />);

    const badge = screen.getByTestId('revision-badge');
    await user.hover(badge);

    await waitFor(() => {
      // Radix Tooltip may render content in multiple places
      expect(screen.getAllByText('Fix it').length).toBeGreaterThan(0);
    });

    expect(screen.queryByText('Mark as Resolved')).not.toBeInTheDocument();
  });

  it('does not render when no comment provided', () => {
    const { container } = render(<RevisionBadge fieldName="threat_type" />);
    expect(container.firstChild).toBeNull();
  });

  it('has proper data attributes', () => {
    render(<RevisionBadge fieldName="threat_type" comment="Fix it" />);

    const badge = screen.getByTestId('revision-badge');
    expect(badge).toHaveAttribute('data-field', 'threat_type');
  });

  it('has proper aria-label for accessibility', () => {
    render(<RevisionBadge fieldName="threat_type" comment="Fix it" />);

    const badge = screen.getByTestId('revision-badge');
    expect(badge).toHaveAttribute('aria-label', 'View revision information for threat_type');
  });

  it('displays reviewer name when provided', async () => {
    const user = userEvent.setup();
    render(
      <RevisionBadge
        fieldName="threat_type"
        comment="Fix it"
        reviewerName="John Doe"
      />
    );

    const badge = screen.getByTestId('revision-badge');
    await user.hover(badge);

    await waitFor(() => {
      // Radix Tooltip may render content in multiple places
      expect(screen.getAllByText(/Reviewer:/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/John Doe/).length).toBeGreaterThan(0);
    });
  });

  it('displays formatted date when reviewedAt provided', async () => {
    const user = userEvent.setup();
    render(
      <RevisionBadge
        fieldName="threat_type"
        comment="Fix it"
        reviewedAt="2024-01-15T10:30:00Z"
      />
    );

    const badge = screen.getByTestId('revision-badge');
    await user.hover(badge);

    await waitFor(() => {
      // Radix Tooltip may render content in multiple places
      expect(screen.getAllByText(/Requested:/).length).toBeGreaterThan(0);
    });
  });

  it('displays both reviewer name and date when both provided', async () => {
    const user = userEvent.setup();
    render(
      <RevisionBadge
        fieldName="threat_type"
        comment="Fix it"
        reviewerName="John Doe"
        reviewedAt="2024-01-15T10:30:00Z"
      />
    );

    const badge = screen.getByTestId('revision-badge');
    await user.hover(badge);

    await waitFor(() => {
      // Radix Tooltip may render content in multiple places
      expect(screen.getAllByText(/Reviewer:/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Requested:/).length).toBeGreaterThan(0);
    });
  });

  it('badge is focusable for keyboard accessibility', () => {
    render(<RevisionBadge fieldName="threat_type" comment="Fix it" />);

    const badge = screen.getByTestId('revision-badge');
    // Verify badge is a button (focusable by default)
    expect(badge.tagName).toBe('BUTTON');
    expect(badge).toHaveAttribute('type', 'button');
  });
});
