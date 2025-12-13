import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

describe('RecognitionSection - Gap 1: Management → Impact Conditional Mapping', () => {
  describe('Threat Category', () => {
    /**
     * Reference: ThreatModule.js:38-41
     * if (field === '管理') {
     *   const impacts = effectAndManage?.threatIdentification?.threatManagement?.[value]?.threatImpact || [];
     *   updatedItem.影响 = impacts.length === 1 ? impacts[0] : '';
     * }
     */
    it('should auto-fill impact to "none" when management is set to "managed"', async () => {
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

      const managementSelect = screen.getByLabelText('管理状态选择');
      await userEvent.click(managementSelect);
      await userEvent.click(screen.getByText('管理的'));

      expect(mockOnUpdate).toHaveBeenCalledWith({
        threat_management: { value: 'managed' },
        threat_impact: { value: 'none' },
      });
    });

    /**
     * Reference: ThreatModule.js:40
     * When impacts.length > 1 → updatedItem.影响 = '' (clear the field)
     */
    it('should clear impact when management is set to "unmanaged"', async () => {
      const mockOnUpdate = jest.fn();
      const item = createMockItem({
        threat_management: { value: 'managed' },
        threat_impact: { value: 'none' },
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

      const managementSelect = screen.getByLabelText('管理状态选择');
      await userEvent.click(managementSelect);
      await userEvent.click(screen.getByText('未管理'));

      expect(mockOnUpdate).toHaveBeenCalledWith({
        threat_management: { value: 'unmanaged' },
        threat_impact: {},
      });
    });

    /**
     * Reference: ThreatModule.js:140
     * Impact dropdown shows options from getImpactOptions(formData.管理)
     * When managed, only one option exists and dropdown is disabled with auto-selected value
     */
    it('should have impact auto-filled and disabled when management is "managed"', () => {
      const item = createMockItem({
        threat_management: { value: 'managed' },
        threat_impact: { value: 'none' },
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

      const impactSelect = screen.getByLabelText('影响选择');
      expect(impactSelect).toBeDisabled();
      expect(screen.getByText('无关紧要')).toBeInTheDocument();
    });

    /**
     * Reference: ThreatModule.js:140 + effectAndManage.json:8
     */
    it('should show all 3 impact options when management is "unmanaged"', async () => {
      const item = createMockItem({
        threat_management: { value: 'unmanaged' },
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

      const impactSelect = screen.getByLabelText('影响选择');
      await userEvent.click(impactSelect);

      expect(screen.getByText('无关紧要')).toBeInTheDocument();
      expect(screen.getByText('导致差错')).toBeInTheDocument();
      expect(screen.getByText('导致UAS T')).toBeInTheDocument();
    });

    /**
     * Impact dropdown should be disabled when only 1 option available
     */
    it('should disable impact dropdown when management is "managed"', () => {
      const item = createMockItem({
        threat_management: { value: 'managed' },
        threat_impact: { value: 'none' },
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

      const impactSelect = screen.getByLabelText('影响选择');
      expect(impactSelect).toBeDisabled();
    });

    /**
     * Impact dropdown should be enabled when multiple options available
     */
    it('should enable impact dropdown when management is "unmanaged"', () => {
      const item = createMockItem({
        threat_management: { value: 'unmanaged' },
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

      const impactSelect = screen.getByLabelText('影响选择');
      expect(impactSelect).not.toBeDisabled();
    });
  });

  describe('Error Category', () => {
    /**
     * Same logic as threat, but with different impact options
     * Reference: ErrorModule.js:35-38
     */
    it('should auto-fill impact to "none" when error management is "managed"', async () => {
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

      const managementSelect = screen.getByLabelText('管理状态选择');
      await userEvent.click(managementSelect);
      await userEvent.click(screen.getByText('管理的'));

      expect(mockOnUpdate).toHaveBeenCalledWith({
        error_management: { value: 'managed' },
        error_impact: { value: 'none' },
      });
    });

    /**
     * Reference: effectAndManage.json:24 - error has 2 impact options (not 3)
     */
    it('should show 2 impact options when error management is "unmanaged"', async () => {
      const item = createMockItem({
        error_management: { value: 'unmanaged' },
      });

      render(
        <RecognitionSection
          category="error"
          title="差错识别"
          item={item}
          options={mockOptions}
          onUpdate={jest.fn()}
        />
      );

      const impactSelect = screen.getByLabelText('影响选择');
      await userEvent.click(impactSelect);

      expect(screen.getByText('无关紧要')).toBeInTheDocument();
      expect(screen.getByText('导致UAS E')).toBeInTheDocument();
      expect(screen.queryByText('导致差错')).not.toBeInTheDocument();
    });
  });

  describe('UAS Category', () => {
    /**
     * Reference: effectAndManage.json:35
     * UAS has management but NO impact field
     */
    it('should always disable impact dropdown for UAS category', () => {
      const item = createMockItem({
        uas_management: { value: 'managed' },
      });

      render(
        <RecognitionSection
          category="uas"
          title="UAS识别"
          item={item}
          options={mockOptions}
          onUpdate={jest.fn()}
        />
      );

      const impactSelect = screen.getByLabelText('影响选择');
      expect(impactSelect).toBeDisabled();
    });

    /**
     * UAS management change should NOT affect impact
     */
    it('should not update impact when UAS management changes', async () => {
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

      const managementSelect = screen.getByLabelText('管理状态选择');
      await userEvent.click(managementSelect);
      await userEvent.click(screen.getByText('管理的'));

      expect(mockOnUpdate).toHaveBeenCalledWith({
        uas_management: { value: 'managed' },
      });
    });
  });

  describe('Edge Cases', () => {
    /**
     * Reference: ThreatModule.js:62 - getImpactOptions returns [] if !manage
     */
    it('should show empty impact options when no management is selected', () => {
      const item = createMockItem({
        threat_management: {},
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

      const impactSelect = screen.getByLabelText('影响选择');
      expect(impactSelect).toBeDisabled();
    });

    /**
     * Switching from managed → unmanaged should:
     * 1. Clear the auto-selected impact
     * 2. Enable the impact dropdown
     */
    it('should handle management change from "managed" to "unmanaged"', async () => {
      const mockOnUpdate = jest.fn();
      const item = createMockItem({
        threat_management: { value: 'managed' },
        threat_impact: { value: 'none' },
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

      const managementSelect = screen.getByLabelText('管理状态选择');
      await userEvent.click(managementSelect);
      await userEvent.click(screen.getByText('未管理'));

      expect(mockOnUpdate).toHaveBeenCalledWith({
        threat_management: { value: 'unmanaged' },
        threat_impact: {},
      });
    });
  });
});
