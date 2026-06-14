const path = require('path');

/**
 * Resolve workspace packages to their built output via package.json (same as
 * api-core). `@ecommerce/schema` must be built (`npm run build -w @ecommerce/schema`)
 * so the new figma-extraction schema is present in dist.
 */
module.exports = {
  moduleNameMapper: {
    '^@ecommerce/(.*)$': '<rootDir>/../../packages/$1',
  },
  modulePaths: ['<rootDir>/../../packages'],
  transform: {
    '^.+\\.tsx?$': [
      require.resolve('ts-jest'),
      { tsconfig: path.resolve(__dirname, 'tsconfig.json') },
    ],
  },
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/?(*.)+(spec|test).ts'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  transformIgnorePatterns: ['node_modules/(?!(@ecommerce)/)'],
};
