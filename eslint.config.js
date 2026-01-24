import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
    globalIgnores(['dist']),

    // JS / JSX settings (your existing block)
    {
        files: ['**/*.{js,jsx}'],
        extends: [
            js.configs.recommended,
            reactHooks.configs['recommended-latest'],
            reactRefresh.configs.vite,
        ],
        languageOptions: {
            ecmaVersion: 2020,
            globals: globals.browser,
            parserOptions: {
                ecmaVersion: 'latest',
                ecmaFeatures: { jsx: true },
                sourceType: 'module',
            },
        },
        rules: {
            'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
        },
    },

    // TypeScript / TSX settings (new)
    {
        files: ['**/*.{ts,tsx}'],
        // Use the @typescript-eslint plugin's recommended config
        // (flat config expects plugin objects; we imported tsPlugin above)
        extends: [tsPlugin.configs.recommended],
        languageOptions: {
            // parser must be the parser module (not string) for flat config
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
                ecmaFeatures: { jsx: true },
                // optional: provide your tsconfig for rules that need type information
                // make sure ./tsconfig.json exists at project root if you enable this
                project: './tsconfig.json',
            },
            globals: globals.browser,
        },
        plugins: {
            '@typescript-eslint': tsPlugin,
        },
        rules: {
            // turn off JS rule and enable TS-aware one
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],

            // your custom rules for TS files can go here
        },
    },
]);
