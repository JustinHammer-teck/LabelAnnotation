// Phase 2 Tests: Ant Design v4 API Migration
// Note: Component rendering tests require jsdom which has compatibility issues in this workspace.
// This test file verifies the source code changes directly.

describe('EventList - Ant Design v4 Compatibility', () => {
  it('should not have any "open" prop references in component source', () => {
    const fs = require('fs');
    const path = require('path');

    const componentPath = path.join(__dirname, '../EventList.js');
    const source = fs.readFileSync(componentPath, 'utf8');

    // Check for Modal with open prop (v5 API)
    const hasOpenProp = /<Modal[^>]*\bopen=/i.test(source);
    expect(hasOpenProp).toBe(false);

    // Check for visible prop (v4 API)
    const hasVisibleProp = /<Modal[^>]*\bvisible=/i.test(source);
    expect(hasVisibleProp).toBe(true);
  });

  it('should have correct Modal import from antd', () => {
    const fs = require('fs');
    const path = require('path');

    const componentPath = path.join(__dirname, '../EventList.js');
    const source = fs.readFileSync(componentPath, 'utf8');

    // Should import Modal from antd
    const hasModalImport = /import\s+{[^}]*Modal[^}]*}\s+from\s+['"]antd['"]/.test(source);
    expect(hasModalImport).toBe(true);
  });

  it('should use v4-compatible Modal state pattern', () => {
    const fs = require('fs');
    const path = require('path');

    const componentPath = path.join(__dirname, '../EventList.js');
    const source = fs.readFileSync(componentPath, 'utf8');

    // Should have isModalVisible state variable (v4-friendly naming)
    const hasVisibleState = /isModalVisible/.test(source);
    expect(hasVisibleState).toBe(true);

    // Should have setIsModalVisible setter
    const hasVisibleSetter = /setIsModalVisible/.test(source);
    expect(hasVisibleSetter).toBe(true);
  });

  it('should not use any Ant Design v5-specific APIs', () => {
    const fs = require('fs');
    const path = require('path');

    const componentPath = path.join(__dirname, '../EventList.js');
    const source = fs.readFileSync(componentPath, 'utf8');

    // These patterns indicate v5 API usage that needs migration
    // Modal open prop
    expect(/<Modal[^>]*\bopen=/.test(source)).toBe(false);
    // Drawer open prop (if used)
    expect(/<Drawer[^>]*\bopen=/.test(source)).toBe(false);
    // DatePicker open prop (if used in controlled mode)
    expect(/<DatePicker[^>]*\bopen=/.test(source)).toBe(false);
  });
});
