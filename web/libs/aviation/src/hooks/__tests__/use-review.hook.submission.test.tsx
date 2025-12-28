// Mock the API error toast hook before any imports to avoid SVG import errors
jest.mock('../use-api-error-toast.hook', () => ({
  useApiErrorToast: () => ({
    handleApiError: jest.fn(),
    withErrorToast: jest.fn(),
  }),
}));

// Mock the toast hook to avoid @humansignal/ui import
jest.mock('../use-toast.hook', () => ({
  useAviationToast: () => ({
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  }),
}));

import { renderHook } from '@testing-library/react';
import { Provider, createStore } from 'jotai';
import type { ReactNode } from 'react';
import { useReview } from '../use-review.hook';
import {
  pendingRevisionFieldsAtom,
  resolvedFieldsAtom,
  failedItemIdsAtom,
  currentReviewItemIdAtom,
  EMPTY_FAILED_ITEM_IDS,
} from '../../stores/review.store';
import { AviationApiContext } from '../../api/context';
import type { AviationApiClient } from '../../api/api-client';
import type { ReviewableFieldName } from '../../types/review.types';

/**
 * Creates a mock API client with jest mocks for all review methods.
 */
const createMockApiClient = (): jest.Mocked<Pick<AviationApiClient, 'approveItem' | 'rejectItem' | 'requestRevision' | 'resubmitItem' | 'getReviewHistory'>> & Partial<AviationApiClient> => ({
  approveItem: jest.fn(),
  rejectItem: jest.fn(),
  requestRevision: jest.fn(),
  resubmitItem: jest.fn(),
  getReviewHistory: jest.fn(),
});

/**
 * Helper to create a Jotai provider wrapper for testing with API client.
 * Takes optional initialState to set atoms before rendering.
 *
 * IMPORTANT: When setting pendingRevisionFields or resolvedFields, you must also
 * set currentReviewItemId to match the labelingItemId passed to useReview().
 * Otherwise, the hook's useEffect will reset these atoms on first render.
 */
const createWrapper = (
  mockApiClient?: Partial<AviationApiClient>,
  initialState?: {
    pendingRevisionFields?: ReviewableFieldName[];
    resolvedFields?: Set<ReviewableFieldName>;
    currentReviewItemId?: number | null;
  }
) => {
  const store = createStore();
  const apiClient = mockApiClient ?? createMockApiClient();

  // Initialize failedItemIdsAtom with empty Set (required for hook to function)
  store.set(failedItemIdsAtom, EMPTY_FAILED_ITEM_IDS);

  // Set currentReviewItemId FIRST to prevent useEffect from resetting other atoms
  if (initialState?.currentReviewItemId !== undefined) {
    store.set(currentReviewItemIdAtom, initialState.currentReviewItemId);
  }

  // Set initial atom state before any rendering
  if (initialState?.pendingRevisionFields !== undefined) {
    store.set(pendingRevisionFieldsAtom, initialState.pendingRevisionFields);
  }
  if (initialState?.resolvedFields !== undefined) {
    store.set(resolvedFieldsAtom, initialState.resolvedFields);
  }

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <AviationApiContext.Provider value={apiClient as AviationApiClient}>
      <Provider store={store}>{children}</Provider>
    </AviationApiContext.Provider>
  );
  return { Wrapper, store, apiClient: apiClient as jest.Mocked<Pick<AviationApiClient, 'approveItem' | 'rejectItem' | 'requestRevision' | 'resubmitItem' | 'getReviewHistory'>> };
};

describe('useReview - Submission Logic', () => {
  it('should expose canResubmit, unresolvedFieldCount, and hasUnresolvedRevisions properties', () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useReview(123), { wrapper: Wrapper });

    expect(result.current).toHaveProperty('canResubmit');
    expect(result.current).toHaveProperty('unresolvedFieldCount');
    expect(result.current).toHaveProperty('hasUnresolvedRevisions');
  });

  it('should return canResubmit as true when no pending revision fields', () => {
    const { Wrapper } = createWrapper(undefined, {
      pendingRevisionFields: [],
      resolvedFields: new Set(),
      currentReviewItemId: 123,
    });

    const { result } = renderHook(() => useReview(123), { wrapper: Wrapper });

    expect(result.current.canResubmit).toBe(true);
    expect(result.current.unresolvedFieldCount).toBe(0);
    expect(result.current.hasUnresolvedRevisions).toBe(false);
  });

  it('should return canResubmit as false when pending revision fields exist and none resolved', () => {
    const { Wrapper } = createWrapper(undefined, {
      pendingRevisionFields: ['threat_type', 'error_type'] as ReviewableFieldName[],
      resolvedFields: new Set(),
      currentReviewItemId: 123,
    });

    const { result } = renderHook(() => useReview(123), { wrapper: Wrapper });

    expect(result.current.canResubmit).toBe(false);
    expect(result.current.unresolvedFieldCount).toBe(2);
    expect(result.current.hasUnresolvedRevisions).toBe(true);
  });

  it('should return canResubmit as false when some but not all fields resolved', () => {
    const { Wrapper } = createWrapper(undefined, {
      pendingRevisionFields: ['threat_type', 'error_type', 'uas_type'] as ReviewableFieldName[],
      resolvedFields: new Set(['threat_type'] as ReviewableFieldName[]),
      currentReviewItemId: 123,
    });

    const { result } = renderHook(() => useReview(123), { wrapper: Wrapper });

    expect(result.current.canResubmit).toBe(false);
    expect(result.current.unresolvedFieldCount).toBe(2);
    expect(result.current.hasUnresolvedRevisions).toBe(true);
  });

  it('should return canResubmit as true when all pending fields resolved', () => {
    const { Wrapper } = createWrapper(undefined, {
      pendingRevisionFields: ['threat_type', 'error_type'] as ReviewableFieldName[],
      resolvedFields: new Set(['threat_type', 'error_type'] as ReviewableFieldName[]),
      currentReviewItemId: 123,
    });

    const { result } = renderHook(() => useReview(123), { wrapper: Wrapper });

    expect(result.current.canResubmit).toBe(true);
    expect(result.current.unresolvedFieldCount).toBe(0);
    expect(result.current.hasUnresolvedRevisions).toBe(false);
  });

  it('should calculate unresolvedFieldCount correctly', () => {
    const { Wrapper } = createWrapper(undefined, {
      pendingRevisionFields: [
        'threat_type',
        'error_type',
        'uas_type',
        'threat_management'
      ] as ReviewableFieldName[],
      resolvedFields: new Set(['threat_type', 'uas_type'] as ReviewableFieldName[]),
      currentReviewItemId: 123,
    });

    const { result } = renderHook(() => useReview(123), { wrapper: Wrapper });

    expect(result.current.unresolvedFieldCount).toBe(2); // error_type and threat_management are unresolved
    expect(result.current.canResubmit).toBe(false);
    expect(result.current.hasUnresolvedRevisions).toBe(true);
  });
});
