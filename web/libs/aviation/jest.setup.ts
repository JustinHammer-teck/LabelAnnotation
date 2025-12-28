import '@testing-library/jest-dom';
import { initAviationI18n, i18n } from './src/i18n';

// Mock ResizeObserver for Radix UI components (not available in JSDOM)
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock localStorage to ensure English language for tests
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(() => 'en'),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
});

// Initialize i18n for all tests so translation hooks work correctly
initAviationI18n();

// Ensure English language is set for tests
if (i18n.isInitialized) {
  i18n.changeLanguage('en');
}
