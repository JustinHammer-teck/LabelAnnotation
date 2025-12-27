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
      expect(screen.getByText('Please fix this')).toBeInTheDocument();
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
      expect(screen.getByText('Mark as Resolved')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Mark as Resolved'));

    expect(onMarkResolved).toHaveBeenCalledTimes(1);
  });

  it('does not show "Mark as Resolved" button when callback not provided', async () => {
    const user = userEvent.setup();
    render(<RevisionBadge fieldName="threat_type" comment="Fix it" />);

    const badge = screen.getByTestId('revision-badge');
    await user.hover(badge);

    await waitFor(() => {
      expect(screen.getByText('Fix it')).toBeInTheDocument();
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
      expect(screen.getByText(/Reviewer: John Doe/)).toBeInTheDocument();
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
      expect(screen.getByText(/Requested:/)).toBeInTheDocument();
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
      expect(screen.getByText(/Reviewer: John Doe/)).toBeInTheDocument();
      expect(screen.getByText(/Requested:/)).toBeInTheDocument();
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
