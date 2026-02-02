import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'node',

  // Trata .ts como ESM (clave para que no pete con "import ...")
  extensionsToTreatAsEsm: ['.ts'],

  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: 'tsconfig.test.json',
      },
    ],
  },

  // Para imports NodeNext que usan .js en TS (ej: ../src/index.js)
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },

  testMatch: ['<rootDir>/test/**/*.test.ts'],
};

export default config;
