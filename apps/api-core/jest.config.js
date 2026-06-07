const path = require('path');

module.exports = {
  moduleNameMapper: {
    '^@ecommerce/(.*)$': '<rootDir>/../../packages/$1',
    '^@thallesp/nestjs-better-auth$': '<rootDir>/src/__mocks__/@thallesp/nestjs-better-auth.js',
  },
  modulePaths: ['<rootDir>/../../packages'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
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
