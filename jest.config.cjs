module.exports = {
    testEnvironment: 'node',
    reporters: [
        'default',
        [
            'jest-html-reporter',
            {
                outputPath: 'jest-report.html',
            },
        ],
    ],
};
