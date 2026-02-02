import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'node',

  // Clave: tratar TS como ESM
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],

  transform: {
    '^.+\\.ts$': ['ts-jest', { useESM: true, tsconfig: 'tsconfig.jest.json' }],
  },

  // Clave: si en tu código importas con extensión .js (ej: ../src/index.js),
  // Jest necesita mapearlo a TS sin la extensión al resolver módulos.
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },

  testMatch: ['**/test/**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts'],
};

export default config;
