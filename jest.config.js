module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/src/**/*.test.js?(x)',
    '**/tests/**/*.test.js?(x)',
  ],
  moduleFileExtensions: ['js', 'json', 'node'],
  moduleNameMapper: {
    '^pg$': '<rootDir>/__mocks__/pg.js',
    '^redis$': '<rootDir>/__mocks__/redis.js',
    '^pino$': '<rootDir>/__mocks__/pino.js',
  },
};
