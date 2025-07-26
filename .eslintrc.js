module.exports = {
    root: true,
    env: {
        browser: true,
        node: true,
        es2021: true,
    },
    extends: ['eslint:recommended', 'plugin:vue/vue3-recommended', 'plugin:prettier/recommended'],
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
    },
    rules: {
        indent: ['error', 4],
        'vue/html-indent': ['error', 4],
        'prettier/prettier': [
            'error',
            {
                tabWidth: 4,
                useTabs: false,
                singleQuote: true,
                semi: true,
                trailingComma: 'es5',
                bracketSpacing: true,
                vueIndentScriptAndStyle: true,
                printWidth: 100,
                arrowParens: 'avoid',
            },
        ],
    },
};
