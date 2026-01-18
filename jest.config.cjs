module.exports = {
  testEnvironment: 'jsdom',
  testMatch: [
    '<rootDir>/__tests__/**/*.test.js',
  ],
  testPathIgnorePatterns: [
    'Cesium-.*',
    'node_modules',
  ],
  collectCoverageFrom: [
    '**/*.{js}',
    '!**/node_modules/**',
    '!**/Cesium-*/**',
    '!**/coverage/**',
    '!jest.config.js',
    '!jest.setup.js',
    '!babel.config.js',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
};