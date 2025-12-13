export default {
  displayName: 'aviation',
  preset: '../../jest.preset.js',
  transform: {
    '^.+\\.[tj]sx?$': ['babel-jest', { presets: ['@nx/react/babel'] }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../../coverage/libs/aviation',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
};
