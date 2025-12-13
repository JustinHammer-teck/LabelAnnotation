import { renderHook, waitFor, act } from '@testing-library/react';
import { useCopingAbilities } from '../use-coping-abilities.hook';

const mockGetTypeHierarchy = jest.fn();

const mockApi = {
  getTypeHierarchy: mockGetTypeHierarchy,
};

jest.mock('../../api', () => ({
  useAviationApi: () => mockApi,
}));

/**
 * Reference: ThreatModule.js:67-79
 * const buildAbilityTreeData = () => {
 *   const abilities = labHieStru.threatIdentification?.threatCopingAbility || {};
 *   return Object.entries(abilities).map(([group, items]) => ({
 *     title: group,          // "KNO" or "PRO" groups
 *     selectable: false,
 *     children: items.map(...)
 *   }));
 * };
 *
 * Backend API: GET /api/aviation/types/hierarchy/?category=coping
 * Returns hierarchical structure with groups (KNO, PRO, FPA, etc.)
 */
describe('useCopingAbilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * API response structure from backend
   * Each top-level item is a group (KNO, PRO, FPA, etc.)
   * Children are the actual coping abilities
   */
  const mockApiResponse = [
    {
      id: 1,
      category: 'coping',
      level: 1,
      parent_id: null,
      code: 'KNO',
      label: 'Knowledge',
      label_zh: '知识',
      training_topics: [],
      is_active: true,
      children: [
        {
          id: 2,
          category: 'coping',
          level: 2,
          parent_id: 1,
          code: 'KNO.1',
          label: 'System Knowledge',
          label_zh: '系统知识',
          training_topics: [],
          is_active: true,
          children: [],
        },
        {
          id: 3,
          category: 'coping',
          level: 2,
          parent_id: 1,
          code: 'KNO.2',
          label: 'Procedural Knowledge',
          label_zh: '程序知识',
          training_topics: [],
          is_active: true,
          children: [],
        },
      ],
    },
    {
      id: 4,
      category: 'coping',
      level: 1,
      parent_id: null,
      code: 'PRO',
      label: 'Procedures',
      label_zh: '程序',
      training_topics: [],
      is_active: true,
      children: [
        {
          id: 5,
          category: 'coping',
          level: 2,
          parent_id: 4,
          code: 'PRO.1',
          label: 'Standard Operating Procedures',
          label_zh: '标准操作程序',
          training_topics: [],
          is_active: true,
          children: [],
        },
      ],
    },
    {
      id: 6,
      category: 'coping',
      level: 1,
      parent_id: null,
      code: 'FPA',
      label: 'Flight Path Management',
      label_zh: '飞行路径管理',
      training_topics: [],
      is_active: true,
      children: [
        {
          id: 7,
          category: 'coping',
          level: 2,
          parent_id: 6,
          code: 'FPA.1',
          label: 'Automation Management',
          label_zh: '自动化管理',
          training_topics: [],
          is_active: true,
          children: [],
        },
      ],
    },
  ];

  describe('API Fetching', () => {
    it('should fetch coping abilities from API on mount', async () => {
      mockGetTypeHierarchy.mockResolvedValue(mockApiResponse);

      renderHook(() => useCopingAbilities());

      await waitFor(() => {
        expect(mockGetTypeHierarchy).toHaveBeenCalledWith('coping');
        expect(mockGetTypeHierarchy).toHaveBeenCalledTimes(1);
      });
    });

    it('should return loading=true initially', () => {
      mockGetTypeHierarchy.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockApiResponse), 100))
      );

      const { result } = renderHook(() => useCopingAbilities());

      expect(result.current.loading).toBe(true);
      expect(result.current.groups).toEqual([]);
    });

    it('should set loading=false after fetch completes', async () => {
      mockGetTypeHierarchy.mockResolvedValue(mockApiResponse);

      const { result } = renderHook(() => useCopingAbilities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle error state correctly', async () => {
      const errorMessage = 'Failed to fetch coping abilities';
      mockGetTypeHierarchy.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useCopingAbilities());

      await waitFor(() => {
        expect(result.current.error).toBe(errorMessage);
        expect(result.current.loading).toBe(false);
        expect(result.current.groups).toEqual([]);
      });
    });

    it('should handle network error gracefully', async () => {
      mockGetTypeHierarchy.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useCopingAbilities());

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });
    });
  });

  describe('Data Transformation', () => {
    /**
     * Reference: ThreatModule.js:67-79
     * Transform API response to grouped format for MultiSelect
     * Each group has:
     * - code: group identifier (KNO, PRO, FPA)
     * - label: display name
     * - options: array of { value, label } for children
     */
    it('should return hierarchical structure with groups', async () => {
      mockGetTypeHierarchy.mockResolvedValue(mockApiResponse);

      const { result } = renderHook(() => useCopingAbilities());

      await waitFor(() => {
        expect(result.current.groups).toHaveLength(3);
        expect(result.current.groups[0].code).toBe('KNO');
        expect(result.current.groups[1].code).toBe('PRO');
        expect(result.current.groups[2].code).toBe('FPA');
      });
    });

    it('should transform API response to group format with code and label', async () => {
      mockGetTypeHierarchy.mockResolvedValue(mockApiResponse);

      const { result } = renderHook(() => useCopingAbilities());

      await waitFor(() => {
        expect(result.current.groups[0]).toMatchObject({
          code: 'KNO',
          label: '知识',
        });
      });
    });

    it('should include child options under each group', async () => {
      mockGetTypeHierarchy.mockResolvedValue(mockApiResponse);

      const { result } = renderHook(() => useCopingAbilities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const knoGroup = result.current.groups.find((g) => g.code === 'KNO');
      expect(knoGroup?.options).toHaveLength(2);
      expect(knoGroup?.options[0]).toMatchObject({
        value: 'KNO.1',
        label: '系统知识',
      });
      expect(knoGroup?.options[1]).toMatchObject({
        value: 'KNO.2',
        label: '程序知识',
      });
    });

    it('should use code as value for child options', async () => {
      mockGetTypeHierarchy.mockResolvedValue(mockApiResponse);

      const { result } = renderHook(() => useCopingAbilities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const proGroup = result.current.groups.find((g) => g.code === 'PRO');
      expect(proGroup?.options[0].value).toBe('PRO.1');
    });

    it('should use label_zh as label for child options', async () => {
      mockGetTypeHierarchy.mockResolvedValue(mockApiResponse);

      const { result } = renderHook(() => useCopingAbilities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const fpaGroup = result.current.groups.find((g) => g.code === 'FPA');
      expect(fpaGroup?.options[0].label).toBe('自动化管理');
    });
  });

  describe('Flat Options', () => {
    /**
     * For backward compatibility with existing MultiSelect component
     * Provide a flat array of all options for simple selection
     */
    it('should provide flat options array for MultiSelect compatibility', async () => {
      mockGetTypeHierarchy.mockResolvedValue(mockApiResponse);

      const { result } = renderHook(() => useCopingAbilities());

      await waitFor(() => {
        expect(result.current.flatOptions).toHaveLength(4);
      });

      expect(result.current.flatOptions).toContainEqual({
        value: 'KNO.1',
        label: '系统知识',
      });
      expect(result.current.flatOptions).toContainEqual({
        value: 'KNO.2',
        label: '程序知识',
      });
      expect(result.current.flatOptions).toContainEqual({
        value: 'PRO.1',
        label: '标准操作程序',
      });
      expect(result.current.flatOptions).toContainEqual({
        value: 'FPA.1',
        label: '自动化管理',
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty API response', async () => {
      mockGetTypeHierarchy.mockResolvedValue([]);

      const { result } = renderHook(() => useCopingAbilities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.groups).toEqual([]);
      expect(result.current.flatOptions).toEqual([]);
    });

    it('should handle groups with no children', async () => {
      const responseWithEmptyChildren = [
        {
          id: 1,
          category: 'coping',
          level: 1,
          parent_id: null,
          code: 'EMPTY',
          label: 'Empty Group',
          label_zh: '空组',
          training_topics: [],
          is_active: true,
          children: [],
        },
      ];

      mockGetTypeHierarchy.mockResolvedValue(responseWithEmptyChildren);

      const { result } = renderHook(() => useCopingAbilities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.groups).toHaveLength(1);
      expect(result.current.groups[0].options).toEqual([]);
    });
  });
});
