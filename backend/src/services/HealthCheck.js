const { pool } = require('../database/connection_pool');
// Import the redisClient from our shared cache utility
const { redisClient } = require('../utils/cache');

class HealthCheck {
  /**
   * Performs a health check on the application's dependencies.
   * @returns {Promise<Object>} A status object.
   */
  static async check() {
    const dbStatus = await this.checkDatabase();
    const redisStatus = await this.checkRedis();

    const overallStatus = dbStatus.status === 'UP' && redisStatus.status === 'UP' ? 'UP' : 'DOWN';

    return {
      overallStatus: overallStatus,
      dependencies: [
        dbStatus,
        redisStatus,
      ],
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Checks the status of the PostgreSQL database.
   */
  static async checkDatabase() {
    try {
      await pool.query('SELECT 1');
      return {
        name: 'Database',
        status: 'UP',
      };
    } catch (err) {
      return {
        name: 'Database',
        status: 'DOWN',
        error: err.message,
      };
    }
  }

  /**
   * Checks the status of the Redis cache.
   */
  static async checkRedis() {
    if (!redisClient || !redisClient.isOpen) {
      return {
        name: 'Redis',
        status: 'DOWN',
        error: 'Redis client not connected',
      };
    }
    try {
      const reply = await redisClient.ping();
      if (reply === 'PONG') {
        return {
          name: 'Redis',
          status: 'UP',
        };
      }
      return {
        name: 'Redis',
        status: 'DOWN',
        error: 'Did not receive PONG from Redis',
      };
    } catch (err) {
      return {
        name: 'Redis',
        status: 'DOWN',
        error: err.message,
      };
    }
  }
}

module.exports = HealthCheck;
