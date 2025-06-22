import js from '@eslint/js';
import tseslintPlugin from '@typescript-eslint/eslint-plugin';
import tseslintParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';

export default [
  js.configs.recommended,
  {
    plugins: {
      '@typescript-eslint': tseslintPlugin,
      import: importPlugin,
    },
    languageOptions: {
      parser: tseslintParser,
      parserOptions: {
        project: ['./tsconfig.json', './tsconfig.dev.json'],
        sourceType: 'module',
      },
      ecmaVersion: 2020,
      globals: {
        NodeJS: 'readonly',
      },
    },
    ignores: [
      'lib/**/*',
      'generated/**/*',
    ],
    rules: {
      'quotes': ['error', 'double'],
      'import/no-unresolved': 0,
      'indent': ['error', 2],
    },
  },
]; 