import { createStore } from 'jotai';
import {
  pendingRevisionFieldsAtom,
  resolvedFieldsAtom,
  canResubmitAtom,
  unresolvedFieldCountAtom,
  hasUnresolvedRevisionsAtom,
  failedItemIdsAtom,
  EMPTY_FAILED_ITEM_IDS,
} from '../review.store';
import type { ReviewableFieldName } from '../../types/review.types';

describe('review.store - Submit Button Logic', () => {
  describe('canResubmitAtom', () => {
    it('should return true when no pending revision fields exist', () => {
      const store = createStore();
      store.set(pendingRevisionFieldsAtom, []);
      store.set(resolvedFieldsAtom, new Set());

      expect(store.get(canResubmitAtom)).toBe(true);
    });

    it('should return false when pending revision fields exist and none are resolved', () => {
      const store = createStore();
      store.set(pendingRevisionFieldsAtom, ['threat_type', 'error_type'] as ReviewableFieldName[]);
      store.set(resolvedFieldsAtom, new Set());

      expect(store.get(canResubmitAtom)).toBe(false);
    });

    it('should return false when some but not all revision fields are resolved', () => {
      const store = createStore();
      store.set(pendingRevisionFieldsAtom, ['threat_type', 'error_type'] as ReviewableFieldName[]);
      store.set(resolvedFieldsAtom, new Set(['threat_type'] as ReviewableFieldName[]));

      expect(store.get(canResubmitAtom)).toBe(false);
    });

    it('should return true when all pending revision fields are resolved', () => {
      const store = createStore();
      store.set(pendingRevisionFieldsAtom, ['threat_type', 'error_type'] as ReviewableFieldName[]);
      store.set(resolvedFieldsAtom, new Set(['threat_type', 'error_type'] as ReviewableFieldName[]));

      expect(store.get(canResubmitAtom)).toBe(true);
    });

    it('should handle empty pending fields with some resolved fields', () => {
      const store = createStore();
      store.set(pendingRevisionFieldsAtom, []);
      store.set(resolvedFieldsAtom, new Set(['threat_type'] as ReviewableFieldName[]));

      // No pending revisions to resolve = can resubmit
      expect(store.get(canResubmitAtom)).toBe(true);
    });
  });

  describe('unresolvedFieldCountAtom', () => {
    it('should return 0 when no pending revision fields exist', () => {
      const store = createStore();
      store.set(pendingRevisionFieldsAtom, []);
      store.set(resolvedFieldsAtom, new Set());

      expect(store.get(unresolvedFieldCountAtom)).toBe(0);
    });

    it('should return count of all pending fields when none are resolved', () => {
      const store = createStore();
      store.set(pendingRevisionFieldsAtom, ['threat_type', 'error_type', 'uas_type'] as ReviewableFieldName[]);
      store.set(resolvedFieldsAtom, new Set());

      expect(store.get(unresolvedFieldCountAtom)).toBe(3);
    });

    it('should return count of unresolved fields when some are resolved', () => {
      const store = createStore();
      store.set(pendingRevisionFieldsAtom, ['threat_type', 'error_type', 'uas_type'] as ReviewableFieldName[]);
      store.set(resolvedFieldsAtom, new Set(['threat_type'] as ReviewableFieldName[]));

      expect(store.get(unresolvedFieldCountAtom)).toBe(2);
    });

    it('should return 0 when all pending fields are resolved', () => {
      const store = createStore();
      store.set(pendingRevisionFieldsAtom, ['threat_type', 'error_type'] as ReviewableFieldName[]);
      store.set(resolvedFieldsAtom, new Set(['threat_type', 'error_type'] as ReviewableFieldName[]));

      expect(store.get(unresolvedFieldCountAtom)).toBe(0);
    });
  });

  describe('hasUnresolvedRevisionsAtom', () => {
    it('should return false when no pending revision fields exist', () => {
      const store = createStore();
      store.set(pendingRevisionFieldsAtom, []);
      store.set(resolvedFieldsAtom, new Set());

      expect(store.get(hasUnresolvedRevisionsAtom)).toBe(false);
    });

    it('should return true when pending revision fields exist and none are resolved', () => {
      const store = createStore();
      store.set(pendingRevisionFieldsAtom, ['threat_type', 'error_type'] as ReviewableFieldName[]);
      store.set(resolvedFieldsAtom, new Set());

      expect(store.get(hasUnresolvedRevisionsAtom)).toBe(true);
    });

    it('should return true when some but not all revision fields are resolved', () => {
      const store = createStore();
      store.set(pendingRevisionFieldsAtom, ['threat_type', 'error_type', 'uas_type'] as ReviewableFieldName[]);
      store.set(resolvedFieldsAtom, new Set(['threat_type'] as ReviewableFieldName[]));

      expect(store.get(hasUnresolvedRevisionsAtom)).toBe(true);
    });

    it('should return false when all pending revision fields are resolved', () => {
      const store = createStore();
      store.set(pendingRevisionFieldsAtom, ['threat_type', 'error_type'] as ReviewableFieldName[]);
      store.set(resolvedFieldsAtom, new Set(['threat_type', 'error_type'] as ReviewableFieldName[]));

      expect(store.get(hasUnresolvedRevisionsAtom)).toBe(false);
    });

    it('should return false when no pending fields exist but some resolved fields present', () => {
      const store = createStore();
      store.set(pendingRevisionFieldsAtom, []);
      store.set(resolvedFieldsAtom, new Set(['threat_type'] as ReviewableFieldName[]));

      expect(store.get(hasUnresolvedRevisionsAtom)).toBe(false);
    });
  });
});

describe('review.store - Failed Item Tracking', () => {
  describe('failedItemIdsAtom', () => {
    it('should initialize with empty Set', () => {
      const store = createStore();
      const failedIds = store.get(failedItemIdsAtom);
      expect(failedIds).toEqual(new Set<number>());
      expect(failedIds.size).toBe(0);
    });

    it('should allow adding failed item IDs', () => {
      const store = createStore();
      const newSet = new Set([123, 456]);
      store.set(failedItemIdsAtom, newSet);
      const result = store.get(failedItemIdsAtom);
      expect(result).toEqual(newSet);
      expect(result.has(123)).toBe(true);
      expect(result.has(456)).toBe(true);
    });

    it('should allow clearing failed item IDs using EMPTY_FAILED_ITEM_IDS', () => {
      const store = createStore();
      store.set(failedItemIdsAtom, new Set([789]));
      store.set(failedItemIdsAtom, EMPTY_FAILED_ITEM_IDS);
      const result = store.get(failedItemIdsAtom);
      expect(result.size).toBe(0);
    });
  });
});
