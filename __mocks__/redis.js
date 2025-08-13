// __mocks__/redis.js

const mRedisClient = {
  on: jest.fn(),
  connect: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  isOpen: true, // Assume client is always open for tests
};

const redis = {
  createClient: jest.fn(() => mRedisClient),
};

module.exports = redis;
