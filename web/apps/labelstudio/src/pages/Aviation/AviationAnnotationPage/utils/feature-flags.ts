export const FF_AVIATION_MOCK_DATA = 'ff_aviation_mock_data';

export const isAviationMockEnabled = (): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(FF_AVIATION_MOCK_DATA) === 'true';
};

export const enableAviationMock = () => {
  localStorage.setItem(FF_AVIATION_MOCK_DATA, 'true');
  console.log('Aviation mock data enabled. Reload the page to see changes.');
};

export const disableAviationMock = () => {
  localStorage.setItem(FF_AVIATION_MOCK_DATA, 'false');
  console.log('Aviation mock data disabled. Reload the page to see changes.');
};

if (typeof window !== 'undefined') {
  (window as any).aviationMock = {
    enable: enableAviationMock,
    disable: disableAviationMock,
    status: () => console.log(`Aviation mock data is ${isAviationMockEnabled() ? 'enabled' : 'disabled'}`),
  };
}
