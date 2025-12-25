import { render, screen } from '@testing-library/react';
import { CompetencySummary } from '../CompetencySummary';
import type { LabelingItem } from '../../../../types/annotation.types';

jest.mock('../../../../i18n', () => ({
  useAviationTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'competency.threat_related': 'Threat-Related Competency',
        'competency.error_related': 'Error-Related Competency',
        'competency.uas_related': 'UAS-Related Competency',
        'competency.situation_awareness': 'Situation Awareness',
        'competency.decision_making': 'Decision Making',
        'competency.communication': 'Communication',
        'competency.workload_management': 'Workload Management',
        'competency.crew_coordination': 'Crew Coordination',
        'competency.stress_management': 'Stress Management',
        'competency.automation_management': 'Automation Management',
      };
      return translations[key] || key;
    },
    currentLanguage: 'en',
    changeLanguage: jest.fn(),
    i18n: {} as any,
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

describe('CompetencySummary', () => {
  describe('Category Titles with i18n', () => {
    it('should display threat category title using i18n key', () => {
      const item = createMockItem({
        threat_type_l3_detail: { id: 1, code: 'T1', label: 'Threat Type 1' },
      });

      render(<CompetencySummary category="threat" item={item} />);

      expect(screen.getByText('Threat-Related Competency')).toBeInTheDocument();
    });

    it('should display error category title using i18n key', () => {
      const item = createMockItem({
        error_type_l3_detail: { id: 2, code: 'E1', label: 'Error Type 1' },
      });

      render(<CompetencySummary category="error" item={item} />);

      expect(screen.getByText('Error-Related Competency')).toBeInTheDocument();
    });

    it('should display uas category title using i18n key', () => {
      const item = createMockItem({
        uas_type_l3_detail: { id: 3, code: 'U1', label: 'UAS Type 1' },
      });

      render(<CompetencySummary category="uas" item={item} />);

      expect(screen.getByText('UAS-Related Competency')).toBeInTheDocument();
    });
  });

  describe('Coping Abilities Labels with i18n', () => {
    it('should display situation_awareness using i18n key', () => {
      const item = createMockItem({
        threat_type_l3_detail: { id: 1, code: 'T1', label: 'Test' },
        threat_coping_abilities: { values: ['situation_awareness'] },
      });

      render(<CompetencySummary category="threat" item={item} />);

      expect(screen.getByText('SA')).toBeInTheDocument();
      expect(screen.getByText('Situation Awareness')).toBeInTheDocument();
    });

    it('should display decision_making using i18n key', () => {
      const item = createMockItem({
        error_type_l3_detail: { id: 1, code: 'E1', label: 'Test' },
        error_coping_abilities: { values: ['decision_making'] },
      });

      render(<CompetencySummary category="error" item={item} />);

      expect(screen.getByText('DM')).toBeInTheDocument();
      expect(screen.getByText('Decision Making')).toBeInTheDocument();
    });

    it('should display communication using i18n key', () => {
      const item = createMockItem({
        threat_type_l3_detail: { id: 1, code: 'T1', label: 'Test' },
        threat_coping_abilities: { values: ['communication'] },
      });

      render(<CompetencySummary category="threat" item={item} />);

      expect(screen.getByText('COM')).toBeInTheDocument();
      expect(screen.getByText('Communication')).toBeInTheDocument();
    });

    it('should display workload_management using i18n key', () => {
      const item = createMockItem({
        threat_type_l3_detail: { id: 1, code: 'T1', label: 'Test' },
        threat_coping_abilities: { values: ['workload_management'] },
      });

      render(<CompetencySummary category="threat" item={item} />);

      expect(screen.getByText('WM')).toBeInTheDocument();
      expect(screen.getByText('Workload Management')).toBeInTheDocument();
    });

    it('should display crew_coordination using i18n key', () => {
      const item = createMockItem({
        threat_type_l3_detail: { id: 1, code: 'T1', label: 'Test' },
        threat_coping_abilities: { values: ['crew_coordination'] },
      });

      render(<CompetencySummary category="threat" item={item} />);

      expect(screen.getByText('CC')).toBeInTheDocument();
      expect(screen.getByText('Crew Coordination')).toBeInTheDocument();
    });

    it('should display stress_management using i18n key', () => {
      const item = createMockItem({
        threat_type_l3_detail: { id: 1, code: 'T1', label: 'Test' },
        threat_coping_abilities: { values: ['stress_management'] },
      });

      render(<CompetencySummary category="threat" item={item} />);

      expect(screen.getByText('SM')).toBeInTheDocument();
      expect(screen.getByText('Stress Management')).toBeInTheDocument();
    });

    it('should display automation_management using i18n key', () => {
      const item = createMockItem({
        threat_type_l3_detail: { id: 1, code: 'T1', label: 'Test' },
        threat_coping_abilities: { values: ['automation_management'] },
      });

      render(<CompetencySummary category="threat" item={item} />);

      expect(screen.getByText('AM')).toBeInTheDocument();
      expect(screen.getByText('Automation Management')).toBeInTheDocument();
    });

    it('should display multiple coping abilities using i18n keys', () => {
      const item = createMockItem({
        threat_type_l3_detail: { id: 1, code: 'T1', label: 'Test' },
        threat_coping_abilities: {
          values: ['situation_awareness', 'decision_making', 'communication'],
        },
      });

      render(<CompetencySummary category="threat" item={item} />);

      expect(screen.getByText('Situation Awareness')).toBeInTheDocument();
      expect(screen.getByText('Decision Making')).toBeInTheDocument();
      expect(screen.getByText('Communication')).toBeInTheDocument();
    });
  });

  describe('Component Rendering', () => {
    it('should not render when no competencies exist', () => {
      const item = createMockItem();

      const { container } = render(<CompetencySummary category="threat" item={item} />);

      expect(container.firstChild).toBeNull();
    });

    it('should display L3 type detail from item', () => {
      const item = createMockItem({
        threat_type_l3_detail: { id: 1, code: 'TE-01-001', label: 'Weather Threat' },
      });

      render(<CompetencySummary category="threat" item={item} />);

      expect(screen.getByText('TE-01-001')).toBeInTheDocument();
      expect(screen.getByText('Weather Threat')).toBeInTheDocument();
    });

    it('should display competency count correctly', () => {
      const item = createMockItem({
        threat_type_l3_detail: { id: 1, code: 'T1', label: 'Test' },
        threat_coping_abilities: {
          values: ['situation_awareness', 'decision_making'],
        },
      });

      render(<CompetencySummary category="threat" item={item} />);

      // 1 from L3 type + 2 from coping abilities = 3 total
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });
});
