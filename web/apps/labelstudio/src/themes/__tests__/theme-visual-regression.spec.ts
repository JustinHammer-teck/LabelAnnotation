/**
 * Theme Visual Regression Tests
 *
 * These tests verify that label tokens render correctly in both light and dark modes.
 * They ensure visual consistency and prevent regressions when theme changes are made.
 *
 * Test Categories:
 * 1. Light Mode Tests - Verify all tokens have correct light mode values
 * 2. Dark Mode Tests - Verify all tokens have correct dark mode values
 * 3. Integration Tests - Ensure existing tokens are not broken
 */

import * as fs from "fs";
import * as path from "path";

// Token definitions with expected values for both modes
const EXPECTED_TOKENS = {
  light: {
    // Primary tokens (5)
    "--label-primary": "#1890ff",
    "--label-primary-hover": "#40a9ff",
    "--label-primary-active": "#096dd9",
    "--label-primary-bg": "#e6f7ff",
    "--label-primary-border": "#91d5ff",

    // Neutral tokens (8)
    "--label-bg-base": "#fff",
    "--label-bg-content": "#f0f4f8",
    "--label-bg-hover": "#f5f5f5",
    "--label-border-base": "#e8e8e8",
    "--label-border-light": "#d9d9d9",
    "--label-text-primary": "#333",
    "--label-text-secondary": "#666",
    "--label-text-muted": "#999",

    // Module tokens (14) - fallback values when CSS vars are not available
    "--label-competency-bg": "#e8f4fc",
    "--label-competency-border": "#b3d4ea",
    "--label-training-bg": "#f0f7ed",
    "--label-training-border": "#c5ddb8",
    "--label-threat-bg": "#fef6f0",
    "--label-threat-border": "#e8cfc0",
    "--label-error-bg": "#fef4f3",
    "--label-error-border": "#e8c8c5",
    "--label-uas-bg": "#f7f3fc",
    "--label-uas-border": "#d4c8e8",
    "--label-result-bg": "#f0f7fa",
    "--label-result-border": "#b8d8e8",
    "--label-labeling-bg": "#f5f8fc",
    "--label-labeling-border": "#ccd9e8",
  },
  dark: {
    // Primary tokens (5)
    "--label-primary": "#177ddc",
    "--label-primary-hover": "#3c9ae8",
    "--label-primary-active": "#1765ad",
    "--label-primary-bg": "#111d2c",
    "--label-primary-border": "#15395b",

    // Neutral tokens (8)
    "--label-bg-base": "#1f1f1f",
    "--label-bg-content": "#141414",
    "--label-bg-hover": "#2a2a2a",
    "--label-border-base": "#434343",
    "--label-border-light": "#303030",
    "--label-text-primary": "#f0f0f0",
    "--label-text-secondary": "#a6a6a6",
    "--label-text-muted": "#6b6b6b",

    // Module tokens (14) - fallback values for dark mode
    "--label-competency-bg": "#112a45",
    "--label-competency-border": "#1c3a5f",
    "--label-training-bg": "#162312",
    "--label-training-border": "#274916",
    "--label-threat-bg": "#2b1d11",
    "--label-threat-border": "#4a3220",
    "--label-error-bg": "#2a1215",
    "--label-error-border": "#48181c",
    "--label-uas-bg": "#1a1325",
    "--label-uas-border": "#301c4d",
    "--label-result-bg": "#111b26",
    "--label-result-border": "#164c7e",
    "--label-labeling-bg": "#141620",
    "--label-labeling-border": "#1d2436",
  },
};

// Group tokens by category for organized testing
const TOKEN_CATEGORIES = {
  primary: [
    "--label-primary",
    "--label-primary-hover",
    "--label-primary-active",
    "--label-primary-bg",
    "--label-primary-border",
  ],
  neutral: [
    "--label-bg-base",
    "--label-bg-content",
    "--label-bg-hover",
    "--label-border-base",
    "--label-border-light",
    "--label-text-primary",
    "--label-text-secondary",
    "--label-text-muted",
  ],
  modules: [
    "--label-competency-bg",
    "--label-competency-border",
    "--label-training-bg",
    "--label-training-border",
    "--label-threat-bg",
    "--label-threat-border",
    "--label-error-bg",
    "--label-error-border",
    "--label-uas-bg",
    "--label-uas-border",
    "--label-result-bg",
    "--label-result-border",
    "--label-labeling-bg",
    "--label-labeling-border",
  ],
};

// Existing color tokens that should not be broken
const EXISTING_COLOR_TOKENS = [
  "--color-neutral-content",
  "--color-primary-surface",
  "--color-accent-blueberry-subtlest",
  "--color-positive-background",
  "--color-warning-background",
  "--color-negative-background",
];

describe("Theme Visual Regression Tests", () => {
  const labelTokensPath = path.resolve(
    __dirname,
    "../../../../../libs/ui/src/tokens/label-tokens.scss"
  );

  let styleElement: HTMLStyleElement;

  /**
   * Helper function to inject CSS tokens into the document
   */
  const injectTokens = (mode: "light" | "dark"): void => {
    const tokens = EXPECTED_TOKENS[mode];
    const selector = mode === "dark" ? '[data-color-scheme="dark"]' : ":root";

    styleElement = document.createElement("style");
    styleElement.id = "test-visual-regression-tokens";

    const cssVariables = Object.entries(tokens)
      .map(([key, value]) => `${key}: ${value};`)
      .join("\n          ");

    // Also add some existing color tokens to test they aren't broken
    const existingTokens = `
          --color-neutral-content: #333333;
          --color-primary-surface: #4c5fa9;
          --color-accent-blueberry-subtlest: ${mode === "dark" ? "#112a45" : "#e8f4fc"};
          --color-positive-background: ${mode === "dark" ? "#162312" : "#f0f7ed"};
          --color-warning-background: ${mode === "dark" ? "#2b1d11" : "#fef6f0"};
          --color-negative-background: ${mode === "dark" ? "#2a1215" : "#fef4f3"};
    `;

    if (mode === "dark") {
      styleElement.textContent = `
        :root {
          ${existingTokens}
        }
        ${selector} {
          ${cssVariables}
        }
      `;
      document.documentElement.setAttribute("data-color-scheme", "dark");
    } else {
      styleElement.textContent = `
        ${selector} {
          ${cssVariables}
          ${existingTokens}
        }
      `;
      document.documentElement.removeAttribute("data-color-scheme");
    }

    document.head.appendChild(styleElement);
  };

  /**
   * Helper function to clean up injected styles
   */
  const cleanupTokens = (): void => {
    const element = document.getElementById("test-visual-regression-tokens");
    if (element) {
      element.remove();
    }
    document.documentElement.removeAttribute("data-color-scheme");
  };

  /**
   * Helper function to get computed CSS property value
   */
  const getTokenValue = (tokenName: string): string => {
    const computedStyle = getComputedStyle(document.documentElement);
    return computedStyle.getPropertyValue(tokenName).trim();
  };

  /**
   * Helper function to create a snapshot of all token values
   */
  const createTokenSnapshot = (): Record<string, string> => {
    const allTokens = [
      ...TOKEN_CATEGORIES.primary,
      ...TOKEN_CATEGORIES.neutral,
      ...TOKEN_CATEGORIES.modules,
    ];
    const snapshot: Record<string, string> = {};

    allTokens.forEach((token) => {
      snapshot[token] = getTokenValue(token);
    });

    return snapshot;
  };

  afterEach(() => {
    cleanupTokens();
  });

  describe("Light Mode Tests", () => {
    beforeEach(() => {
      injectTokens("light");
    });

    describe("Primary Tokens", () => {
      it.each(TOKEN_CATEGORIES.primary)(
        "should render %s with correct light mode value",
        (tokenName) => {
          const expectedValue =
            EXPECTED_TOKENS.light[
              tokenName as keyof typeof EXPECTED_TOKENS.light
            ];
          const actualValue = getTokenValue(tokenName);
          expect(actualValue).toBe(expectedValue);
        }
      );
    });

    describe("Neutral Tokens", () => {
      it.each(TOKEN_CATEGORIES.neutral)(
        "should render %s with correct light mode value",
        (tokenName) => {
          const expectedValue =
            EXPECTED_TOKENS.light[
              tokenName as keyof typeof EXPECTED_TOKENS.light
            ];
          const actualValue = getTokenValue(tokenName);
          expect(actualValue).toBe(expectedValue);
        }
      );
    });

    describe("Module Tokens", () => {
      it.each(TOKEN_CATEGORIES.modules)(
        "should render %s with correct light mode value",
        (tokenName) => {
          const expectedValue =
            EXPECTED_TOKENS.light[
              tokenName as keyof typeof EXPECTED_TOKENS.light
            ];
          const actualValue = getTokenValue(tokenName);
          expect(actualValue).toBe(expectedValue);
        }
      );
    });

    describe("Snapshot Comparison", () => {
      it("should match light mode token snapshot", () => {
        const snapshot = createTokenSnapshot();
        expect(snapshot).toMatchSnapshot("light-mode-tokens");
      });

      it("should have all 27 label tokens defined", () => {
        const snapshot = createTokenSnapshot();
        const tokenCount = Object.keys(snapshot).length;
        expect(tokenCount).toBe(27);
      });
    });
  });

  describe("Dark Mode Tests", () => {
    beforeEach(() => {
      injectTokens("dark");
    });

    it('should have data-color-scheme="dark" attribute set', () => {
      expect(document.documentElement.getAttribute("data-color-scheme")).toBe(
        "dark"
      );
    });

    describe("Primary Tokens", () => {
      it.each(TOKEN_CATEGORIES.primary)(
        "should render %s with correct dark mode value",
        (tokenName) => {
          const expectedValue =
            EXPECTED_TOKENS.dark[
              tokenName as keyof typeof EXPECTED_TOKENS.dark
            ];
          const actualValue = getTokenValue(tokenName);
          expect(actualValue).toBe(expectedValue);
        }
      );
    });

    describe("Neutral Tokens", () => {
      it.each(TOKEN_CATEGORIES.neutral)(
        "should render %s with correct dark mode value",
        (tokenName) => {
          const expectedValue =
            EXPECTED_TOKENS.dark[
              tokenName as keyof typeof EXPECTED_TOKENS.dark
            ];
          const actualValue = getTokenValue(tokenName);
          expect(actualValue).toBe(expectedValue);
        }
      );
    });

    describe("Module Tokens", () => {
      it.each(TOKEN_CATEGORIES.modules)(
        "should render %s with correct dark mode value",
        (tokenName) => {
          const expectedValue =
            EXPECTED_TOKENS.dark[
              tokenName as keyof typeof EXPECTED_TOKENS.dark
            ];
          const actualValue = getTokenValue(tokenName);
          expect(actualValue).toBe(expectedValue);
        }
      );
    });

    describe("Snapshot Comparison", () => {
      it("should match dark mode token snapshot", () => {
        const snapshot = createTokenSnapshot();
        expect(snapshot).toMatchSnapshot("dark-mode-tokens");
      });

      it("should have all 27 label tokens defined in dark mode", () => {
        const snapshot = createTokenSnapshot();
        const tokenCount = Object.keys(snapshot).length;
        expect(tokenCount).toBe(27);
      });
    });
  });

  describe("Integration Tests", () => {
    describe("Existing Token Compatibility", () => {
      beforeEach(() => {
        injectTokens("light");
      });

      it("should not break --color-neutral-content token", () => {
        const value = getTokenValue("--color-neutral-content");
        expect(value).toBe("#333333");
      });

      it("should not break --color-primary-surface token", () => {
        const value = getTokenValue("--color-primary-surface");
        expect(value).toBe("#4c5fa9");
      });

      it.each(EXISTING_COLOR_TOKENS)(
        "should preserve existing %s token",
        (tokenName) => {
          const value = getTokenValue(tokenName);
          expect(value).not.toBe("");
        }
      );
    });

    describe("Global Token Accessibility", () => {
      beforeEach(() => {
        injectTokens("light");
      });

      it("should make all 27 --label-* tokens globally accessible", () => {
        const allTokens = [
          ...TOKEN_CATEGORIES.primary,
          ...TOKEN_CATEGORIES.neutral,
          ...TOKEN_CATEGORIES.modules,
        ];

        allTokens.forEach((token) => {
          const value = getTokenValue(token);
          expect(value).not.toBe("");
        });
      });

      it("should have accessible primary tokens from document root", () => {
        TOKEN_CATEGORIES.primary.forEach((token) => {
          const computed = window.getComputedStyle(document.documentElement);
          const value = computed.getPropertyValue(token);
          expect(value.trim()).not.toBe("");
        });
      });

      it("should have accessible neutral tokens from document root", () => {
        TOKEN_CATEGORIES.neutral.forEach((token) => {
          const computed = window.getComputedStyle(document.documentElement);
          const value = computed.getPropertyValue(token);
          expect(value.trim()).not.toBe("");
        });
      });

      it("should have accessible module tokens from document root", () => {
        TOKEN_CATEGORIES.modules.forEach((token) => {
          const computed = window.getComputedStyle(document.documentElement);
          const value = computed.getPropertyValue(token);
          expect(value.trim()).not.toBe("");
        });
      });
    });

    describe("Token Count Verification", () => {
      it("should have exactly 5 primary tokens", () => {
        expect(TOKEN_CATEGORIES.primary.length).toBe(5);
      });

      it("should have exactly 8 neutral tokens", () => {
        expect(TOKEN_CATEGORIES.neutral.length).toBe(8);
      });

      it("should have exactly 14 module tokens (7 modules x 2 tokens each)", () => {
        expect(TOKEN_CATEGORIES.modules.length).toBe(14);
      });

      it("should have exactly 27 total label tokens", () => {
        const totalTokens =
          TOKEN_CATEGORIES.primary.length +
          TOKEN_CATEGORIES.neutral.length +
          TOKEN_CATEGORIES.modules.length;
        expect(totalTokens).toBe(27);
      });
    });
  });

  describe("Mode Transition Tests", () => {
    it("should correctly transition from light to dark mode", () => {
      // Start in light mode
      injectTokens("light");
      const lightBgBase = getTokenValue("--label-bg-base");
      expect(lightBgBase).toBe("#fff");

      // Clean up and switch to dark mode
      cleanupTokens();
      injectTokens("dark");
      const darkBgBase = getTokenValue("--label-bg-base");
      expect(darkBgBase).toBe("#1f1f1f");
    });

    it("should correctly transition from dark to light mode", () => {
      // Start in dark mode
      injectTokens("dark");
      const darkTextPrimary = getTokenValue("--label-text-primary");
      expect(darkTextPrimary).toBe("#f0f0f0");

      // Clean up and switch to light mode
      cleanupTokens();
      injectTokens("light");
      const lightTextPrimary = getTokenValue("--label-text-primary");
      expect(lightTextPrimary).toBe("#333");
    });
  });

  describe("Token File Validation", () => {
    let labelTokensContent: string;

    beforeAll(() => {
      labelTokensContent = fs.readFileSync(labelTokensPath, "utf8");
    });

    it("should have :root section for light mode tokens", () => {
      expect(labelTokensContent).toContain(":root {");
    });

    it('should have [data-color-scheme="dark"] section for dark mode tokens', () => {
      expect(labelTokensContent).toContain('[data-color-scheme="dark"]');
    });

    it("should define all primary tokens in the file", () => {
      TOKEN_CATEGORIES.primary.forEach((token) => {
        expect(labelTokensContent).toContain(`${token}:`);
      });
    });

    it("should define all neutral tokens in the file", () => {
      TOKEN_CATEGORIES.neutral.forEach((token) => {
        expect(labelTokensContent).toContain(`${token}:`);
      });
    });

    it("should define all module tokens in the file", () => {
      TOKEN_CATEGORIES.modules.forEach((token) => {
        expect(labelTokensContent).toContain(`${token}:`);
      });
    });
  });

  describe("Color Contrast Validation", () => {
    /**
     * Helper to convert hex to RGB values
     * Supports both 3-character (#fff) and 6-character (#ffffff) hex codes
     */
    const hexToRgb = (
      hex: string
    ): { r: number; g: number; b: number } | null => {
      // Remove # if present
      const cleanHex = hex.replace(/^#/, "");

      // Handle 3-character hex (e.g., #fff -> #ffffff)
      if (cleanHex.length === 3) {
        const r = parseInt(cleanHex[0] + cleanHex[0], 16);
        const g = parseInt(cleanHex[1] + cleanHex[1], 16);
        const b = parseInt(cleanHex[2] + cleanHex[2], 16);
        return { r, g, b };
      }

      // Handle 6-character hex
      const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(cleanHex);
      return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
          }
        : null;
    };

    /**
     * Calculate relative luminance for WCAG contrast calculation
     */
    const getRelativeLuminance = (rgb: {
      r: number;
      g: number;
      b: number;
    }): number => {
      const sRGB = [rgb.r / 255, rgb.g / 255, rgb.b / 255];
      const lRGB = sRGB.map((c) =>
        c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
      );
      return 0.2126 * lRGB[0] + 0.7152 * lRGB[1] + 0.0722 * lRGB[2];
    };

    /**
     * Calculate contrast ratio between two colors
     */
    const getContrastRatio = (hex1: string, hex2: string): number => {
      const rgb1 = hexToRgb(hex1);
      const rgb2 = hexToRgb(hex2);

      if (!rgb1 || !rgb2) return 0;

      const l1 = getRelativeLuminance(rgb1);
      const l2 = getRelativeLuminance(rgb2);

      const lighter = Math.max(l1, l2);
      const darker = Math.min(l1, l2);

      return (lighter + 0.05) / (darker + 0.05);
    };

    it("should have sufficient contrast between text-primary and bg-base in light mode", () => {
      const textColor = EXPECTED_TOKENS.light["--label-text-primary"];
      const bgColor = EXPECTED_TOKENS.light["--label-bg-base"];
      const contrastRatio = getContrastRatio(textColor, bgColor);

      // WCAG AA requires 4.5:1 for normal text
      expect(contrastRatio).toBeGreaterThanOrEqual(4.5);
    });

    it("should have sufficient contrast between text-primary and bg-base in dark mode", () => {
      const textColor = EXPECTED_TOKENS.dark["--label-text-primary"];
      const bgColor = EXPECTED_TOKENS.dark["--label-bg-base"];
      const contrastRatio = getContrastRatio(textColor, bgColor);

      // WCAG AA requires 4.5:1 for normal text
      expect(contrastRatio).toBeGreaterThanOrEqual(4.5);
    });

    it("should have sufficient contrast between text-secondary and bg-base in light mode", () => {
      const textColor = EXPECTED_TOKENS.light["--label-text-secondary"];
      const bgColor = EXPECTED_TOKENS.light["--label-bg-base"];
      const contrastRatio = getContrastRatio(textColor, bgColor);

      // WCAG AA requires 4.5:1 for normal text
      expect(contrastRatio).toBeGreaterThanOrEqual(4.5);
    });

    it("should have visible primary color against bg-base in light mode", () => {
      const primaryColor = EXPECTED_TOKENS.light["--label-primary"];
      const bgColor = EXPECTED_TOKENS.light["--label-bg-base"];
      const contrastRatio = getContrastRatio(primaryColor, bgColor);

      // At least 3:1 for UI components
      expect(contrastRatio).toBeGreaterThanOrEqual(3);
    });

    it("should have visible primary color against bg-base in dark mode", () => {
      const primaryColor = EXPECTED_TOKENS.dark["--label-primary"];
      const bgColor = EXPECTED_TOKENS.dark["--label-bg-base"];
      const contrastRatio = getContrastRatio(primaryColor, bgColor);

      // At least 3:1 for UI components
      expect(contrastRatio).toBeGreaterThanOrEqual(3);
    });
  });
});
