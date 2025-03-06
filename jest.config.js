module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.test.js'],
  verbose: true,
  // Ensure we rebuild the native module before running tests
  globalSetup: '<rootDir>/test/setup.js'
}; 