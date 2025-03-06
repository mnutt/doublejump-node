module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.test.js'],
  verbose: true,
  // Ensure we rebuild the native module before running tests
  setupFiles: ['<rootDir>/test/setup.js']
}; 