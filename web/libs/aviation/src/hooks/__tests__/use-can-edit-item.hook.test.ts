import { renderHook } from '@testing-library/react';
import { useCanEditItem, type UseCanEditItemParams } from '../use-can-edit-item.hook';
import type { LabelingItem } from '../../types';
import type { UserRole } from '../../types/review.types';

/**
 * Test suite for useCanEditItem hook.
 *
 * Permission Matrix:
 * | Role       | Draft     | Submitted  | Reviewed       | Approved   |
 * |------------|-----------|------------|----------------|------------|
 * | Annotator  | Edit      | Read-only  | Edit+Resubmit  | Read-only  |
 * | Manager    | Read-only | Read-only  | Read-only      | Read-only  |
 * | Researcher | Read-only | Read-only  | Read-only      | Read-only  |
 * | Admin      | Full      | Full       | Full           | Full       |
 */

/**
 * Creates a mock LabelingItem with the specified status.
 */
const createMockItem = (
  status: LabelingItem['status'],
  id: number = 1
): LabelingItem => ({
  id,
  event: 100,
  created_by: 1,
  sequence_number: 1,
  status,
  threat_type_l1: null,
  threat_type_l1_detail: null,
  threat_type_l2: null,
  threat_type_l2_detail: null,
  threat_type_l3: null,
  threat_type_l3_detail: null,
  threat_management: {},
  threat_impact: {},
  threat_coping_abilities: {},
  threat_description: '',
  error_type_l1: null,
  error_type_l1_detail: null,
  error_type_l2: null,
  error_type_l2_detail: null,
  error_type_l3: null,
  error_type_l3_detail: null,
  error_relevance: '',
  error_management: {},
  error_impact: {},
  error_coping_abilities: {},
  error_description: '',
  uas_applicable: false,
  uas_relevance: '',
  uas_type_l1: null,
  uas_type_l1_detail: null,
  uas_type_l2: null,
  uas_type_l2_detail: null,
  uas_type_l3: null,
  uas_type_l3_detail: null,
  uas_management: {},
  uas_impact: {},
  uas_coping_abilities: {},
  uas_description: '',
  calculated_threat_topics: [],
  calculated_error_topics: [],
  calculated_uas_topics: [],
  notes: '',
  linked_result_id: null,
  reviewed_by: null,
  reviewed_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

describe('useCanEditItem', () => {
  describe('Annotator Role', () => {
    const userRole: UserRole = 'annotator';

    it('should allow edit for draft items', () => {
      const item = createMockItem('draft');
      const { result } = renderHook(() =>
        useCanEditItem({ item, userRole })
      );

      expect(result.current.canEdit).toBe(true);
      expect(result.current.isReadOnly).toBe(false);
    });

    it('should NOT allow edit for submitted items', () => {
      const item = createMockItem('submitted');
      const { result } = renderHook(() =>
        useCanEditItem({ item, userRole })
      );

      expect(result.current.canEdit).toBe(false);
      expect(result.current.isReadOnly).toBe(true);
    });

    it('should allow edit for reviewed items (resubmit flow)', () => {
      const item = createMockItem('reviewed');
      const { result } = renderHook(() =>
        useCanEditItem({ item, userRole })
      );

      expect(result.current.canEdit).toBe(true);
      expect(result.current.isReadOnly).toBe(false);
    });

    it('should NOT allow edit for approved items', () => {
      const item = createMockItem('approved');
      const { result } = renderHook(() =>
        useCanEditItem({ item, userRole })
      );

      expect(result.current.canEdit).toBe(false);
      expect(result.current.isReadOnly).toBe(true);
    });

    it('should return correct disabledReason for submitted items', () => {
      const item = createMockItem('submitted');
      const { result } = renderHook(() =>
        useCanEditItem({ item, userRole })
      );

      expect(result.current.disabledReason).toContain('submitted');
    });

    it('should return correct disabledReason for approved items', () => {
      const item = createMockItem('approved');
      const { result } = renderHook(() =>
        useCanEditItem({ item, userRole })
      );

      expect(result.current.disabledReason).toContain('approved');
    });
  });

  describe('Manager Role', () => {
    const userRole: UserRole = 'manager';

    it('should NOT allow edit for any status (draft/submitted/reviewed/approved)', () => {
      const statuses: LabelingItem['status'][] = ['draft', 'submitted', 'reviewed', 'approved'];

      statuses.forEach((status) => {
        const item = createMockItem(status);
        const { result } = renderHook(() =>
          useCanEditItem({ item, userRole })
        );

        expect(result.current.canEdit).toBe(false);
        expect(result.current.isReadOnly).toBe(true);
      });
    });

    it('should return read-only reason for manager', () => {
      const item = createMockItem('draft');
      const { result } = renderHook(() =>
        useCanEditItem({ item, userRole })
      );

      expect(result.current.disabledReason).toBeTruthy();
      expect(result.current.disabledReason).toContain('manager');
    });
  });

  describe('Researcher Role', () => {
    const userRole: UserRole = 'researcher';

    it('should NOT allow edit for any status', () => {
      const statuses: LabelingItem['status'][] = ['draft', 'submitted', 'reviewed', 'approved'];

      statuses.forEach((status) => {
        const item = createMockItem(status);
        const { result } = renderHook(() =>
          useCanEditItem({ item, userRole })
        );

        expect(result.current.canEdit).toBe(false);
        expect(result.current.isReadOnly).toBe(true);
      });
    });

    it('should return read-only reason for researcher', () => {
      const item = createMockItem('draft');
      const { result } = renderHook(() =>
        useCanEditItem({ item, userRole })
      );

      expect(result.current.disabledReason).toBeTruthy();
      expect(result.current.disabledReason).toContain('researcher');
    });
  });

  describe('Admin Role', () => {
    const userRole: UserRole = 'admin';

    it('should allow edit for draft items', () => {
      const item = createMockItem('draft');
      const { result } = renderHook(() =>
        useCanEditItem({ item, userRole })
      );

      expect(result.current.canEdit).toBe(true);
      expect(result.current.isReadOnly).toBe(false);
    });

    it('should allow edit for submitted items', () => {
      const item = createMockItem('submitted');
      const { result } = renderHook(() =>
        useCanEditItem({ item, userRole })
      );

      expect(result.current.canEdit).toBe(true);
      expect(result.current.isReadOnly).toBe(false);
    });

    it('should allow edit for reviewed items', () => {
      const item = createMockItem('reviewed');
      const { result } = renderHook(() =>
        useCanEditItem({ item, userRole })
      );

      expect(result.current.canEdit).toBe(true);
      expect(result.current.isReadOnly).toBe(false);
    });

    it('should allow edit for approved items', () => {
      const item = createMockItem('approved');
      const { result } = renderHook(() =>
        useCanEditItem({ item, userRole })
      );

      expect(result.current.canEdit).toBe(true);
      expect(result.current.isReadOnly).toBe(false);
    });

    it('should NOT return any disabledReason', () => {
      const statuses: LabelingItem['status'][] = ['draft', 'submitted', 'reviewed', 'approved'];

      statuses.forEach((status) => {
        const item = createMockItem(status);
        const { result } = renderHook(() =>
          useCanEditItem({ item, userRole })
        );

        expect(result.current.disabledReason).toBeNull();
      });
    });
  });

  describe('Add/Delete Permissions', () => {
    it('should allow add for annotator with draft items', () => {
      const item = createMockItem('draft');
      const { result } = renderHook(() =>
        useCanEditItem({ item, userRole: 'annotator' })
      );

      expect(result.current.canAdd).toBe(true);
    });

    it('should NOT allow add for annotator with submitted items', () => {
      const item = createMockItem('submitted');
      const { result } = renderHook(() =>
        useCanEditItem({ item, userRole: 'annotator' })
      );

      expect(result.current.canAdd).toBe(false);
    });

    it('should NOT allow delete for annotator with submitted items', () => {
      const item = createMockItem('submitted');
      const { result } = renderHook(() =>
        useCanEditItem({ item, userRole: 'annotator' })
      );

      expect(result.current.canDelete).toBe(false);
    });

    it('should allow add/delete for admin regardless of status', () => {
      const statuses: LabelingItem['status'][] = ['draft', 'submitted', 'reviewed', 'approved'];

      statuses.forEach((status) => {
        const item = createMockItem(status);
        const { result } = renderHook(() =>
          useCanEditItem({ item, userRole: 'admin' })
        );

        expect(result.current.canAdd).toBe(true);
        expect(result.current.canDelete).toBe(true);
      });
    });

    it('should NOT allow add/delete for manager/researcher', () => {
      const roles: UserRole[] = ['manager', 'researcher'];
      const statuses: LabelingItem['status'][] = ['draft', 'submitted', 'reviewed', 'approved'];

      roles.forEach((role) => {
        statuses.forEach((status) => {
          const item = createMockItem(status);
          const { result } = renderHook(() =>
            useCanEditItem({ item, userRole: role })
          );

          expect(result.current.canAdd).toBe(false);
          expect(result.current.canDelete).toBe(false);
        });
      });
    });
  });

  describe('Banner Display', () => {
    it('should show banner when item is read-only', () => {
      const item = createMockItem('submitted');
      const { result } = renderHook(() =>
        useCanEditItem({ item, userRole: 'annotator' })
      );

      expect(result.current.showBanner).toBe(true);
      expect(result.current.bannerMessage).toBeTruthy();
    });

    it('should NOT show banner when item is editable', () => {
      const item = createMockItem('draft');
      const { result } = renderHook(() =>
        useCanEditItem({ item, userRole: 'annotator' })
      );

      expect(result.current.showBanner).toBe(false);
      expect(result.current.bannerMessage).toBeNull();
    });

    it('should return correct banner message based on role and status', () => {
      // Manager viewing draft item - should show role-based message
      const draftItem = createMockItem('draft');
      const { result: managerResult } = renderHook(() =>
        useCanEditItem({ item: draftItem, userRole: 'manager' })
      );

      expect(managerResult.current.bannerMessage).toContain('manager');

      // Annotator viewing submitted item - should show status-based message
      const submittedItem = createMockItem('submitted');
      const { result: annotatorResult } = renderHook(() =>
        useCanEditItem({ item: submittedItem, userRole: 'annotator' })
      );

      expect(annotatorResult.current.bannerMessage).toContain('submitted');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null item gracefully', () => {
      const { result } = renderHook(() =>
        useCanEditItem({ item: null, userRole: 'annotator' })
      );

      expect(result.current.canEdit).toBe(false);
      expect(result.current.canAdd).toBe(false);
      expect(result.current.canDelete).toBe(false);
      expect(result.current.isReadOnly).toBe(true);
    });

    it('should handle null user gracefully', () => {
      const item = createMockItem('draft');
      const { result } = renderHook(() =>
        useCanEditItem({ item, userRole: null as unknown as UserRole })
      );

      expect(result.current.canEdit).toBe(false);
      expect(result.current.canAdd).toBe(false);
      expect(result.current.canDelete).toBe(false);
      expect(result.current.isReadOnly).toBe(true);
    });

    it('should default to read-only when role is unknown', () => {
      const item = createMockItem('draft');
      const { result } = renderHook(() =>
        useCanEditItem({ item, userRole: 'unknown' as UserRole })
      );

      expect(result.current.canEdit).toBe(false);
      expect(result.current.canAdd).toBe(false);
      expect(result.current.canDelete).toBe(false);
      expect(result.current.isReadOnly).toBe(true);
    });
  });

  describe('Tooltip Messages', () => {
    it('should return tooltipMessage when item is read-only', () => {
      const item = createMockItem('submitted');
      const { result } = renderHook(() =>
        useCanEditItem({ item, userRole: 'annotator' })
      );

      expect(result.current.tooltipMessage).toBeTruthy();
    });

    it('should NOT return tooltipMessage when item is editable', () => {
      const item = createMockItem('draft');
      const { result } = renderHook(() =>
        useCanEditItem({ item, userRole: 'annotator' })
      );

      expect(result.current.tooltipMessage).toBeNull();
    });
  });

  describe('itemStatus Override', () => {
    it('should use itemStatus parameter when provided instead of item.status', () => {
      // Item has draft status, but we override with submitted
      const item = createMockItem('draft');
      const { result } = renderHook(() =>
        useCanEditItem({ item, userRole: 'annotator', itemStatus: 'submitted' })
      );

      expect(result.current.canEdit).toBe(false);
      expect(result.current.isReadOnly).toBe(true);
    });

    it('should fall back to item.status when itemStatus is not provided', () => {
      const item = createMockItem('draft');
      const { result } = renderHook(() =>
        useCanEditItem({ item, userRole: 'annotator' })
      );

      expect(result.current.canEdit).toBe(true);
      expect(result.current.isReadOnly).toBe(false);
    });
  });

  describe('Memoization', () => {
    it('should return stable reference when inputs do not change', () => {
      const item = createMockItem('draft');
      const params: UseCanEditItemParams = { item, userRole: 'annotator' };

      const { result, rerender } = renderHook(() => useCanEditItem(params));

      const firstResult = result.current;
      rerender();
      const secondResult = result.current;

      // The memoized result should be the same reference
      expect(firstResult).toBe(secondResult);
    });
  });
});
