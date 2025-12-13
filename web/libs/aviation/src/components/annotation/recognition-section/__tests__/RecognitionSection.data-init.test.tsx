import { render } from '@testing-library/react';
import { RecognitionSection } from '../RecognitionSection';
import type { LabelingItem } from '../../../../types/annotation.types';
import type { DropdownOption } from '../../../../types/dropdown.types';

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
  { id: 1, code: 'TE', label: 'TE环境', children: [] },
];

/**
 * GAP 4: Data Initialization Guard
 *
 * Reference: label-lib ThreatModule.js:13-25
 * useEffect(() => {
 *   if (Array.isArray(data) || !data) {
 *     onChange({
 *       level1: '', level2: '', level3: '',
 *       管理: '', 影响: '', 应对能力: [], 描述: ''
 *     });
 *   }
 * }, [data, onChange]);
 *
 * Aviation RecognitionSection must detect and initialize malformed data
 * (arrays, null, undefined) in management/impact/coping_abilities fields.
 */
describe('RecognitionSection - Gap 4: Data Initialization Guard', () => {
  describe('Threat Category', () => {
    /**
     * Reference: ThreatModule.js:14
     * Array.isArray(data) triggers initialization
     */
    it('should call onUpdate to initialize when threat_management is an array', () => {
      const mockOnUpdate = jest.fn();
      const item = createMockItem({
        threat_management: [] as unknown as LabelingItem['threat_management'],
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

      expect(mockOnUpdate).toHaveBeenCalledWith({
        threat_management: {},
        threat_impact: {},
        threat_coping_abilities: { values: [] },
      });
    });

    /**
     * Reference: ThreatModule.js:14
     * !data (null) triggers initialization
     */
    it('should call onUpdate to initialize when threat_impact is null', () => {
      const mockOnUpdate = jest.fn();
      const item = createMockItem({
        threat_impact: null as unknown as LabelingItem['threat_impact'],
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

      expect(mockOnUpdate).toHaveBeenCalledWith({
        threat_management: {},
        threat_impact: {},
        threat_coping_abilities: { values: [] },
      });
    });

    /**
     * Reference: ThreatModule.js:14
     * !data (undefined) triggers initialization
     */
    it('should call onUpdate to initialize when threat_coping_abilities is undefined', () => {
      const mockOnUpdate = jest.fn();
      const item = createMockItem({
        threat_coping_abilities: undefined as unknown as LabelingItem['threat_coping_abilities'],
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

      expect(mockOnUpdate).toHaveBeenCalledWith({
        threat_management: {},
        threat_impact: {},
        threat_coping_abilities: { values: [] },
      });
    });

    /**
     * Valid object data should NOT trigger initialization
     */
    it('should NOT call onUpdate when all threat fields are valid objects', () => {
      const mockOnUpdate = jest.fn();
      const item = createMockItem({
        threat_management: { value: 'managed' },
        threat_impact: { value: 'none' },
        threat_coping_abilities: { values: ['communication'] },
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

      expect(mockOnUpdate).not.toHaveBeenCalled();
    });

    /**
     * Empty objects {} are valid and should NOT trigger initialization
     */
    it('should NOT call onUpdate when threat fields are empty objects', () => {
      const mockOnUpdate = jest.fn();
      const item = createMockItem({
        threat_management: {},
        threat_impact: {},
        threat_coping_abilities: {},
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

      expect(mockOnUpdate).not.toHaveBeenCalled();
    });
  });

  describe('Error Category', () => {
    /**
     * Reference: ThreatModule.js:14 (same pattern for ErrorModule)
     * Array data triggers initialization
     */
    it('should call onUpdate to initialize when error_management is an array', () => {
      const mockOnUpdate = jest.fn();
      const item = createMockItem({
        error_management: ['invalid'] as unknown as LabelingItem['error_management'],
      });

      render(
        <RecognitionSection
          category="error"
          title="差错识别"
          item={item}
          options={mockOptions}
          onUpdate={mockOnUpdate}
        />
      );

      expect(mockOnUpdate).toHaveBeenCalledWith({
        error_management: {},
        error_impact: {},
        error_coping_abilities: { values: [] },
      });
    });

    /**
     * Null data triggers initialization
     */
    it('should call onUpdate to initialize when error_impact is null', () => {
      const mockOnUpdate = jest.fn();
      const item = createMockItem({
        error_impact: null as unknown as LabelingItem['error_impact'],
      });

      render(
        <RecognitionSection
          category="error"
          title="差错识别"
          item={item}
          options={mockOptions}
          onUpdate={mockOnUpdate}
        />
      );

      expect(mockOnUpdate).toHaveBeenCalledWith({
        error_management: {},
        error_impact: {},
        error_coping_abilities: { values: [] },
      });
    });

    /**
     * Valid object data should NOT trigger initialization
     */
    it('should NOT call onUpdate when all error fields are valid objects', () => {
      const mockOnUpdate = jest.fn();
      const item = createMockItem({
        error_management: { value: 'unmanaged' },
        error_impact: { value: 'leads_to_uas' },
        error_coping_abilities: { values: [] },
      });

      render(
        <RecognitionSection
          category="error"
          title="差错识别"
          item={item}
          options={mockOptions}
          onUpdate={mockOnUpdate}
        />
      );

      expect(mockOnUpdate).not.toHaveBeenCalled();
    });
  });

  describe('UAS Category', () => {
    /**
     * Array data triggers initialization for UAS
     */
    it('should call onUpdate to initialize when uas_management is an array', () => {
      const mockOnUpdate = jest.fn();
      const item = createMockItem({
        uas_management: [] as unknown as LabelingItem['uas_management'],
      });

      render(
        <RecognitionSection
          category="uas"
          title="UAS识别"
          item={item}
          options={mockOptions}
          onUpdate={mockOnUpdate}
        />
      );

      expect(mockOnUpdate).toHaveBeenCalledWith({
        uas_management: {},
        uas_impact: {},
        uas_coping_abilities: { values: [] },
      });
    });

    /**
     * Undefined data triggers initialization for UAS
     */
    it('should call onUpdate to initialize when uas_coping_abilities is undefined', () => {
      const mockOnUpdate = jest.fn();
      const item = createMockItem({
        uas_coping_abilities: undefined as unknown as LabelingItem['uas_coping_abilities'],
      });

      render(
        <RecognitionSection
          category="uas"
          title="UAS识别"
          item={item}
          options={mockOptions}
          onUpdate={mockOnUpdate}
        />
      );

      expect(mockOnUpdate).toHaveBeenCalledWith({
        uas_management: {},
        uas_impact: {},
        uas_coping_abilities: { values: [] },
      });
    });

    /**
     * Valid object data should NOT trigger initialization
     */
    it('should NOT call onUpdate when all uas fields are valid objects', () => {
      const mockOnUpdate = jest.fn();
      const item = createMockItem({
        uas_management: { value: 'managed' },
        uas_impact: {},
        uas_coping_abilities: { values: ['decision_making'] },
      });

      render(
        <RecognitionSection
          category="uas"
          title="UAS识别"
          item={item}
          options={mockOptions}
          onUpdate={mockOnUpdate}
        />
      );

      expect(mockOnUpdate).not.toHaveBeenCalled();
    });
  });

  describe('Mixed Malformed Data', () => {
    /**
     * When management is array and impact is null, both trigger initialization
     */
    it('should initialize when management is array and impact is null', () => {
      const mockOnUpdate = jest.fn();
      const item = createMockItem({
        threat_management: ['bad'] as unknown as LabelingItem['threat_management'],
        threat_impact: null as unknown as LabelingItem['threat_impact'],
        threat_coping_abilities: { values: [] },
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

      expect(mockOnUpdate).toHaveBeenCalledWith({
        threat_management: {},
        threat_impact: {},
        threat_coping_abilities: { values: [] },
      });
    });

    /**
     * When only coping_abilities is malformed (array), still triggers full initialization
     */
    it('should initialize all fields when only coping_abilities is an array', () => {
      const mockOnUpdate = jest.fn();
      const item = createMockItem({
        error_management: { value: 'managed' },
        error_impact: { value: 'none' },
        error_coping_abilities: ['invalid', 'array'] as unknown as LabelingItem['error_coping_abilities'],
      });

      render(
        <RecognitionSection
          category="error"
          title="差错识别"
          item={item}
          options={mockOptions}
          onUpdate={mockOnUpdate}
        />
      );

      expect(mockOnUpdate).toHaveBeenCalledWith({
        error_management: {},
        error_impact: {},
        error_coping_abilities: { values: [] },
      });
    });

    /**
     * All three fields malformed should trigger single initialization call
     */
    it('should call onUpdate once when all fields are malformed', () => {
      const mockOnUpdate = jest.fn();
      const item = createMockItem({
        uas_management: null as unknown as LabelingItem['uas_management'],
        uas_impact: [] as unknown as LabelingItem['uas_impact'],
        uas_coping_abilities: undefined as unknown as LabelingItem['uas_coping_abilities'],
      });

      render(
        <RecognitionSection
          category="uas"
          title="UAS识别"
          item={item}
          options={mockOptions}
          onUpdate={mockOnUpdate}
        />
      );

      expect(mockOnUpdate).toHaveBeenCalledTimes(1);
      expect(mockOnUpdate).toHaveBeenCalledWith({
        uas_management: {},
        uas_impact: {},
        uas_coping_abilities: { values: [] },
      });
    });
  });
});
