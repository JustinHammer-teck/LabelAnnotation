/**
 * Tests for review test utilities.
 * Validates that shared test helpers work correctly for review integration testing.
 *
 * @module test-utils/__tests__/review-test-utils.test
 */
import React from 'react';
import { screen } from '@testing-library/react';
import {
  createMockReviewContext,
  createReviewTestWrapper,
  renderWithReviewContext,
  type ReviewTestContext,
} from '../review-test-utils';
import { useReviewContext } from '../../context/ReviewContext';
import type { UserRole } from '../../types';

describe('Review Test Utilities', () => {
  describe('createMockReviewContext', () => {
    it('should export createMockReviewContext function', () => {
      expect(typeof createMockReviewContext).toBe('function');
    });

    it('should create default mock context with annotator role', () => {
      const context = createMockReviewContext();
      expect(context.userRole).toBe('annotator');
    });

    it('should create mock context with isReviewMode false by default', () => {
      const context = createMockReviewContext();
      expect(context.isReviewMode).toBe(false);
    });

    it('should create mock context with empty pendingFeedbacks by default', () => {
      const context = createMockReviewContext();
      expect(context.pendingFeedbacks).toEqual([]);
    });

    it('should create mock context with mock functions', () => {
      const context = createMockReviewContext();
      expect(typeof context.onApprove).toBe('function');
      expect(typeof context.onReject).toBe('function');
      expect(typeof context.onRequestRevision).toBe('function');
      expect(typeof context.onClearStatus).toBe('function');
    });

    it('should allow overriding userRole', () => {
      const context = createMockReviewContext({ userRole: 'manager' });
      expect(context.userRole).toBe('manager');
    });

    it('should allow overriding isReviewMode', () => {
      const context = createMockReviewContext({ isReviewMode: true });
      expect(context.isReviewMode).toBe(true);
    });

    it('should allow overriding pendingFeedbacks', () => {
      const feedbacks = [
        { field_name: 'threat_type_l1' as const, feedback_type: 'revision' as const, feedback_comment: 'test' },
      ];
      const context = createMockReviewContext({ pendingFeedbacks: feedbacks });
      expect(context.pendingFeedbacks).toEqual(feedbacks);
    });

    it('should create callable mock functions', () => {
      const context = createMockReviewContext();
      context.onApprove();
      context.onReject();
      context.onRequestRevision();
      context.onClearStatus();

      expect(context.onApprove).toHaveBeenCalled();
      expect(context.onReject).toHaveBeenCalled();
      expect(context.onRequestRevision).toHaveBeenCalled();
      expect(context.onClearStatus).toHaveBeenCalled();
    });

    it('should support all valid user roles', () => {
      const roles: UserRole[] = ['admin', 'manager', 'researcher', 'annotator'];
      roles.forEach((role) => {
        const context = createMockReviewContext({ userRole: role });
        expect(context.userRole).toBe(role);
      });
    });
  });

  describe('createReviewTestWrapper', () => {
    it('should export createReviewTestWrapper function', () => {
      expect(typeof createReviewTestWrapper).toBe('function');
    });

    it('should create wrapper with default options', () => {
      const wrapper = createReviewTestWrapper();
      expect(wrapper).toBeDefined();
    });

    it('should create wrapper with specified user role', () => {
      const wrapper = createReviewTestWrapper({ userRole: 'manager' });
      expect(wrapper).toBeDefined();
    });

    it('should create wrapper with isReviewMode option', () => {
      const wrapper = createReviewTestWrapper({ isReviewMode: true });
      expect(wrapper).toBeDefined();
    });

    it('should create wrapper with pendingFeedbacks option', () => {
      const feedbacks = [
        { field_name: 'event_description' as const, feedback_type: 'partial' as const, feedback_comment: 'test' },
      ];
      const wrapper = createReviewTestWrapper({ pendingFeedbacks: feedbacks });
      expect(wrapper).toBeDefined();
    });

    it('should return a valid React functional component', () => {
      const Wrapper = createReviewTestWrapper();
      expect(Wrapper).toBeDefined();
      expect(typeof Wrapper).toBe('function');
    });
  });

  describe('renderWithReviewContext', () => {
    it('should export renderWithReviewContext function', () => {
      expect(typeof renderWithReviewContext).toBe('function');
    });

    it('should render a simple element', () => {
      const { container } = renderWithReviewContext(<div data-testid="test">Test</div>);
      expect(container.querySelector('[data-testid="test"]')).toBeTruthy();
    });

    it('should render with specified user role', () => {
      const { container } = renderWithReviewContext(
        <div data-testid="test">Test</div>,
        { userRole: 'manager' }
      );
      expect(container.querySelector('[data-testid="test"]')).toBeTruthy();
    });

    it('should render with review mode enabled', () => {
      const { container } = renderWithReviewContext(
        <div data-testid="test">Test</div>,
        { isReviewMode: true }
      );
      expect(container.querySelector('[data-testid="test"]')).toBeTruthy();
    });

    it('should provide ReviewContext to child components', () => {
      const TestConsumer = () => {
        const context = useReviewContext();
        return <span data-testid="context-role">{context.userRole}</span>;
      };

      renderWithReviewContext(<TestConsumer />, { userRole: 'researcher' });

      expect(screen.getByTestId('context-role')).toHaveTextContent('researcher');
    });

    it('should provide canReview based on user role', () => {
      const TestConsumer = () => {
        const context = useReviewContext();
        return <span data-testid="can-review">{String(context.canReview)}</span>;
      };

      renderWithReviewContext(<TestConsumer />, { userRole: 'manager' });

      expect(screen.getByTestId('can-review')).toHaveTextContent('true');
    });
  });

  describe('ReviewTestContext interface', () => {
    it('should have all required properties', () => {
      const context: ReviewTestContext = {
        userRole: 'annotator',
        isReviewMode: false,
        pendingFeedbacks: [],
        onApprove: jest.fn(),
        onReject: jest.fn(),
        onRequestRevision: jest.fn(),
        onClearStatus: jest.fn(),
      };

      expect(context).toHaveProperty('userRole');
      expect(context).toHaveProperty('isReviewMode');
      expect(context).toHaveProperty('pendingFeedbacks');
      expect(context).toHaveProperty('onApprove');
      expect(context).toHaveProperty('onReject');
      expect(context).toHaveProperty('onRequestRevision');
      expect(context).toHaveProperty('onClearStatus');
    });
  });
});
