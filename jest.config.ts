import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  moduleFileExtensions: ['ts', 'tsx', 'js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|sass|scss)$': 'identity-obj-proxy',
    '^(.*\\.txt)\\?raw$': '$1',
    '\\./globModules$': '<rootDir>/src/test-utils/emptyGlobModule.ts',
    '\\./assetModules$': '<rootDir>/src/test-utils/emptyGlobModule.ts'
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  transform: {
    '^.+\\.(t|j)sx?$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.test.json',
        useESM: true
      }
    ],
    '^.+\\.txt$': '<rootDir>/scripts/jestRawTextTransform.cjs'
  }
};

export default config;
