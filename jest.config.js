module.exports = {
  // The test environment that will be used for testing
  testEnvironment: 'node',

  // The root directory that Jest should scan for tests and modules
  rootDir: '.',

  // A list of paths to directories that Jest should use to search for files in
  roots: ['<rootDir>/tests'],

  // The glob patterns Jest uses to detect test files
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],

  // An array of regexp pattern strings that are matched against all test paths before executing the test
  testPathIgnorePatterns: ['/node_modules/'],

  // An array of regexp pattern strings that are matched against all file paths before being processed
  transformIgnorePatterns: ['/node_modules/'],

  // Indicates whether each individual test should be reported during the run
  verbose: true,
  
  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',

  // Indicates which provider should be used to instrument code for coverage
  coverageProvider: 'v8',

  // A list of reporter names that Jest uses when writing coverage reports
  coverageReporters: ['text', 'lcov'],

  // Coverage collection
  collectCoverage: false,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',  // Exclude main Electron file
    '!src/preload.js' // Exclude preload file
  ]
}; 