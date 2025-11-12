import chroma from "chroma-js";

const getCSSVariable = (varName: string): string => {
  if (typeof window === 'undefined') return 'rgb(0, 0, 0)';
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(`${varName}-raw`)
    .trim();
  if (!raw) return 'rgb(0, 0, 0)';
  const [r, g, b] = raw.split(/\s+/).map(Number);
  return `rgb(${r}, ${g}, ${b})`;
};

const createStatusColors = (baseColor: string) => {
  const base = chroma(baseColor);
  return {
    bg: base.brighten(2.5).desaturate(0.5).css(),
    border: base.brighten(1.5).desaturate(0.3).css(),
    text: base.darken(0.5).css(),
    textDark: base.darken(1.2).css(),
  };
};

const getThemeColors = () => {
  return {
    chart: {
      primary: getCSSVariable('--color-primary-content'),
      secondary: getCSSVariable('--color-accent-plum-base'),
      tertiary: getCSSVariable('--color-positive-content'),
      accent: getCSSVariable('--color-accent-blueberry-bold'),
      neutral: getCSSVariable('--color-neutral-content'),
    },
    status: {
      completed: getCSSVariable('--color-accent-kiwi-bold'),
      inProgress: getCSSVariable('--color-accent-persimmon-bold'),
      pending: getCSSVariable('--color-accent-blueberry-bold'),
    },
  };
};

export const DASHBOARD_COLORS = (() => {
  const themeColors = getThemeColors();

  return {
    chart: themeColors.chart,
    status: {
      completed: createStatusColors(themeColors.status.completed),
      inProgress: createStatusColors(themeColors.status.inProgress),
      pending: createStatusColors(themeColors.status.pending),
    },
  };
})();

export const CHART_PALETTE = [
  // getCSSVariable('--color-accent-plum-base'),
  // getCSSVariable('--color-accent-fig-base'),
  getCSSVariable('--color-accent-kale-base'),
  getCSSVariable('--color-accent-blueberry-base'),
  getCSSVariable('--color-accent-kiwi-base'),
  getCSSVariable('--color-accent-grape-base'),
  getCSSVariable('--color-accent-mango-base'),
  // getCSSVariable('--color-accent-canteloupe-base'),
  getCSSVariable('--color-accent-persimmon-base'),
  getCSSVariable('--color-warning-icon'),
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
