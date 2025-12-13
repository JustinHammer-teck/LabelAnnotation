export interface CopingAbilityOption {
  code: string;
  label: string;
}

export interface CopingAbilityGroup {
  code: string;
  label: string;
  options: CopingAbilityOption[];
}

export const COPING_ABILITIES: CopingAbilityGroup[] = [
  {
    code: 'KNO',
    label: '知识',
    options: [
      { code: 'KNO.1', label: '知识应用 1' },
      { code: 'KNO.2', label: '知识应用 2' },
    ],
  },
  {
    code: 'PRO',
    label: '程序',
    options: [
      { code: 'PRO.1', label: '程序应用 1' },
      { code: 'PRO.2', label: '程序应用 2' },
    ],
  },
];
