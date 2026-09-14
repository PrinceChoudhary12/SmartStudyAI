import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: ['**/dist/**', '**/node_modules/**', 'apps/web/vite.config.ts'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        project: ['./tsconfig.base.json'],
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        project: ['./apps/web/tsconfig.json'],
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...reactRefresh.configs.vite.rules,
    },
  },
  {
    files: ['apps/api/**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
      parserOptions: {
        project: ['./apps/api/tsconfig.json'],
      },
    },
  },
  {
    files: ['packages/shared/**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: ['./packages/shared/tsconfig.json'],
      },
    },
  },
  {
    files: ['packages/config/**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: ['./packages/config/tsconfig.json'],
      },
    },
  },
  {
    files: ['packages/ui/**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        project: ['./packages/ui/tsconfig.json'],
      },
    },
  },
  prettier,
);
