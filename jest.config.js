module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.js?(x)', '**/?(*.)+(spec|test).js?(x)'],
  moduleFileExtensions: ['js', 'json', 'node'],
  moduleNameMapper: {
    '^pg$': '<rootDir>/__mocks__/pg.js',
    '^redis$': '<rootDir>/__mocks__/redis.js',
  },
};
