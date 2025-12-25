import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecognitionSection } from '../RecognitionSection';
import type { LabelingItem } from '../../../../types/annotation.types';
import type { DropdownOption } from '../../../../types/dropdown.types';

jest.mock('../../../../i18n', () => ({
  useAviationTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'recognition.threat.title': 'Threat Identification',
        'recognition.error.title': 'Error Identification',
        'recognition.uas.title': 'UAS Identification',
        'recognition.threat.type': 'Threat Type',
        'recognition.error.type': 'Error Type',
        'recognition.uas.type': 'UAS Type',
        'recognition.management': 'Management',
        'recognition.impact': 'Impact',
        'recognition.coping_ability': 'Coping Ability',
        'recognition.description': 'Description',
        'recognition.select_management': 'Select management',
        'recognition.select_impact': 'Select impact',
        'recognition.select_coping': 'Select coping ability',
        'recognition.enter_threat_description': 'Enter threat description',
        'recognition.enter_error_description': 'Enter error description',
        'recognition.enter_uas_description': 'Enter UAS description',
        'management_state.managed': 'Managed',
        'management_state.unmanaged': 'Unmanaged',
        'management_state.ineffective': 'Ineffective',
        'management_state.unobserved': 'Unobserved',
        'training_topics.title': 'Training Topics',
        'hierarchical_dropdown.select_threat_type': 'Select threat type...',
        'hierarchical_dropdown.select_error_type': 'Select error type...',
        'hierarchical_dropdown.select_uas_type': 'Select UAS type...',
        'hierarchical_dropdown.level1': 'Level 1',
        'hierarchical_dropdown.level2': 'Level 2',
        'hierarchical_dropdown.level3': 'Level 3',
        'hierarchical_dropdown.no_options': 'No options',
        'hierarchical_dropdown.select_level1_first': 'Select Level 1 first',
        'hierarchical_dropdown.select_level2_first': 'Select Level 2 first',
        'hierarchical_dropdown.clear_selection': 'Clear selection',
      };
      return translations[key] || key;
    },
    currentLanguage: 'en',
  }),
}));

jest.mock('../../../../hooks/use-coping-abilities.hook', () => ({
  useCopingAbilities: () => ({
    loading: false,
    error: null,
    groups: [],
    flatOptions: [],
  }),
}));

/**
 * Gap 3: Cascade Reset on Level Selection
 *
 * Tests for cascade reset behavior when level selections change.
 * Reference: label lib ThreatModule.js:29-36
 *
 * ```javascript
 * if (field === 'level1') {
 *     updatedItem.level2 = '';
 *     updatedItem.level3 = '';
 * } else if (field === 'level2') {
 *     updatedItem.level3 = '';
 * }
 * ```
 *
 * This pattern is identical in ThreatModule.js, ErrorModule.js, and UASModule.js.
 */

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
  created_at: '',
  updated_at: '',
  ...overrides,
});

const mockThreatOptions: DropdownOption[] = [
  {
    id: 1,
    code: 'TE',
    label: 'TE环境',
    category: 'threat',
    level: 1,
    parent_id: null,
    label_zh: 'TE环境',
    training_topics: [],
    is_active: true,
    children: [
      {
        id: 2,
        code: 'TE-01',
        label: 'TE-01子类',
        category: 'threat',
        level: 2,
        parent_id: 1,
        label_zh: 'TE-01子类',
        training_topics: [],
        is_active: true,
        children: [
          {
            id: 3,
            code: 'TE-01-A',
            label: 'TE-01-A具体',
            category: 'threat',
            level: 3,
            parent_id: 2,
            label_zh: 'TE-01-A具体',
            training_topics: ['topic1'],
            is_active: true,
            children: [],
          },
          {
            id: 7,
            code: 'TE-01-B',
            label: 'TE-01-B具体',
            category: 'threat',
            level: 3,
            parent_id: 2,
            label_zh: 'TE-01-B具体',
            training_topics: ['topic3'],
            is_active: true,
            children: [],
          },
        ],
      },
      {
        id: 8,
        code: 'TE-02',
        label: 'TE-02子类',
        category: 'threat',
        level: 2,
        parent_id: 1,
        label_zh: 'TE-02子类',
        training_topics: [],
        is_active: true,
        children: [
          {
            id: 9,
            code: 'TE-02-A',
            label: 'TE-02-A具体',
            category: 'threat',
            level: 3,
            parent_id: 8,
            label_zh: 'TE-02-A具体',
            training_topics: ['topic4'],
            is_active: true,
            children: [],
          },
        ],
      },
    ],
  },
  {
    id: 4,
    code: 'TC',
    label: 'TC机组',
    category: 'threat',
    level: 1,
    parent_id: null,
    label_zh: 'TC机组',
    training_topics: [],
    is_active: true,
    children: [
      {
        id: 5,
        code: 'TC-01',
        label: 'TC-01子类',
        category: 'threat',
        level: 2,
        parent_id: 4,
        label_zh: 'TC-01子类',
        training_topics: [],
        is_active: true,
        children: [
          {
            id: 6,
            code: 'TC-01-A',
            label: 'TC-01-A具体',
            category: 'threat',
            level: 3,
            parent_id: 5,
            label_zh: 'TC-01-A具体',
            training_topics: ['topic2'],
            is_active: true,
            children: [],
          },
        ],
      },
    ],
  },
];

const mockErrorOptions: DropdownOption[] = [
  {
    id: 101,
    code: 'EA',
    label: 'EA操作',
    category: 'error',
    level: 1,
    parent_id: null,
    label_zh: 'EA操作',
    training_topics: [],
    is_active: true,
    children: [
      {
        id: 102,
        code: 'EA-01',
        label: 'EA-01子类',
        category: 'error',
        level: 2,
        parent_id: 101,
        label_zh: 'EA-01子类',
        training_topics: [],
        is_active: true,
        children: [
          {
            id: 103,
            code: 'EA-01-A',
            label: 'EA-01-A具体',
            category: 'error',
            level: 3,
            parent_id: 102,
            label_zh: 'EA-01-A具体',
            training_topics: ['error-topic1'],
            is_active: true,
            children: [],
          },
        ],
      },
      {
        id: 107,
        code: 'EA-02',
        label: 'EA-02子类',
        category: 'error',
        level: 2,
        parent_id: 101,
        label_zh: 'EA-02子类',
        training_topics: [],
        is_active: true,
        children: [
          {
            id: 108,
            code: 'EA-02-A',
            label: 'EA-02-A具体',
            category: 'error',
            level: 3,
            parent_id: 107,
            label_zh: 'EA-02-A具体',
            training_topics: ['error-topic3'],
            is_active: true,
            children: [],
          },
        ],
      },
    ],
  },
  {
    id: 104,
    code: 'EB',
    label: 'EB判断',
    category: 'error',
    level: 1,
    parent_id: null,
    label_zh: 'EB判断',
    training_topics: [],
    is_active: true,
    children: [
      {
        id: 105,
        code: 'EB-01',
        label: 'EB-01子类',
        category: 'error',
        level: 2,
        parent_id: 104,
        label_zh: 'EB-01子类',
        training_topics: [],
        is_active: true,
        children: [
          {
            id: 106,
            code: 'EB-01-A',
            label: 'EB-01-A具体',
            category: 'error',
            level: 3,
            parent_id: 105,
            label_zh: 'EB-01-A具体',
            training_topics: ['error-topic2'],
            is_active: true,
            children: [],
          },
        ],
      },
    ],
  },
];

const mockUasOptions: DropdownOption[] = [
  {
    id: 201,
    code: 'UA',
    label: 'UA类型A',
    category: 'uas',
    level: 1,
    parent_id: null,
    label_zh: 'UA类型A',
    training_topics: [],
    is_active: true,
    children: [
      {
        id: 202,
        code: 'UA-01',
        label: 'UA-01子类',
        category: 'uas',
        level: 2,
        parent_id: 201,
        label_zh: 'UA-01子类',
        training_topics: [],
        is_active: true,
        children: [
          {
            id: 203,
            code: 'UA-01-A',
            label: 'UA-01-A具体',
            category: 'uas',
            level: 3,
            parent_id: 202,
            label_zh: 'UA-01-A具体',
            training_topics: ['uas-topic1'],
            is_active: true,
            children: [],
          },
        ],
      },
      {
        id: 207,
        code: 'UA-02',
        label: 'UA-02子类',
        category: 'uas',
        level: 2,
        parent_id: 201,
        label_zh: 'UA-02子类',
        training_topics: [],
        is_active: true,
        children: [
          {
            id: 208,
            code: 'UA-02-A',
            label: 'UA-02-A具体',
            category: 'uas',
            level: 3,
            parent_id: 207,
            label_zh: 'UA-02-A具体',
            training_topics: ['uas-topic3'],
            is_active: true,
            children: [],
          },
        ],
      },
    ],
  },
  {
    id: 204,
    code: 'UB',
    label: 'UB类型B',
    category: 'uas',
    level: 1,
    parent_id: null,
    label_zh: 'UB类型B',
    training_topics: [],
    is_active: true,
    children: [
      {
        id: 205,
        code: 'UB-01',
        label: 'UB-01子类',
        category: 'uas',
        level: 2,
        parent_id: 204,
        label_zh: 'UB-01子类',
        training_topics: [],
        is_active: true,
        children: [
          {
            id: 206,
            code: 'UB-01-A',
            label: 'UB-01-A具体',
            category: 'uas',
            level: 3,
            parent_id: 205,
            label_zh: 'UB-01-A具体',
            training_topics: ['uas-topic2'],
            is_active: true,
            children: [],
          },
        ],
      },
    ],
  },
];

const openDropdownAndSelectLevel = async (
  user: ReturnType<typeof userEvent.setup>,
  container: HTMLElement,
  level: 1 | 2 | 3,
  optionLabel: string,
) => {
  const dropdown = container.querySelector('[role="listbox"]');
  if (!dropdown) {
    const trigger = container.querySelector('button[aria-haspopup="listbox"]');
    if (trigger) {
      await user.click(trigger);
    }
  }

  const listbox = container.querySelector('[role="listbox"]');
  if (!listbox) {
    throw new Error('Dropdown listbox not found');
  }

  const columns = Array.from(listbox.children).filter(
    (el) => el.className.includes('column') && !el.className.includes('columnHeader'),
  );
  const targetColumn = columns[level - 1];
  if (!targetColumn) {
    throw new Error(`Column for level ${level} not found`);
  }

  const option = within(targetColumn as HTMLElement).getByText(optionLabel);
  await user.click(option);
};

describe('RecognitionSection - Gap 3: Cascade Reset on Level Selection', () => {
  /**
   * A. L1 Change Cascade Tests
   *
   * Reference: ThreatModule.js:31-33
   * if (field === 'level1') {
   *   updatedItem.level2 = '';
   *   updatedItem.level3 = '';
   * }
   */
  describe('A. L1 Change Cascade Tests', () => {
    it('A1: When L1 changes, L2 should be reset to null', async () => {
      const user = userEvent.setup();
      const mockOnUpdate = jest.fn();
      const item = createMockItem({
        threat_type_l1: 1,
        threat_type_l1_detail: { id: 1, code: 'TE', label: 'TE环境' },
        threat_type_l2: 2,
        threat_type_l2_detail: { id: 2, code: 'TE-01', label: 'TE-01子类' },
        threat_type_l3: 3,
        threat_type_l3_detail: { id: 3, code: 'TE-01-A', label: 'TE-01-A具体' },
      });

      const { container } = render(
        <RecognitionSection
          category="threat"
          title="威胁识别"
          item={item}
          options={mockThreatOptions}
          onUpdate={mockOnUpdate}
        />,
      );

      const trigger = container.querySelector('button[aria-haspopup="listbox"]');
      if (trigger) {
        await user.click(trigger);
      }

      const listbox = container.querySelector('[role="listbox"]');
      if (listbox) {
        const columns = Array.from(listbox.children).filter(
          (el) => el.className.includes('column') && !el.className.includes('columnHeader'),
        );
        const l1Column = columns[0];

        if (l1Column) {
          const tcOption = within(l1Column as HTMLElement).getByText('TC机组');
          await user.click(tcOption);
        }
      }

      const l1ChangeCall = mockOnUpdate.mock.calls.find(
        (call) => call[0].threat_type_l1 === 4 && call[0].threat_type_l2 === null,
      );

      expect(l1ChangeCall).toBeDefined();
    });

    it('A2: When L1 changes, L3 should be reset to null', async () => {
      const user = userEvent.setup();
      const mockOnUpdate = jest.fn();
      const item = createMockItem({
        threat_type_l1: 1,
        threat_type_l1_detail: { id: 1, code: 'TE', label: 'TE环境' },
        threat_type_l2: 2,
        threat_type_l2_detail: { id: 2, code: 'TE-01', label: 'TE-01子类' },
        threat_type_l3: 3,
        threat_type_l3_detail: { id: 3, code: 'TE-01-A', label: 'TE-01-A具体' },
      });

      const { container } = render(
        <RecognitionSection
          category="threat"
          title="威胁识别"
          item={item}
          options={mockThreatOptions}
          onUpdate={mockOnUpdate}
        />,
      );

      const trigger = container.querySelector('button[aria-haspopup="listbox"]');
      if (trigger) {
        await user.click(trigger);
      }

      const listbox = container.querySelector('[role="listbox"]');
      if (listbox) {
        const columns = Array.from(listbox.children).filter(
          (el) => el.className.includes('column') && !el.className.includes('columnHeader'),
        );
        const l1Column = columns[0];

        if (l1Column) {
          const tcOption = within(l1Column as HTMLElement).getByText('TC机组');
          await user.click(tcOption);
        }
      }

      const l1ChangeCall = mockOnUpdate.mock.calls.find(
        (call) => call[0].threat_type_l1 === 4 && call[0].threat_type_l3 === null,
      );

      expect(l1ChangeCall).toBeDefined();
    });

    it('A3: When L1 changes to a new value, both L2 and L3 are cleared in the update call', async () => {
      const user = userEvent.setup();
      const mockOnUpdate = jest.fn();
      const item = createMockItem({
        threat_type_l1: 1,
        threat_type_l1_detail: { id: 1, code: 'TE', label: 'TE环境' },
        threat_type_l2: 2,
        threat_type_l2_detail: { id: 2, code: 'TE-01', label: 'TE-01子类' },
        threat_type_l3: 3,
        threat_type_l3_detail: { id: 3, code: 'TE-01-A', label: 'TE-01-A具体' },
      });

      const { container } = render(
        <RecognitionSection
          category="threat"
          title="威胁识别"
          item={item}
          options={mockThreatOptions}
          onUpdate={mockOnUpdate}
        />,
      );

      const trigger = container.querySelector('button[aria-haspopup="listbox"]');
      if (trigger) {
        await user.click(trigger);
      }

      const listbox = container.querySelector('[role="listbox"]');
      if (listbox) {
        const columns = Array.from(listbox.children).filter(
          (el) => el.className.includes('column') && !el.className.includes('columnHeader'),
        );
        const l1Column = columns[0];

        if (l1Column) {
          const tcOption = within(l1Column as HTMLElement).getByText('TC机组');
          await user.click(tcOption);
        }
      }

      const l1ChangeCall = mockOnUpdate.mock.calls.find(
        (call) => call[0].threat_type_l1 === 4 && call[0].threat_type_l2 === null && call[0].threat_type_l3 === null,
      );

      expect(l1ChangeCall).toBeDefined();
    });

    it('A4: When L1 is cleared (set to null), L2 and L3 should also be cleared', async () => {
      const user = userEvent.setup();
      const mockOnUpdate = jest.fn();
      const item = createMockItem({
        threat_type_l1: 1,
        threat_type_l1_detail: { id: 1, code: 'TE', label: 'TE环境' },
        threat_type_l2: 2,
        threat_type_l2_detail: { id: 2, code: 'TE-01', label: 'TE-01子类' },
        threat_type_l3: 3,
        threat_type_l3_detail: { id: 3, code: 'TE-01-A', label: 'TE-01-A具体' },
      });

      const { container } = render(
        <RecognitionSection
          category="threat"
          title="威胁识别"
          item={item}
          options={mockThreatOptions}
          onUpdate={mockOnUpdate}
        />,
      );

      const clearButton = container.querySelector('[aria-label="Clear selection"]');
      if (clearButton) {
        await user.click(clearButton);
      }

      expect(mockOnUpdate).toHaveBeenCalledWith({
        threat_type_l1: null,
        threat_type_l2: null,
        threat_type_l3: null,
      });
    });

    it('A5: L1 change cascade should work for all categories (threat, error, uas)', async () => {
      const user = userEvent.setup();

      const categories: Array<{ category: 'threat' | 'error' | 'uas'; options: DropdownOption[]; prefix: string }> = [
        { category: 'threat', options: mockThreatOptions, prefix: 'threat_type' },
        { category: 'error', options: mockErrorOptions, prefix: 'error_type' },
        { category: 'uas', options: mockUasOptions, prefix: 'uas_type' },
      ];

      for (const { category, options, prefix } of categories) {
        const mockOnUpdate = jest.fn();
        const item = createMockItem();

        const { container, unmount } = render(
          <RecognitionSection
            category={category}
            title={`${category}识别`}
            item={item}
            options={options}
            onUpdate={mockOnUpdate}
          />,
        );

        const trigger = container.querySelector('button[aria-haspopup="listbox"]');
        if (trigger) {
          await user.click(trigger);

          const listbox = container.querySelector('[role="listbox"]');
          if (listbox) {
            const l1Options = listbox.querySelectorAll('[role="option"]');
            if (l1Options.length > 0) {
              await user.click(l1Options[0]);
            }
          }
        }

        const clearedCall = mockOnUpdate.mock.calls.find(
          (call) => call[0][`${prefix}_l2`] === null && call[0][`${prefix}_l3`] === null,
        );

        expect(clearedCall).toBeDefined();

        unmount();
      }
    });
  });

  /**
   * B. L2 Change Cascade Tests
   *
   * Reference: ThreatModule.js:34-35
   * } else if (field === 'level2') {
   *   updatedItem.level3 = '';
   * }
   */
  describe('B. L2 Change Cascade Tests', () => {
    it('B1: When L2 changes, L3 should be reset to null', async () => {
      const user = userEvent.setup();
      const mockOnUpdate = jest.fn();
      const item = createMockItem({
        threat_type_l1: 1,
        threat_type_l1_detail: { id: 1, code: 'TE', label: 'TE环境' },
        threat_type_l2: 2,
        threat_type_l2_detail: { id: 2, code: 'TE-01', label: 'TE-01子类' },
        threat_type_l3: 3,
        threat_type_l3_detail: { id: 3, code: 'TE-01-A', label: 'TE-01-A具体' },
      });

      const { container } = render(
        <RecognitionSection
          category="threat"
          title="威胁识别"
          item={item}
          options={mockThreatOptions}
          onUpdate={mockOnUpdate}
        />,
      );

      const trigger = container.querySelector('button[aria-haspopup="listbox"]');
      if (trigger) {
        await user.click(trigger);
      }

      const listbox = container.querySelector('[role="listbox"]');
      if (listbox) {
        const columns = Array.from(listbox.children).filter(
          (el) => el.className.includes('column') && !el.className.includes('columnHeader'),
        );
        const l2Column = columns[1];

        if (l2Column) {
          const te02Option = within(l2Column as HTMLElement).getByText('TE-02子类');
          await user.click(te02Option);
        }
      }

      const l2ChangeCall = mockOnUpdate.mock.calls.find(
        (call) => call[0].threat_type_l2 === 8 && call[0].threat_type_l3 === null,
      );

      expect(l2ChangeCall).toBeDefined();
    });

    it('B2: When L2 changes, L1 should remain unchanged', async () => {
      const user = userEvent.setup();
      const mockOnUpdate = jest.fn();
      const item = createMockItem({
        threat_type_l1: 1,
        threat_type_l1_detail: { id: 1, code: 'TE', label: 'TE环境' },
        threat_type_l2: 2,
        threat_type_l2_detail: { id: 2, code: 'TE-01', label: 'TE-01子类' },
        threat_type_l3: 3,
        threat_type_l3_detail: { id: 3, code: 'TE-01-A', label: 'TE-01-A具体' },
      });

      const { container } = render(
        <RecognitionSection
          category="threat"
          title="威胁识别"
          item={item}
          options={mockThreatOptions}
          onUpdate={mockOnUpdate}
        />,
      );

      const trigger = container.querySelector('button[aria-haspopup="listbox"]');
      if (trigger) {
        await user.click(trigger);
      }

      const listbox = container.querySelector('[role="listbox"]');
      if (listbox) {
        const columns = Array.from(listbox.children).filter(
          (el) => el.className.includes('column') && !el.className.includes('columnHeader'),
        );
        const l2Column = columns[1];

        if (l2Column) {
          const te02Option = within(l2Column as HTMLElement).getByText('TE-02子类');
          await user.click(te02Option);
        }
      }

      const l2ChangeCall = mockOnUpdate.mock.calls.find(
        (call) => call[0].threat_type_l2 === 8 && call[0].threat_type_l3 === null,
      );

      expect(l2ChangeCall).toBeDefined();
      if (l2ChangeCall) {
        expect(l2ChangeCall[0].threat_type_l1).toBe(1);
      }
    });

    it('B3: When L2 is cleared (set to null), L3 should also be cleared', async () => {
      const user = userEvent.setup();
      const mockOnUpdate = jest.fn();
      const item = createMockItem({
        threat_type_l1: 1,
        threat_type_l1_detail: { id: 1, code: 'TE', label: 'TE环境' },
        threat_type_l2: 2,
        threat_type_l2_detail: { id: 2, code: 'TE-01', label: 'TE-01子类' },
        threat_type_l3: 3,
        threat_type_l3_detail: { id: 3, code: 'TE-01-A', label: 'TE-01-A具体' },
      });

      const { container } = render(
        <RecognitionSection
          category="threat"
          title="威胁识别"
          item={item}
          options={mockThreatOptions}
          onUpdate={mockOnUpdate}
        />,
      );

      const trigger = container.querySelector('button[aria-haspopup="listbox"]');
      if (trigger) {
        await user.click(trigger);
      }

      const listbox = container.querySelector('[role="listbox"]');
      if (listbox) {
        const columns = Array.from(listbox.children).filter(
          (el) => el.className.includes('column') && !el.className.includes('columnHeader'),
        );
        const l1Column = columns[0];

        if (l1Column) {
          const l1Option = within(l1Column as HTMLElement).getByText('TE环境');
          await user.click(l1Option);
        }
      }

      const l2ClearedCall = mockOnUpdate.mock.calls.find(
        (call) =>
          call[0].threat_type_l1 !== undefined &&
          call[0].threat_type_l2 === null &&
          call[0].threat_type_l3 === null,
      );

      expect(l2ClearedCall).toBeDefined();
    });

    it('B4: L2 change cascade should work for all categories', async () => {
      const user = userEvent.setup();

      const categories: Array<{ category: 'threat' | 'error' | 'uas'; options: DropdownOption[]; prefix: string }> = [
        { category: 'threat', options: mockThreatOptions, prefix: 'threat_type' },
        { category: 'error', options: mockErrorOptions, prefix: 'error_type' },
        { category: 'uas', options: mockUasOptions, prefix: 'uas_type' },
      ];

      for (const { category, options, prefix } of categories) {
        const mockOnUpdate = jest.fn();
        const l1Id = options[0].id;
        const l1Detail = { id: l1Id, code: options[0].code, label: options[0].label };
        const l2 = options[0].children[0];
        const l2Detail = { id: l2.id, code: l2.code, label: l2.label };
        const l3 = l2.children[0];
        const l3Detail = { id: l3.id, code: l3.code, label: l3.label };

        const item = createMockItem({
          [`${prefix}_l1`]: l1Id,
          [`${prefix}_l1_detail`]: l1Detail,
          [`${prefix}_l2`]: l2.id,
          [`${prefix}_l2_detail`]: l2Detail,
          [`${prefix}_l3`]: l3.id,
          [`${prefix}_l3_detail`]: l3Detail,
        } as Partial<LabelingItem>);

        const { container, unmount } = render(
          <RecognitionSection
            category={category}
            title={`${category}识别`}
            item={item}
            options={options}
            onUpdate={mockOnUpdate}
          />,
        );

        const trigger = container.querySelector('button[aria-haspopup="listbox"]');
        if (trigger) {
          await user.click(trigger);

          const listbox = container.querySelector('[role="listbox"]');
          if (listbox) {
            const columns = Array.from(listbox.children).filter(
              (el) => el.className.includes('column') && !el.className.includes('columnHeader'),
            );
            const l2Column = columns[1];

            if (l2Column) {
              const l2Options = l2Column.querySelectorAll('[role="option"]');
              if (l2Options.length > 1) {
                await user.click(l2Options[1]);
              }
            }
          }
        }

        const l3ClearedCall = mockOnUpdate.mock.calls.find((call) => call[0][`${prefix}_l3`] === null);

        expect(l3ClearedCall).toBeDefined();

        unmount();
      }
    });
  });

  /**
   * C. L3 Change Tests
   *
   * L3 is the leaf level - changing it should not affect L1 or L2
   */
  describe('C. L3 Change Tests', () => {
    it('C1: When L3 changes, L1 should remain unchanged', async () => {
      const user = userEvent.setup();
      const mockOnUpdate = jest.fn();
      const item = createMockItem({
        threat_type_l1: 1,
        threat_type_l1_detail: { id: 1, code: 'TE', label: 'TE环境' },
        threat_type_l2: 2,
        threat_type_l2_detail: { id: 2, code: 'TE-01', label: 'TE-01子类' },
        threat_type_l3: 3,
        threat_type_l3_detail: { id: 3, code: 'TE-01-A', label: 'TE-01-A具体' },
      });

      const { container } = render(
        <RecognitionSection
          category="threat"
          title="威胁识别"
          item={item}
          options={mockThreatOptions}
          onUpdate={mockOnUpdate}
        />,
      );

      const trigger = container.querySelector('button[aria-haspopup="listbox"]');
      if (trigger) {
        await user.click(trigger);
      }

      const listbox = container.querySelector('[role="listbox"]');
      if (listbox) {
        const columns = Array.from(listbox.children).filter(
          (el) => el.className.includes('column') && !el.className.includes('columnHeader'),
        );
        const l3Column = columns[2];

        if (l3Column) {
          const l3Options = l3Column.querySelectorAll('[role="option"]');
          if (l3Options.length > 1) {
            await user.click(l3Options[1]);
          }
        }
      }

      if (mockOnUpdate.mock.calls.length > 0) {
        const lastCall = mockOnUpdate.mock.calls[mockOnUpdate.mock.calls.length - 1][0];
        expect(lastCall.threat_type_l1).toBe(1);
      }
    });

    it('C2: When L3 changes, L2 should remain unchanged', async () => {
      const user = userEvent.setup();
      const mockOnUpdate = jest.fn();
      const item = createMockItem({
        threat_type_l1: 1,
        threat_type_l1_detail: { id: 1, code: 'TE', label: 'TE环境' },
        threat_type_l2: 2,
        threat_type_l2_detail: { id: 2, code: 'TE-01', label: 'TE-01子类' },
        threat_type_l3: 3,
        threat_type_l3_detail: { id: 3, code: 'TE-01-A', label: 'TE-01-A具体' },
      });

      const { container } = render(
        <RecognitionSection
          category="threat"
          title="威胁识别"
          item={item}
          options={mockThreatOptions}
          onUpdate={mockOnUpdate}
        />,
      );

      const trigger = container.querySelector('button[aria-haspopup="listbox"]');
      if (trigger) {
        await user.click(trigger);
      }

      const listbox = container.querySelector('[role="listbox"]');
      if (listbox) {
        const columns = Array.from(listbox.children).filter(
          (el) => el.className.includes('column') && !el.className.includes('columnHeader'),
        );
        const l3Column = columns[2];

        if (l3Column) {
          const l3Options = l3Column.querySelectorAll('[role="option"]');
          if (l3Options.length > 1) {
            await user.click(l3Options[1]);
          }
        }
      }

      if (mockOnUpdate.mock.calls.length > 0) {
        const lastCall = mockOnUpdate.mock.calls[mockOnUpdate.mock.calls.length - 1][0];
        expect(lastCall.threat_type_l2).toBe(2);
      }
    });

    it('C3: Changing L3 should only update L3', async () => {
      const user = userEvent.setup();
      const mockOnUpdate = jest.fn();
      const item = createMockItem({
        threat_type_l1: 1,
        threat_type_l1_detail: { id: 1, code: 'TE', label: 'TE环境' },
        threat_type_l2: 2,
        threat_type_l2_detail: { id: 2, code: 'TE-01', label: 'TE-01子类' },
        threat_type_l3: 3,
        threat_type_l3_detail: { id: 3, code: 'TE-01-A', label: 'TE-01-A具体' },
      });

      const { container } = render(
        <RecognitionSection
          category="threat"
          title="威胁识别"
          item={item}
          options={mockThreatOptions}
          onUpdate={mockOnUpdate}
        />,
      );

      const trigger = container.querySelector('button[aria-haspopup="listbox"]');
      if (trigger) {
        await user.click(trigger);
      }

      const listbox = container.querySelector('[role="listbox"]');
      if (listbox) {
        const columns = Array.from(listbox.children).filter(
          (el) => el.className.includes('column') && !el.className.includes('columnHeader'),
        );
        const l3Column = columns[2];

        if (l3Column) {
          const l3Options = l3Column.querySelectorAll('[role="option"]');
          if (l3Options.length > 1) {
            await user.click(l3Options[1]);
          }
        }
      }

      const l3Call = mockOnUpdate.mock.calls.find(
        (call) => call[0].threat_type_l1 === 1 && call[0].threat_type_l2 === 2 && call[0].threat_type_l3 === 7,
      );

      expect(l3Call).toBeDefined();
    });
  });

  /**
   * D. Edge Cases
   */
  describe('D. Edge Cases', () => {
    it('D1: Clearing all levels (null selection) should set all to null', async () => {
      const user = userEvent.setup();
      const mockOnUpdate = jest.fn();
      const item = createMockItem({
        threat_type_l1: 1,
        threat_type_l1_detail: { id: 1, code: 'TE', label: 'TE环境' },
        threat_type_l2: 2,
        threat_type_l2_detail: { id: 2, code: 'TE-01', label: 'TE-01子类' },
        threat_type_l3: 3,
        threat_type_l3_detail: { id: 3, code: 'TE-01-A', label: 'TE-01-A具体' },
      });

      const { container } = render(
        <RecognitionSection
          category="threat"
          title="威胁识别"
          item={item}
          options={mockThreatOptions}
          onUpdate={mockOnUpdate}
        />,
      );

      const clearButton = container.querySelector('[aria-label="Clear selection"]');
      if (clearButton) {
        await user.click(clearButton);
      }

      expect(mockOnUpdate).toHaveBeenCalledWith({
        threat_type_l1: null,
        threat_type_l2: null,
        threat_type_l3: null,
      });
    });

    it('D2: Setting L1 when L2/L3 already have values should clear L2/L3', async () => {
      const user = userEvent.setup();
      const mockOnUpdate = jest.fn();
      const item = createMockItem({
        threat_type_l1: 1,
        threat_type_l1_detail: { id: 1, code: 'TE', label: 'TE环境' },
        threat_type_l2: 2,
        threat_type_l2_detail: { id: 2, code: 'TE-01', label: 'TE-01子类' },
        threat_type_l3: 3,
        threat_type_l3_detail: { id: 3, code: 'TE-01-A', label: 'TE-01-A具体' },
      });

      const { container } = render(
        <RecognitionSection
          category="threat"
          title="威胁识别"
          item={item}
          options={mockThreatOptions}
          onUpdate={mockOnUpdate}
        />,
      );

      const trigger = container.querySelector('button[aria-haspopup="listbox"]');
      if (trigger) {
        await user.click(trigger);
      }

      const listbox = container.querySelector('[role="listbox"]');
      if (listbox) {
        const columns = Array.from(listbox.children).filter(
          (el) => el.className.includes('column') && !el.className.includes('columnHeader'),
        );
        const l1Column = columns[0];

        if (l1Column) {
          const tcOption = within(l1Column as HTMLElement).getByText('TC机组');
          await user.click(tcOption);
        }
      }

      const l1ChangeCall = mockOnUpdate.mock.calls.find(
        (call) => call[0].threat_type_l1 === 4 && call[0].threat_type_l2 === null && call[0].threat_type_l3 === null,
      );

      expect(l1ChangeCall).toBeDefined();
    });

    it('D3: Setting L2 when L3 already has a value should clear L3', async () => {
      const user = userEvent.setup();
      const mockOnUpdate = jest.fn();
      const item = createMockItem({
        threat_type_l1: 1,
        threat_type_l1_detail: { id: 1, code: 'TE', label: 'TE环境' },
        threat_type_l2: 2,
        threat_type_l2_detail: { id: 2, code: 'TE-01', label: 'TE-01子类' },
        threat_type_l3: 3,
        threat_type_l3_detail: { id: 3, code: 'TE-01-A', label: 'TE-01-A具体' },
      });

      const { container } = render(
        <RecognitionSection
          category="threat"
          title="威胁识别"
          item={item}
          options={mockThreatOptions}
          onUpdate={mockOnUpdate}
        />,
      );

      const trigger = container.querySelector('button[aria-haspopup="listbox"]');
      if (trigger) {
        await user.click(trigger);
      }

      const listbox = container.querySelector('[role="listbox"]');
      if (listbox) {
        const columns = Array.from(listbox.children).filter(
          (el) => el.className.includes('column') && !el.className.includes('columnHeader'),
        );
        const l2Column = columns[1];

        if (l2Column) {
          const te02Option = within(l2Column as HTMLElement).getByText('TE-02子类');
          await user.click(te02Option);
        }
      }

      const l2ChangeCall = mockOnUpdate.mock.calls.find(
        (call) =>
          call[0].threat_type_l1 === 1 && call[0].threat_type_l2 === 8 && call[0].threat_type_l3 === null,
      );

      expect(l2ChangeCall).toBeDefined();
    });
  });
});
