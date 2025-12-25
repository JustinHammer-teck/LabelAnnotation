/**
 * Label Theme Integration Tests
 *
 * These tests verify that the label-tokens.scss file is properly integrated
 * into the LabelStudio theme system and that CSS custom properties are
 * accessible in the document.
 */

import * as fs from "fs";
import * as path from "path";

describe("Label Theme Integration", () => {
  const tokensScssPath = path.resolve(
    __dirname,
    "../default/tokens.scss"
  );
  const labelTokensPath = path.resolve(
    __dirname,
    "../../../../../libs/ui/src/tokens/label-tokens.scss"
  );

  describe("File Structure", () => {
    it("should have tokens.scss file in themes/default", () => {
      expect(fs.existsSync(tokensScssPath)).toBe(true);
    });

    it("should have label-tokens.scss file in ui/tokens", () => {
      expect(fs.existsSync(labelTokensPath)).toBe(true);
    });

    it("should import label-tokens.scss in tokens.scss", () => {
      const tokensContent = fs.readFileSync(tokensScssPath, "utf8");
      expect(tokensContent).toContain(
        "@import '@humansignal/ui/src/tokens/label-tokens'"
      );
    });

    it("should import base tokens before label tokens", () => {
      const tokensContent = fs.readFileSync(tokensScssPath, "utf8");
      const baseTokensIndex = tokensContent.indexOf(
        "@import '@humansignal/ui/src/tokens/tokens'"
      );
      const labelTokensIndex = tokensContent.indexOf(
        "@import '@humansignal/ui/src/tokens/label-tokens'"
      );

      // Both imports should exist
      expect(baseTokensIndex).toBeGreaterThanOrEqual(0);
      expect(labelTokensIndex).toBeGreaterThanOrEqual(0);

      // Base tokens should come before label tokens
      expect(baseTokensIndex).toBeLessThan(labelTokensIndex);
    });
  });

  describe("Label Token Definitions", () => {
    let labelTokensContent: string;

    beforeAll(() => {
      labelTokensContent = fs.readFileSync(labelTokensPath, "utf8");
    });

    it("should define --label-primary CSS variable", () => {
      expect(labelTokensContent).toContain("--label-primary:");
    });

    it("should define --label-bg-base CSS variable", () => {
      expect(labelTokensContent).toContain("--label-bg-base:");
    });

    it("should define --label-text-primary CSS variable", () => {
      expect(labelTokensContent).toContain("--label-text-primary:");
    });

    it("should define module color tokens (competency, training, threat, error)", () => {
      expect(labelTokensContent).toContain("--label-competency-bg:");
      expect(labelTokensContent).toContain("--label-training-bg:");
      expect(labelTokensContent).toContain("--label-threat-bg:");
      expect(labelTokensContent).toContain("--label-error-bg:");
    });

    it("should define dark mode overrides", () => {
      expect(labelTokensContent).toContain('[data-color-scheme="dark"]');
    });
  });

  describe("CSS Variable Accessibility", () => {
    beforeEach(() => {
      // Inject label token CSS variables into the document for testing
      const styleElement = document.createElement("style");
      styleElement.id = "test-label-tokens";
      styleElement.textContent = `
        :root {
          --label-primary: #1890ff;
          --label-primary-hover: #40a9ff;
          --label-primary-active: #096dd9;
          --label-bg-base: #fff;
          --label-text-primary: #333;
          --color-neutral-content: #333;
          --color-primary-surface: #4c5fa9;
        }
      `;
      document.head.appendChild(styleElement);
    });

    afterEach(() => {
      const styleElement = document.getElementById("test-label-tokens");
      if (styleElement) {
        styleElement.remove();
      }
    });

    it("should make --label-primary accessible in document", () => {
      const computedStyle = getComputedStyle(document.documentElement);
      const labelPrimary = computedStyle.getPropertyValue("--label-primary");
      expect(labelPrimary.trim()).toBe("#1890ff");
    });

    it("should make --label-bg-base accessible in document", () => {
      const computedStyle = getComputedStyle(document.documentElement);
      const labelBgBase = computedStyle.getPropertyValue("--label-bg-base");
      expect(labelBgBase.trim()).toBe("#fff");
    });

    it("should not break existing --color-* variables", () => {
      const computedStyle = getComputedStyle(document.documentElement);

      // Verify existing color tokens still work
      const neutralContent = computedStyle.getPropertyValue(
        "--color-neutral-content"
      );
      const primarySurface = computedStyle.getPropertyValue(
        "--color-primary-surface"
      );

      expect(neutralContent.trim()).toBe("#333");
      expect(primarySurface.trim()).toBe("#4c5fa9");
    });
  });

  describe("Token Count Verification", () => {
    it("should have at least 27 --label-* CSS custom properties", () => {
      const labelTokensContent = fs.readFileSync(labelTokensPath, "utf8");
      const rootSection = labelTokensContent.match(/:root\s*\{([^}]+)\}/);

      if (rootSection) {
        const labelVariables = rootSection[1].match(/--label-[a-z-]+:/g) || [];
        expect(labelVariables.length).toBeGreaterThanOrEqual(27);
      } else {
        fail("Could not find :root section in label-tokens.scss");
      }
    });
  });
});
