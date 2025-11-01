import chroma from "chroma-js";

const BASE_COLORS = {
  chart: {
    primary: '#4A90E2',
    secondary: '#9B59B6',
    tertiary: '#27AE60',
    accent: '#F5A623',
    neutral: '#525252',
  },
  status: {
    completed: '#27AE60',
    inProgress: '#4A90E2',
    pending: '#F39C12',
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
  '#4A90E2',
  '#F5A623',
  '#E74C3C',
  '#27AE60',
  '#9B59B6',
  '#E91E63',
  '#16A085',
  '#3498DB',
  '#2ECC71',
  '#F39C12',
  '#1ABC9C',
  '#E67E22',
  '#5DADE2',
  '#EC7063',
  '#58D68D',
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
