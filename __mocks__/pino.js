// __mocks__/pino.js

// This is a mock of the pino logger.
// It provides the same interface (info, warn, error, etc.)
// but uses jest.fn() so we can spy on it in tests if needed.
const pino = () => {
  const logger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    fatal: jest.fn(),
    child: jest.fn(() => logger), // child() should return a logger instance
  };
  return logger;
};

// Also mock the pino object itself in case it's used directly
pino.info = jest.fn();
pino.warn = jest.fn();
pino.error = jest.fn();
pino.debug = jest.fn();
pino.fatal = jest.fn();

module.exports = pino;
