// Jest setup file - environment-aware (works in both node and jsdom)

// Mock ResizeObserver for Ant Design components (needed in jsdom environment)
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Only set up DOM-related mocks if window is defined (jsdom environment)
if (typeof window !== 'undefined') {
  // Import jest-dom for extended matchers (only in jsdom)
  require('@testing-library/jest-dom');

  // Mock localStorage for tests
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: jest.fn(() => null),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    },
    writable: true,
  });

  // Mock matchMedia for Ant Design responsive components
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

// Suppress console warnings in tests (optional, helps reduce noise)
const originalConsoleError = console.error;
console.error = (...args: unknown[]) => {
  // Filter out known React warnings that are not relevant to tests
  const message = args[0];
  if (
    typeof message === 'string' &&
    (message.includes('Warning: ReactDOM.render is no longer supported') ||
      message.includes('Warning: An update to') ||
      message.includes('act(...)'))
  ) {
    return;
  }
  originalConsoleError.apply(console, args);
};
