import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecognitionSection } from '../RecognitionSection';
import type { LabelingItem } from '../../../../types/annotation.types';
import type { DropdownOption } from '../../../../types/dropdown.types';

const mockUseCopingAbilities = jest.fn();

jest.mock('../../../../hooks/use-coping-abilities.hook', () => ({
  useCopingAbilities: () => mockUseCopingAbilities(),
}));

const createMockItem = (overrides: Partial<LabelingItem> = {}): LabelingItem => ({
  id: 1,
  event: 1,
  created_by: null,
  sequence_number: 1,
  status: 'draft',
  threat_type_l1: null,
  threat_type_l1_detail: null,
  threat_type_l2: null,
  threat_type_l2_detail: null,
  threat_type_l3: null,
  threat_type_l3_detail: null,
  threat_management: {},
  threat_impact: {},
  threat_coping_abilities: { values: [] },
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
  error_coping_abilities: { values: [] },
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
  uas_coping_abilities: { values: [] },
  uas_description: '',
  calculated_threat_topics: [],
  calculated_error_topics: [],
  calculated_uas_topics: [],
  notes: '',
  linked_result_id: null,
  reviewed_by: null,
  reviewed_at: null,
  created_at: '',
  updated_at: '',
  ...overrides,
});

const mockOptions: DropdownOption[] = [
  {
    id: 1,
    code: 'TE',
    label: 'TE环境',
    label_zh: 'TE环境',
    category: 'threat',
    level: 1,
    parent_id: null,
    training_topics: [],
    is_active: true,
    children: []
  },
];

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
 * The coping abilities should display grouped by category (KNO, PRO, FPA, etc.)
 * and allow multi-selection from the grouped options.
 */
describe('RecognitionSection - Coping Abilities Feature', () => {
  const mockCopingAbilitiesData = {
    loading: false,
    error: null,
    groups: [
      {
        code: 'KNO',
        label: '知识',
        options: [
          { value: 'KNO.1', label: '系统知识' },
          { value: 'KNO.2', label: '程序知识' },
        ],
      },
      {
        code: 'PRO',
        label: '程序',
        options: [
          { value: 'PRO.1', label: '标准操作程序' },
          { value: 'PRO.2', label: '非正常程序' },
        ],
      },
      {
        code: 'FPA',
        label: '飞行路径管理',
        options: [
          { value: 'FPA.1', label: '自动化管理' },
          { value: 'FPA.2', label: '手动飞行' },
        ],
      },
    ],
    flatOptions: [
      { value: 'KNO.1', label: '系统知识' },
      { value: 'KNO.2', label: '程序知识' },
      { value: 'PRO.1', label: '标准操作程序' },
      { value: 'PRO.2', label: '非正常程序' },
      { value: 'FPA.1', label: '自动化管理' },
      { value: 'FPA.2', label: '手动飞行' },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCopingAbilities.mockReturnValue(mockCopingAbilitiesData);
  });

  describe('Display Grouped Coping Abilities', () => {
    /**
     * Coping abilities should display options grouped by category
     * Groups: KNO (Knowledge), PRO (Procedures), FPA (Flight Path), etc.
     */
    it('should display coping abilities grouped by category', async () => {
      const item = createMockItem();

      render(
        <RecognitionSection
          category="threat"
          title="威胁识别"
          item={item}
          options={mockOptions}
          onUpdate={jest.fn()}
        />
      );

      const copingSelect = screen.getByLabelText('应对能力选择');
      await userEvent.click(copingSelect);

      expect(screen.getByText('KNO')).toBeInTheDocument();
      expect(screen.getByText('PRO')).toBeInTheDocument();
      expect(screen.getByText('FPA')).toBeInTheDocument();
    });

    it('should display group labels in Chinese', async () => {
      const item = createMockItem();

      render(
        <RecognitionSection
          category="threat"
          title="威胁识别"
          item={item}
          options={mockOptions}
          onUpdate={jest.fn()}
        />
      );

      const copingSelect = screen.getByLabelText('应对能力选择');
      await userEvent.click(copingSelect);

      expect(screen.getByText('知识')).toBeInTheDocument();
      expect(screen.getByText('程序')).toBeInTheDocument();
      expect(screen.getByText('飞行路径管理')).toBeInTheDocument();
    });

    it('should display child options under each group', async () => {
      const item = createMockItem();

      render(
        <RecognitionSection
          category="threat"
          title="威胁识别"
          item={item}
          options={mockOptions}
          onUpdate={jest.fn()}
        />
      );

      const copingSelect = screen.getByLabelText('应对能力选择');
      await userEvent.click(copingSelect);

      expect(screen.getByText('系统知识')).toBeInTheDocument();
      expect(screen.getByText('程序知识')).toBeInTheDocument();
      expect(screen.getByText('标准操作程序')).toBeInTheDocument();
      expect(screen.getByText('自动化管理')).toBeInTheDocument();
    });
  });

  describe('Multi-Selection from Groups', () => {
    /**
     * Reference: ThreatModule.js:140-160
     * Users can select multiple coping abilities from different groups
     */
    it('should allow selecting items from multiple groups', async () => {
      const mockOnUpdate = jest.fn();
      const item = createMockItem();

      render(
        <RecognitionSection
          category="threat"
          title="威胁识别"
          item={item}
          options={mockOptions}
          onUpdate={mockOnUpdate}
        />
      );

      const copingSelect = screen.getByLabelText('应对能力选择');
      await userEvent.click(copingSelect);

      await userEvent.click(screen.getByText('系统知识'));

      expect(mockOnUpdate).toHaveBeenCalledWith({
        threat_coping_abilities: { values: ['KNO.1'] },
      });
    });

    it('should allow selecting multiple items from the same group', async () => {
      const mockOnUpdate = jest.fn();
      const item = createMockItem({
        threat_coping_abilities: { values: ['KNO.1'] },
      });

      render(
        <RecognitionSection
          category="threat"
          title="威胁识别"
          item={item}
          options={mockOptions}
          onUpdate={mockOnUpdate}
        />
      );

      const copingSelect = screen.getByLabelText('应对能力选择');
      await userEvent.click(copingSelect);

      await userEvent.click(screen.getByText('程序知识'));

      expect(mockOnUpdate).toHaveBeenCalledWith({
        threat_coping_abilities: { values: ['KNO.1', 'KNO.2'] },
      });
    });

    it('should allow selecting items from different groups', async () => {
      const mockOnUpdate = jest.fn();
      const item = createMockItem({
        threat_coping_abilities: { values: ['KNO.1'] },
      });

      render(
        <RecognitionSection
          category="threat"
          title="威胁识别"
          item={item}
          options={mockOptions}
          onUpdate={mockOnUpdate}
        />
      );

      const copingSelect = screen.getByLabelText('应对能力选择');
      await userEvent.click(copingSelect);

      await userEvent.click(screen.getByText('标准操作程序'));

      expect(mockOnUpdate).toHaveBeenCalledWith({
        threat_coping_abilities: { values: ['KNO.1', 'PRO.1'] },
      });
    });
  });

  describe('Save Selected Values', () => {
    /**
     * Selected values should be saved with the correct field name
     * based on category (threat_coping_abilities, error_coping_abilities, etc.)
     */
    it('should save selected values for threat category', async () => {
      const mockOnUpdate = jest.fn();
      const item = createMockItem();

      render(
        <RecognitionSection
          category="threat"
          title="威胁识别"
          item={item}
          options={mockOptions}
          onUpdate={mockOnUpdate}
        />
      );

      const copingSelect = screen.getByLabelText('应对能力选择');
      await userEvent.click(copingSelect);
      await userEvent.click(screen.getByText('自动化管理'));

      expect(mockOnUpdate).toHaveBeenCalledWith({
        threat_coping_abilities: { values: ['FPA.1'] },
      });
    });

    it('should save selected values for error category', async () => {
      const mockOnUpdate = jest.fn();
      const item = createMockItem();

      render(
        <RecognitionSection
          category="error"
          title="差错识别"
          item={item}
          options={mockOptions}
          onUpdate={mockOnUpdate}
        />
      );

      const copingSelect = screen.getByLabelText('应对能力选择');
      await userEvent.click(copingSelect);
      await userEvent.click(screen.getByText('系统知识'));

      expect(mockOnUpdate).toHaveBeenCalledWith({
        error_coping_abilities: { values: ['KNO.1'] },
      });
    });

    it('should save selected values for UAS category', async () => {
      const mockOnUpdate = jest.fn();
      const item = createMockItem();

      render(
        <RecognitionSection
          category="uas"
          title="UAS识别"
          item={item}
          options={mockOptions}
          onUpdate={mockOnUpdate}
        />
      );

      const copingSelect = screen.getByLabelText('应对能力选择');
      await userEvent.click(copingSelect);
      await userEvent.click(screen.getByText('手动飞行'));

      expect(mockOnUpdate).toHaveBeenCalledWith({
        uas_coping_abilities: { values: ['FPA.2'] },
      });
    });

    it('should preserve existing selections when adding new ones', async () => {
      const mockOnUpdate = jest.fn();
      const item = createMockItem({
        threat_coping_abilities: { values: ['KNO.1', 'PRO.1'] },
      });

      render(
        <RecognitionSection
          category="threat"
          title="威胁识别"
          item={item}
          options={mockOptions}
          onUpdate={mockOnUpdate}
        />
      );

      const copingSelect = screen.getByLabelText('应对能力选择');
      await userEvent.click(copingSelect);
      await userEvent.click(screen.getByText('自动化管理'));

      expect(mockOnUpdate).toHaveBeenCalledWith({
        threat_coping_abilities: { values: ['KNO.1', 'PRO.1', 'FPA.1'] },
      });
    });
  });

  describe('Display Selected Values', () => {
    it('should display selected coping abilities as chips', () => {
      const item = createMockItem({
        threat_coping_abilities: { values: ['KNO.1', 'PRO.1'] },
      });

      render(
        <RecognitionSection
          category="threat"
          title="威胁识别"
          item={item}
          options={mockOptions}
          onUpdate={jest.fn()}
        />
      );

      expect(screen.getByText('系统知识')).toBeInTheDocument();
      expect(screen.getByText('标准操作程序')).toBeInTheDocument();
    });

    it('should allow removing selected values', async () => {
      const mockOnUpdate = jest.fn();
      const item = createMockItem({
        threat_coping_abilities: { values: ['KNO.1', 'PRO.1'] },
      });

      render(
        <RecognitionSection
          category="threat"
          title="威胁识别"
          item={item}
          options={mockOptions}
          onUpdate={mockOnUpdate}
        />
      );

      const removeButton = screen.getByRole('button', { name: /Remove 系统知识/i });
      await userEvent.click(removeButton);

      expect(mockOnUpdate).toHaveBeenCalledWith({
        threat_coping_abilities: { values: ['PRO.1'] },
      });
    });
  });

  describe('Loading and Error States', () => {
    it('should show loading state while fetching coping abilities', () => {
      mockUseCopingAbilities.mockReturnValue({
        loading: true,
        error: null,
        groups: [],
        flatOptions: [],
      });

      const item = createMockItem();

      render(
        <RecognitionSection
          category="threat"
          title="威胁识别"
          item={item}
          options={mockOptions}
          onUpdate={jest.fn()}
        />
      );

      const copingSelect = screen.getByLabelText('应对能力选择');
      expect(copingSelect).toHaveAttribute('aria-disabled', 'true');
    });

    it('should handle error state gracefully', async () => {
      mockUseCopingAbilities.mockReturnValue({
        loading: false,
        error: 'Failed to load coping abilities',
        groups: [],
        flatOptions: [],
      });

      const item = createMockItem();

      render(
        <RecognitionSection
          category="threat"
          title="威胁识别"
          item={item}
          options={mockOptions}
          onUpdate={jest.fn()}
        />
      );

      expect(screen.getByText(/Failed to load/i)).toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('should disable coping abilities when section is disabled', () => {
      const item = createMockItem();

      render(
        <RecognitionSection
          category="threat"
          title="威胁识别"
          item={item}
          options={mockOptions}
          onUpdate={jest.fn()}
          disabled={true}
        />
      );

      const copingSelect = screen.getByLabelText('应对能力选择');
      expect(copingSelect).toHaveAttribute('aria-disabled', 'true');
    });

    it('should disable coping abilities for UAS when uasDisabled is true', () => {
      const item = createMockItem();

      render(
        <RecognitionSection
          category="uas"
          title="UAS识别"
          item={item}
          options={mockOptions}
          onUpdate={jest.fn()}
          uasDisabled={true}
          uasDisabledMessage="UAS is disabled"
        />
      );

      const copingSelect = screen.getByLabelText('应对能力选择');
      expect(copingSelect).toHaveAttribute('aria-disabled', 'true');
    });
  });
});
