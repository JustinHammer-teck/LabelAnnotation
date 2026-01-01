import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';

// Custom render function with common providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => {
  return render(ui, { ...options });
};

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };

// Mock data helpers for aviation event data structure
export const createMockEvent = (overrides: Record<string, unknown> = {}) => ({
  eventId: 'TEST-001',
  基本信息: {
    事件编号: 'TEST-001',
    日期: '2025-01-15',
    机型: 'A320',
    报告单位: 'Test Unit',
    起飞机场: 'PEK',
    落地机场: 'SHA',
    ...overrides,
  },
  事件描述: 'Test description',
  结果绩效列表: [],
  标签标注列表: [],
});

// Mock labeling hierarchy structure
export const createMockLabHieStru = (overrides: Record<string, unknown[]> = {}) => ({
  威胁列表: [],
  差错列表: [],
  UAS列表: [],
  ...overrides,
});

// Mock labeling item
export const createMockLabelingItem = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  event: 1,
  sequence_number: 1,
  status: 'draft' as const,
  threat_type_l1: null,
  threat_type_l2: null,
  threat_type_l3: null,
  threat_management: {},
  threat_impact: {},
  threat_coping_abilities: {},
  error_type_l1: null,
  error_type_l2: null,
  error_type_l3: null,
  error_management: {},
  error_impact: {},
  error_coping_abilities: {},
  uas_applicable: false,
  uas_type_l1: null,
  uas_type_l2: null,
  uas_type_l3: null,
  uas_management: {},
  uas_impact: {},
  uas_coping_abilities: {},
  calculated_threat_topics: [],
  calculated_error_topics: [],
  calculated_uas_topics: [],
  linked_result_id: null,
  ...overrides,
});

// Mock result performance
export const createMockResultPerformance = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  event: 1,
  aviation_project: 1,
  event_type: '',
  severity: '',
  likelihood: '',
  training_effect: '',
  training_plan: '',
  training_topics: [],
  training_goals: '',
  recommendations: '',
  threat_summary: '',
  error_summary: '',
  competency_summary: '',
  linked_items: [],
  status: 'draft' as const,
  ...overrides,
});

// Mock dropdown option
export const createMockDropdownOption = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  category: 'threat' as const,
  level: 1,
  parent_id: null,
  code: 'T1',
  label: 'Test Option',
  label_zh: 'Test Option',
  training_topics: [],
  children: [],
  ...overrides,
});
