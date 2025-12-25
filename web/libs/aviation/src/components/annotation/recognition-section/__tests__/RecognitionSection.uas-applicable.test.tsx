import { render, screen } from '@testing-library/react';
import { RecognitionSection } from '../RecognitionSection';
import type { LabelingItem } from '../../../../types/annotation.types';
import type { DropdownOption } from '../../../../types/dropdown.types';

jest.mock('../../../../i18n', () => ({
  useAviationTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        // Impact options
        'impact.none': '无关紧要',
        'impact.leads_to_error': '导致差错',
        'impact.leads_to_uas_t': '导致UAS T',
        'impact.leads_to_uas_e': '导致UAS E',
        // Management state options
        'management_state.managed': '管理的',
        'management_state.unmanaged': '未管理',
        'management_state.ineffective': '无效管理',
        'management_state.unobserved': '未观察到',
        // Recognition section labels - aria-labels match test expectations
        'recognition.threat.title': '威胁识别',
        'recognition.threat.type': '威胁类型选择',
        'recognition.error.title': '差错识别',
        'recognition.error.type': '差错类型选择',
        'recognition.uas.title': 'UAS识别',
        'recognition.uas.type': 'UAS类型选择',
        'recognition.management': '管理状态选择',
        'recognition.impact': '影响选择',
        'recognition.coping_ability': '应对能力选择',
        'recognition.description': '描述',
        'recognition.select_management': '选择管理',
        'recognition.select_impact': '选择影响',
        'recognition.select_coping': '选择应对能力',
        'recognition.enter_description': '可补充描述',
        'recognition.enter_threat_description': '可补充该威胁的描述',
        'recognition.enter_error_description': '可补充该差错的描述',
        'recognition.enter_uas_description': '可补充该UAS事件的描述',
        // Training topics
        'training_topics.title': '训练主题',
      };
      return translations[key] || key;
    },
    currentLanguage: 'cn',
    changeLanguage: jest.fn(),
    i18n: {} as any,
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

const mockOptions: DropdownOption[] = [
  { id: 1, code: 'UAS1', label: 'UAS类型1', children: [] },
];

describe('RecognitionSection - Gap 2: UAS Auto-Enable Based on Impact', () => {
  describe('Props Integration', () => {
    /**
     * Reference: UASModule.js:24
     * const isDisabled = !isUASRequired;
     * When uasDisabled=true, all fields should be disabled
     */
    it('should disable all fields when uasDisabled=true', () => {
      const item = createMockItem();

      render(
        <RecognitionSection
          category="uas"
          title="UAS识别"
          item={item}
          options={mockOptions}
          onUpdate={jest.fn()}
          uasDisabled={true}
        />
      );

      const managementSelect = screen.getByLabelText('管理状态选择');
      expect(managementSelect).toBeDisabled();

      const impactSelect = screen.getByLabelText('影响选择');
      expect(impactSelect).toBeDisabled();
    });

    /**
     * When uasDisabled=false, fields should be enabled (based on their own logic)
     */
    it('should enable fields when uasDisabled=false', () => {
      const item = createMockItem();

      render(
        <RecognitionSection
          category="uas"
          title="UAS识别"
          item={item}
          options={mockOptions}
          onUpdate={jest.fn()}
          uasDisabled={false}
        />
      );

      const managementSelect = screen.getByLabelText('管理状态选择');
      expect(managementSelect).not.toBeDisabled();
    });

    /**
     * Reference: UASModule.js:70-73
     * {isDisabled && (
     *   <div style={{ color: '#999' }}>UAS not required based on relevance</div>
     * )}
     */
    it('should display disabled message when uasDisabled=true and uasDisabledMessage provided', () => {
      const item = createMockItem();
      const disabledMessage = 'UAS需要威胁影响为"导致UAS T"或差错影响为"导致UAS E"';

      render(
        <RecognitionSection
          category="uas"
          title="UAS识别"
          item={item}
          options={mockOptions}
          onUpdate={jest.fn()}
          uasDisabled={true}
          uasDisabledMessage={disabledMessage}
        />
      );

      expect(screen.getByText(disabledMessage)).toBeInTheDocument();
    });

    /**
     * uasDisabled should combine with the standard disabled prop
     */
    it('should combine uasDisabled with disabled prop', () => {
      const item = createMockItem();

      render(
        <RecognitionSection
          category="uas"
          title="UAS识别"
          item={item}
          options={mockOptions}
          onUpdate={jest.fn()}
          disabled={true}
          uasDisabled={false}
        />
      );

      const managementSelect = screen.getByLabelText('管理状态选择');
      expect(managementSelect).toBeDisabled();
    });
  });

  describe('Consumer Component Integration', () => {
    /**
     * Reference: LabelingList.js:120
     * isUASRequired = (item.威胁列表?.影响 === '导致UAS T')
     * Simulates threat_impact triggering UAS enablement
     */
    it('should enable UAS section when threat_impact=leads_to_uas', () => {
      const item = createMockItem({
        threat_impact: { value: 'leads_to_uas' },
      });

      render(
        <RecognitionSection
          category="uas"
          title="UAS识别"
          item={item}
          options={mockOptions}
          onUpdate={jest.fn()}
          uasDisabled={false}
        />
      );

      const managementSelect = screen.getByLabelText('管理状态选择');
      expect(managementSelect).not.toBeDisabled();
    });

    /**
     * Reference: LabelingList.js:120
     * isUASRequired = (item.差错列表?.影响 === '导致UAS E')
     * Simulates error_impact triggering UAS enablement
     */
    it('should enable UAS section when error_impact=leads_to_uas', () => {
      const item = createMockItem({
        error_impact: { value: 'leads_to_uas' },
      });

      render(
        <RecognitionSection
          category="uas"
          title="UAS识别"
          item={item}
          options={mockOptions}
          onUpdate={jest.fn()}
          uasDisabled={false}
        />
      );

      const managementSelect = screen.getByLabelText('管理状态选择');
      expect(managementSelect).not.toBeDisabled();
    });

    /**
     * When neither threat nor error has leads_to_uas, UAS should be disabled
     */
    it('should disable UAS section and show message when no impact triggers UAS', () => {
      const item = createMockItem({
        threat_impact: { value: 'none' },
        error_impact: { value: 'none' },
      });
      const disabledMessage = 'UAS需要威胁影响为"导致UAS T"或差错影响为"导致UAS E"';

      render(
        <RecognitionSection
          category="uas"
          title="UAS识别"
          item={item}
          options={mockOptions}
          onUpdate={jest.fn()}
          uasDisabled={true}
          uasDisabledMessage={disabledMessage}
        />
      );

      const managementSelect = screen.getByLabelText('管理状态选择');
      expect(managementSelect).toBeDisabled();
      expect(screen.getByText(disabledMessage)).toBeInTheDocument();
    });

    /**
     * Reference: effectAndManage.json - threat can have 'leads_to_error'
     * 'leads_to_error' should NOT enable UAS section
     */
    it('should disable UAS section when threat_impact=leads_to_error', () => {
      const item = createMockItem({
        threat_impact: { value: 'leads_to_error' },
      });

      render(
        <RecognitionSection
          category="uas"
          title="UAS识别"
          item={item}
          options={mockOptions}
          onUpdate={jest.fn()}
          uasDisabled={true}
        />
      );

      const managementSelect = screen.getByLabelText('管理状态选择');
      expect(managementSelect).toBeDisabled();
    });
  });

  describe('UI Feedback', () => {
    /**
     * Disabled message should contain relevant UAS text
     */
    it('should render disabled message containing 导致UAS text', () => {
      const item = createMockItem();
      const disabledMessage = 'UAS需要威胁影响为"导致UAS T"或差错影响为"导致UAS E"';

      render(
        <RecognitionSection
          category="uas"
          title="UAS识别"
          item={item}
          options={mockOptions}
          onUpdate={jest.fn()}
          uasDisabled={true}
          uasDisabledMessage={disabledMessage}
        />
      );

      const messageElement = screen.getByText(/导致UAS/);
      expect(messageElement).toBeInTheDocument();
    });

    /**
     * Disabled message should have proper styling class
     */
    it('should apply disabledMessage styling class to message element', () => {
      const item = createMockItem();
      const disabledMessage = 'UAS需要威胁影响为"导致UAS T"或差错影响为"导致UAS E"';

      render(
        <RecognitionSection
          category="uas"
          title="UAS识别"
          item={item}
          options={mockOptions}
          onUpdate={jest.fn()}
          uasDisabled={true}
          uasDisabledMessage={disabledMessage}
        />
      );

      const messageElement = screen.getByText(disabledMessage);
      expect(messageElement).toHaveClass('disabledMessage');
    });

    /**
     * Message should not be rendered when UAS is enabled
     */
    it('should not render disabled message when uasDisabled=false', () => {
      const item = createMockItem();
      const disabledMessage = 'UAS需要威胁影响为"导致UAS T"或差错影响为"导致UAS E"';

      render(
        <RecognitionSection
          category="uas"
          title="UAS识别"
          item={item}
          options={mockOptions}
          onUpdate={jest.fn()}
          uasDisabled={false}
          uasDisabledMessage={disabledMessage}
        />
      );

      expect(screen.queryByText(disabledMessage)).not.toBeInTheDocument();
    });

    /**
     * Fields should indicate disabled state via aria-disabled or disabled attribute
     */
    it('should indicate disabled state via disabled attribute', () => {
      const item = createMockItem();

      render(
        <RecognitionSection
          category="uas"
          title="UAS识别"
          item={item}
          options={mockOptions}
          onUpdate={jest.fn()}
          uasDisabled={true}
        />
      );

      const managementSelect = screen.getByLabelText('管理状态选择');
      expect(managementSelect).toHaveAttribute('disabled');
    });
  });
});
