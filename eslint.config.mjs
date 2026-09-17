import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';

export default tseslint.config(
  { ignores: ['.next/**', 'out/**', 'coverage/**', 'playwright-report/**', 'test-results/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    plugins: { 'react-hooks': reactHooks, 'jsx-a11y': jsxA11y },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,

      // Projektregel: höchstens 400 physische Zeilen je Code-Datei.
      // Das Skript check:file-length deckt zusätzlich Formate ab, die ESLint
      // nicht sieht (CSS, SQL, YAML, Dockerfile).
      'max-lines': ['error', { max: 400, skipBlankLines: false, skipComments: false }],

      // Fremde Daten kommen als unknown herein und werden validiert.
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['scripts/**/*.mjs', '*.config.mjs'],
    ...tseslint.configs.disableTypeChecked,
  },
);
