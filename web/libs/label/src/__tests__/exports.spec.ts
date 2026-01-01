/**
 * @heartex/label - Export Configuration Tests (Phase 4)
 *
 * TDD tests for validating the library barrel exports.
 * These tests use file-based validation to avoid ESM module compatibility
 * issues with dependencies like uuid in the test environment.
 */

import * as fs from 'fs';
import * as path from 'path';

describe('@heartex/label - Exports & Build', () => {
  describe('Phase 4: Export Configuration', () => {
    const indexPath = path.join(__dirname, '../index.ts');
    let indexContent: string;

    beforeAll(() => {
      indexContent = fs.readFileSync(indexPath, 'utf8');
    });

    it('should export DataAnalysis component', () => {
      // Verify DataAnalysis is exported from data-analysis feature
      expect(indexContent).toContain("export { DataAnalysis } from './features/data-analysis'");
    });

    it('should export module as default', () => {
      // Verify default export is DataAnalysis
      expect(indexContent).toContain("export { DataAnalysis as default }");
    });

    it('should have valid index.ts structure', () => {
      // Should export from data-analysis feature
      expect(indexContent).toContain("from './features/data-analysis'");

      // Should not have circular references
      expect(indexContent).not.toContain("from './index'");
    });

    it('should export EventList subcomponent', () => {
      expect(indexContent).toContain(
        "export { default as EventList } from './features/data-analysis/components/EventList'"
      );
    });

    it('should export FilterPanel subcomponent', () => {
      expect(indexContent).toContain(
        "export { default as FilterPanel } from './features/data-analysis/components/FilterPanel'"
      );
    });

    it('should export VisualizationDashboard subcomponent', () => {
      expect(indexContent).toContain(
        "export { default as VisualizationDashboard } from './features/data-analysis/components/VisualizationDashboard'"
      );
    });

    it('should NOT export internal test data (mockEvents)', () => {
      // mockEvents is internal test data, should not be exported
      expect(indexContent).not.toMatch(/export.*mockEvents/);
    });

    it('should have JSDoc documentation with usage examples', () => {
      // Should have documentation header
      expect(indexContent).toContain('@heartex/label');
      expect(indexContent).toContain('@example');
      // Should have usage examples
      expect(indexContent).toContain("import { DataAnalysis } from '@heartex/label'");
      expect(indexContent).toContain("import DataAnalysis from '@heartex/label'");
    });
  });

  describe('Phase 4: Build Validation', () => {
    it('should have buildable configuration in project.json', () => {
      const projectJson = require('../../project.json');

      expect(projectJson.targets.build).toBeDefined();
      expect(projectJson.targets.build.executor).toBe('@nx/webpack:webpack');
    });

    it('should have main entry point configured', () => {
      const projectJson = require('../../project.json');

      expect(projectJson.targets.build.options.main).toBe('libs/label/src/index.ts');
    });

    it('should have correct output path configured', () => {
      const projectJson = require('../../project.json');

      expect(projectJson.targets.build.options.outputPath).toBe('dist/libs/label');
    });
  });

  describe('Phase 4: Path Mapping', () => {
    it('should have @heartex/label path mapping in tsconfig.base.json', () => {
      const tsconfigBasePath = path.join(__dirname, '../../../../tsconfig.base.json');
      const tsconfigContent = fs.readFileSync(tsconfigBasePath, 'utf8');
      const tsconfig = JSON.parse(tsconfigContent);

      expect(tsconfig.compilerOptions.paths).toHaveProperty('@heartex/label');
      expect(tsconfig.compilerOptions.paths['@heartex/label']).toContain('libs/label/src/index.ts');
    });

    it('should have @heartex/label/* wildcard path mapping', () => {
      const tsconfigBasePath = path.join(__dirname, '../../../../tsconfig.base.json');
      const tsconfigContent = fs.readFileSync(tsconfigBasePath, 'utf8');
      const tsconfig = JSON.parse(tsconfigContent);

      expect(tsconfig.compilerOptions.paths).toHaveProperty('@heartex/label/*');
      expect(tsconfig.compilerOptions.paths['@heartex/label/*']).toContain('libs/label/src/*');
    });
  });

  describe('Phase 4: Feature Barrel Validation', () => {
    it('should have data-analysis feature barrel exporting DataAnalysis', () => {
      const featureBarrelPath = path.join(__dirname, '../features/data-analysis/index.js');
      const content = fs.readFileSync(featureBarrelPath, 'utf8');

      expect(content).toContain('DataAnalysis');
      expect(content).toMatch(/export.*DataAnalysis/);
    });

    it('should have subcomponents available for direct import', () => {
      // Verify component files exist
      const componentsDir = path.join(__dirname, '../features/data-analysis/components');

      expect(fs.existsSync(path.join(componentsDir, 'EventList.js'))).toBe(true);
      expect(fs.existsSync(path.join(componentsDir, 'FilterPanel.js'))).toBe(true);
      expect(fs.existsSync(path.join(componentsDir, 'VisualizationDashboard.js'))).toBe(true);
    });
  });
});
