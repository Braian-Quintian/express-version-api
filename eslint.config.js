import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';

/** @type {import('eslint').Linter.Config[]} */
export default tseslint.config(
  // ─────────────────────────────────────────────────────────────────
  // Ignorar archivos y directorios
  // ─────────────────────────────────────────────────────────────────
  {
    ignores: [
      'dist/**',
      'coverage/**',
      'node_modules/**',
      'test/**', 
      '*.config.js',
      '*.config.ts',
      '**/*.d.ts',
      'test-types/**',
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // Configuración base de JavaScript
  // ─────────────────────────────────────────────────────────────────
  js.configs.recommended,

  // ─────────────────────────────────────────────────────────────────
  // Configuración de TypeScript
  // ─────────────────────────────────────────────────────────────────
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  // ─────────────────────────────────────────────────────────────────
  // Configuración específica para archivos TypeScript
  // ─────────────────────────────────────────────────────────────────
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // ─────────────────────────────────────────────────────────────
      // Reglas de TypeScript
      // ─────────────────────────────────────────────────────────────
      // Forzar import type para imports de solo tipos
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'inline-type-imports',
          disallowTypeAnnotations: true,
        },
      ],
      // Forzar export type para exports de solo tipos
      '@typescript-eslint/consistent-type-exports': [
        'error',
        { fixMixedExportsWithInlineTypeSpecifier: true },
      ],
      // Permitir expresiones de tipo explícitas donde mejoran la legibilidad
      '@typescript-eslint/no-inferrable-types': 'off',
      // Requerir tipos de retorno explícitos en funciones exportadas
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      // No permitir any explícito
      '@typescript-eslint/no-explicit-any': 'error',
      // No permitir non-null assertions (!)
      '@typescript-eslint/no-non-null-assertion': 'error',
      // Manejar promesas correctamente
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': [
        'error',
        {
          checksVoidReturn: {
            arguments: false,
            attributes: false,
          },
        },
      ],
      // Preferir nullish coalescing (??) sobre OR (||)
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      // Preferir optional chaining (?.) sobre AND (&&)
      '@typescript-eslint/prefer-optional-chain': 'error',
      // Asegurar que las comparaciones de strings sean type-safe
      '@typescript-eslint/no-unnecessary-condition': 'error',
      // Forzar uso de métodos de array modernos
      '@typescript-eslint/prefer-for-of': 'error',
      '@typescript-eslint/prefer-includes': 'error',
      '@typescript-eslint/prefer-string-starts-ends-with': 'error',
      // No usar variables antes de definirlas
      '@typescript-eslint/no-use-before-define': [
        'error',
        {
          functions: false,
          classes: true,
          variables: true,
        },
      ],
      // Naming conventions
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'interface',
          format: ['PascalCase'],
        },
        {
          selector: 'typeAlias',
          format: ['PascalCase'],
        },
        {
          selector: 'enum',
          format: ['PascalCase'],
        },
        {
          selector: 'enumMember',
          format: ['UPPER_CASE', 'PascalCase'],
        },
      ],

      // ─────────────────────────────────────────────────────────────
      // Reglas generales de JavaScript
      // ─────────────────────────────────────────────────────────────
      // Advertir sobre console.log (pero permitir console.error, console.warn)
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      // No permitir debugger
      'no-debugger': 'error',
      // Forzar === y !==
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      // No permitir eval
      'no-eval': 'error',
      // No permitir variables no usadas (excepto las que empiezan con _)
      'no-unused-vars': 'off', // Desactivar la regla base de JS
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      // Preferir const sobre let cuando no se reasigna
      'prefer-const': 'error',
      // No permitir var
      'no-var': 'error',
      // Preferir template literals sobre concatenación
      'prefer-template': 'error',
      // Preferir arrow functions para callbacks
      'prefer-arrow-callback': 'error',
      // Forzar llaves en bloques de control de flujo
      curly: ['error', 'all'],
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // Configuración para archivos de test
  // ─────────────────────────────────────────────────────────────────
  {
    files: ['test/**/*.ts', '**/*.test.ts', '**/*.spec.ts'],
    rules: {
      // Relajar algunas reglas en tests
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/unbound-method': 'off',
      'no-console': 'off',
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // Prettier - DEBE ir al final para sobrescribir reglas de formato
  // ─────────────────────────────────────────────────────────────────
  prettierConfig
);
