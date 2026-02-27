import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.test.ts'],

  // ✅ Configuración de transformación
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.test.json',
        useESM: false,
      },
    ],
  },

  // ✅ Resolución de módulos (clave para resolver .js → .ts)
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },

  // ✅ Extensiones a resolver
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // ✅ Coverage
  collectCoverage: false,
  coverageDirectory: 'coverage',
  coverageReporters: ['json', 'lcov', 'text', 'html'],
  coveragePathIgnorePatterns: ['/node_modules/', '/dist/', '/test/', '/coverage/'],

  // ✅ Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },

  // ✅ Configuraciones adicionales
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  clearMocks: true,
  restoreMocks: true,
};

export default config;
