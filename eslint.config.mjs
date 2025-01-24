import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';
import stylisticTs from '@stylistic/eslint-plugin-ts';
import parserTs from '@typescript-eslint/parser';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname
});

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: parserTs
    },
    plugins: { '@stylistic/ts': stylisticTs },
    rules: {
      semi: ['error', 'always'],
      '@stylistic/ts/block-spacing': ['error', 'always'],
      '@stylistic/ts/brace-style': ['error', '1tbs', { allowSingleLine: true }],
      '@stylistic/ts/comma-dangle': ['error', 'never'],
      '@stylistic/ts/comma-spacing': ['error'],
      '@stylistic/ts/function-call-spacing': ['error', 'never'],
      '@stylistic/ts/key-spacing': ['error'],
      '@stylistic/ts/keyword-spacing': ['error'],
      '@stylistic/ts/lines-around-comment': ['error'],
      '@stylistic/ts/no-extra-parens': ['error'],
      '@stylistic/ts/no-extra-semi': ['error'],
      '@stylistic/ts/object-curly-newline': ['error', { consistent: true }],
      '@stylistic/ts/object-curly-spacing': ['error', 'always'],
      '@stylistic/ts/object-property-newline': ['error', { allowAllPropertiesOnSameLine: true }],
      '@stylistic/ts/padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: '*', next: 'return' },
        { blankLine: 'always', prev: '*', next: 'throw' },
        { blankLine: 'always', prev: 'block-like', next: '*' },
        { blankLine: 'always', prev: '*', next: 'block-like' },
        { blankLine: 'always', prev: 'import', next: '*' },
        { blankLine: 'any', prev: 'import', next: 'import' }
      ],
      '@stylistic/ts/quote-props': ['error', 'as-needed'],
      '@stylistic/ts/quotes': ['error', 'single'],
      '@stylistic/ts/space-before-function-paren': ['error', {
        anonymous: 'never',
        named: 'never',
        asyncArrow: 'always'
      }],
      '@stylistic/ts/type-annotation-spacing': ['error']
    }

  }
];

export default eslintConfig;
