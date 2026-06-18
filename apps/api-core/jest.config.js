const path = require('path');

module.exports = {
  moduleNameMapper: {
    '^@ecommerce/(.*)$': '<rootDir>/../../packages/$1',
    '^@thallesp/nestjs-better-auth$': '<rootDir>/src/__mocks__/@thallesp/nestjs-better-auth.js',
    // Replace better-auth's ESM (.mjs) entrypoints with CommonJS stubs so
    // ts-jest can load any module that transitively imports them. The auth
    // session machinery is mocked at the AuthService boundary in tests.
    '^better-auth/node$': '<rootDir>/test/stubs/better-auth-node.js',
    '^better-auth/adapters/prisma$':
      '<rootDir>/test/stubs/better-auth-prisma-adapter.js',
    '^better-auth$': '<rootDir>/test/stubs/better-auth.js',
    // uuid v14 is ESM-only; bull `require`s it and ts-jest only transforms .ts(x).
    // Map to a tiny CJS shim so bull-importing suites (order/payment/email) load.
    '^uuid$': '<rootDir>/test/stubs/uuid.js',
  },
  modulePaths: ['<rootDir>/../../packages'],
  transform: {
    '^.+\\.tsx?$': [
      // Absolute path: ts-jest is hoisted to the workspace root, which the
      // jest resolver doesn't find from this package's rootDir
      require.resolve('ts-jest'),
      {
        tsconfig: path.resolve(__dirname, 'tsconfig.jest.json'),
      },
    ],
  },
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts?(x)', '**/?(*.)+(spec|test).ts?(x)'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transformIgnorePatterns: [
    'node_modules/(?!(better-auth|better-call|@ecommerce|ioredis|uuid)/)',
  ],
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  setupFiles: ['<rootDir>/test/setup-reflect.ts'],
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
};
