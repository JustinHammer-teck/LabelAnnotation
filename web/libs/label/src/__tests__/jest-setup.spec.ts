describe('@heartex/label - Jest Infrastructure', () => {
  describe('Phase 3: Testing Infrastructure', () => {
    it('should have correct jest configuration', () => {
      const jestConfig = require('../../jest.config');

      expect(jestConfig.default.displayName).toBe('label');
      expect(jestConfig.default.preset).toContain('jest.preset.js');
      expect(jestConfig.default.coverageDirectory).toContain('coverage/libs/label');
    });

    it('should support both JS and TS file extensions', () => {
      const jestConfig = require('../../jest.config');

      expect(jestConfig.default.moduleFileExtensions).toContain('ts');
      expect(jestConfig.default.moduleFileExtensions).toContain('tsx');
      expect(jestConfig.default.moduleFileExtensions).toContain('js');
      expect(jestConfig.default.moduleFileExtensions).toContain('jsx');
    });

    it('should have setupFilesAfterEnv configured', () => {
      const jestConfig = require('../../jest.config');

      expect(jestConfig.default.setupFilesAfterEnv).toBeDefined();
      expect(jestConfig.default.setupFilesAfterEnv.length).toBeGreaterThan(0);
      // Verify it contains a jest.setup file reference
      const hasSetupFile = jestConfig.default.setupFilesAfterEnv.some(
        (file: string) => file.includes('jest.setup')
      );
      expect(hasSetupFile).toBe(true);
    });

    it('should have testEnvironment configured', () => {
      const jestConfig = require('../../jest.config');

      // Using node environment by default (jsdom has issues in this workspace)
      expect(jestConfig.default.testEnvironment).toBe('node');
    });

    it('should have moduleNameMapper for CSS and assets', () => {
      const jestConfig = require('../../jest.config');

      expect(jestConfig.default.moduleNameMapper).toBeDefined();
      // Check CSS mapping exists
      const cssPattern = Object.keys(jestConfig.default.moduleNameMapper).find(
        (key) => key.includes('css') || key.includes('scss')
      );
      expect(cssPattern).toBeDefined();
    });

    it('should have coverage thresholds configured', () => {
      const jestConfig = require('../../jest.config');

      expect(jestConfig.default.coverageThreshold).toBeDefined();
      expect(jestConfig.default.coverageThreshold.global).toBeDefined();
      expect(jestConfig.default.coverageThreshold.global.statements).toBeGreaterThanOrEqual(70);
      expect(jestConfig.default.coverageThreshold.global.branches).toBeGreaterThanOrEqual(60);
      expect(jestConfig.default.coverageThreshold.global.functions).toBeGreaterThanOrEqual(60);
      expect(jestConfig.default.coverageThreshold.global.lines).toBeGreaterThanOrEqual(70);
    });

    it('should have ResizeObserver mock available', () => {
      // ResizeObserver should be mocked globally for Ant Design components
      expect(global.ResizeObserver).toBeDefined();
      const observer = new global.ResizeObserver(() => {});
      expect(observer.observe).toBeDefined();
      expect(observer.unobserve).toBeDefined();
      expect(observer.disconnect).toBeDefined();
    });

    it('should have ECharts mock available', () => {
      // ECharts should be mocked for chart components
      const echarts = require('echarts-for-react');
      expect(echarts).toBeDefined();
    });
  });
});
