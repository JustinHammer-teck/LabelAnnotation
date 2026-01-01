describe('@heartex/label - Nx Integration', () => {
  describe('Phase 1: Nx Infrastructure', () => {
    it('should have valid project.json configuration', () => {
      const projectJson = require('../../project.json');

      expect(projectJson.name).toBe('label');
      expect(projectJson.sourceRoot).toBe('libs/label/src');
      expect(projectJson.projectType).toBe('library');
      expect(projectJson.targets).toHaveProperty('build');
      expect(projectJson.targets).toHaveProperty('test');
    });

    it('should have TypeScript configuration files', () => {
      const fs = require('fs');
      const path = require('path');

      const tsconfigPath = path.join(__dirname, '../../tsconfig.json');
      const tsconfigLibPath = path.join(__dirname, '../../tsconfig.lib.json');

      expect(fs.existsSync(tsconfigPath)).toBe(true);
      expect(fs.existsSync(tsconfigLibPath)).toBe(true);
    });

    it('should be registered in workspace tsconfig.base.json', () => {
      const path = require('path');
      const baseConfigPath = path.resolve(__dirname, '../../../../tsconfig.base.json');
      const baseConfig = require(baseConfigPath);

      expect(baseConfig.compilerOptions.paths).toHaveProperty('@heartex/label');
      expect(baseConfig.compilerOptions.paths['@heartex/label'][0]).toBe('libs/label/src/index.ts');
    });

    it('should have correct package.json name', () => {
      const packageJson = require('../../package.json');

      expect(packageJson.name).toBe('@heartex/label');
      expect(packageJson.peerDependencies).toHaveProperty('react');
      expect(packageJson.peerDependencies).toHaveProperty('antd');
    });
  });
});
