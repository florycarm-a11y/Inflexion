module.exports = {
    env: {
        node: true,
        es2021: true,
        jest: true
    },
    extends: ['eslint:recommended'],
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
    },
    rules: {
        // Error prevention
        'no-unused-vars': ['warn', { argsIgnorePattern: '^_|next' }],
        'no-console': 'off', // Allow console for server logging
        'no-undef': 'error',

        // Code style
        'indent': ['warn', 4, { SwitchCase: 1 }],
        'quotes': ['warn', 'single', { avoidEscape: true }],
        'semi': ['warn', 'always'],
        'comma-dangle': ['warn', 'never'],

        // Best practices
        'eqeqeq': ['error', 'always'],
        'no-var': 'error',
        'prefer-const': 'warn',

        // Async
        'no-async-promise-executor': 'error',
        'require-await': 'warn'
    },
    ignorePatterns: [
        'node_modules/',
        'coverage/',
        'dist/'
    ]
};
