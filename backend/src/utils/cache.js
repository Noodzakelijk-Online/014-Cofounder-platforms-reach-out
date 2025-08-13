// This is a mock implementation of the cache for testing purposes.
// The actual implementation should connect to a real cache like Redis.

const cache = {
  get: () => {
    throw new Error('This is a mock cache. You should not be calling this directly in tests.');
  },
  set: () => {
    throw new Error('This is a mock cache. You should not be calling this directly in tests.');
  },
  del: () => {
    throw new Error('This is a mock cache. You should not be calling this directly in tests.');
  },
  wrap: (key, fn) => fn(),
};

module.exports = cache;
