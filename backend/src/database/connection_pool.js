const { Pool } = require('pg');
const logger = require('../utils/logger');

// Check for the DATABASE_URL environment variable.
if (!process.env.DATABASE_URL) {
  logger.warn(
    'DATABASE_URL environment variable is not set. Using default local configuration.'
  );
}

const pool = new Pool({
  // Use the DATABASE_URL environment variable if it's available.
  // Otherwise, fallback to a default local development configuration.
  connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/database',
  // Recommended settings for a robust connection pool:
  max: 20, // max number of clients in the pool
  idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 2000, // how long to wait for a client to connect
});

// The pool will emit an error on behalf of any idle clients
// it contains if a backend error or network partition happens
pool.on('error', (err, client) => {
  logger.error({ err, clientId: client.processID }, 'Unexpected error on idle client');
  process.exit(-1);
});

module.exports = { pool };
