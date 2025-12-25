/**
 * Static coping ability configuration
 * Note: Labels use i18n keys. Actual data is fetched from API via useCopingAbilities hook.
 * This file serves as reference/fallback configuration.
 */

export interface CopingAbilityOption {
  code: string;
  labelKey: string;
}

export interface CopingAbilityGroup {
  code: string;
  labelKey: string;
  options: CopingAbilityOption[];
}

/**
 * Static coping abilities with i18n keys
 * Maps to i18n keys: coping.knowledge, coping.procedure, etc.
 */
export const COPING_ABILITIES: CopingAbilityGroup[] = [
  {
    code: 'KNO',
    labelKey: 'coping.knowledge',
    options: [
      { code: 'KNO.1', labelKey: 'coping.knowledge_app_1' },
      { code: 'KNO.2', labelKey: 'coping.knowledge_app_2' },
    ],
  },
  {
    code: 'PRO',
    labelKey: 'coping.procedure',
    options: [
      { code: 'PRO.1', labelKey: 'coping.procedure_app_1' },
      { code: 'PRO.2', labelKey: 'coping.procedure_app_2' },
    ],
  },
];
