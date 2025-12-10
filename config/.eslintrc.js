module.exports = {
  extends: ['eslint:recommended', 'plugin:prettier/recommended'],
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  parserOptions: {
    ecmaVersion: 2015,
    sourceType: 'module',
  },
  rules: {
    'no-unused-vars': ['error', { vars: 'all', args: 'after-used', ignoreRestSiblings: false }],
    eqeqeq: ['error', 'always'],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    curly: ['error', 'all'],
    quotes: ['error', 'single', { avoidEscape: true }],
    'prettier/prettier': ['error', { singleQuote: true, printWidth: 360 }],
    'arrow-body-style': ['error', 'as-needed'],
    'prefer-const': ['error', { destructuring: 'all', ignoreReadBeforeAssign: true }],
    'no-var': 'error',
    'object-shorthand': ['error', 'always'],
    'no-debugger': 'error',
  },
};
