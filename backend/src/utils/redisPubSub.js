// This is a mock implementation of the redisPubSub for testing purposes.

const redisPubSub = {
  publish: () => {
    throw new Error('This is a mock redisPubSub. You should not be calling this directly in tests.');
  },
};

module.exports = redisPubSub;
