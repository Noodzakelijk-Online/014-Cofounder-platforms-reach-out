// This is a mock implementation of the connection pool for testing purposes.
// The actual implementation should connect to a real database.

const pool = {
  query: () => {
    throw new Error('This is a mock connection pool. You should not be calling this directly in tests.');
  },
};

module.exports = { pool };
