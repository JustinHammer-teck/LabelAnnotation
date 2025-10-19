import chroma from "chroma-js";

const BASE_COLORS = {
  chart: {
    primary: '#0F62FE',
    secondary: '#8A3FFC',
    tertiary: '#33B1FF',
    accent: '#24A148',
    neutral: '#525252',
  },
  status: {
    completed: '#24A148',
    inProgress: '#0F62FE',
    pending: '#F1C21B',
  },
} as const;

const createStatusColors = (baseColor: string) => {
  const base = chroma(baseColor);
  return {
    bg: base.brighten(2.5).desaturate(0.5).css(),
    border: base.brighten(1.5).desaturate(0.3).css(),
    text: base.darken(0.5).css(),
    textDark: base.darken(1.2).css(),
  };
};

export const DASHBOARD_COLORS = {
  chart: {
    primary: BASE_COLORS.chart.primary,
    secondary: BASE_COLORS.chart.secondary,
    tertiary: BASE_COLORS.chart.tertiary,
    accent: BASE_COLORS.chart.accent,
    neutral: BASE_COLORS.chart.neutral,
  },
  status: {
    completed: createStatusColors(BASE_COLORS.status.completed),
    inProgress: createStatusColors(BASE_COLORS.status.inProgress),
    pending: createStatusColors(BASE_COLORS.status.pending),
  },
} as const;

export const CHART_PALETTE = [
  BASE_COLORS.chart.primary,
  BASE_COLORS.chart.secondary,
  BASE_COLORS.chart.accent,
  BASE_COLORS.chart.tertiary,
  BASE_COLORS.chart.neutral,
  '#D12771',
  '#FA4D56',
  '#FF832B',
  '#198038',
  '#1192E8',
];

export const generateChartColors = (count: number, alpha = 1): string[] => {
  const colors = [];
  for (let i = 0; i < count; i++) {
    const baseColor = CHART_PALETTE[i % CHART_PALETTE.length];
    colors.push(alpha < 1 ? chroma(baseColor).alpha(alpha).css() : baseColor);
  }
  return colors;
};

export const withAlpha = (color: string, alpha: number): string => {
  return chroma(color).alpha(alpha).css();
};

export const brighten = (color: string, amount = 1): string => {
  return chroma(color).brighten(amount).css();
};

export const darken = (color: string, amount = 1): string => {
  return chroma(color).darken(amount).css();
};
