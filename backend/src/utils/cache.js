const redis = require('redis');

// Create a Redis client.
// The client will automatically try to reconnect if the connection is lost.
const redisClient = redis.createClient({
  // Use the REDIS_URL environment variable if it's available.
  // This is common for cloud deployments (e.g., Heroku, Render).
  url: process.env.REDIS_URL,
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));
redisClient.on('connect', () => console.log('Connected to Redis'));
redisClient.on('reconnecting', () => console.log('Reconnecting to Redis...'));

// Connect to Redis.
// In redis v4, the client needs to be explicitly connected.
redisClient.connect();

// A wrapper for the cache to handle JSON serialization and parsing.
const cache = {
  async get(key) {
    if (!redisClient.isOpen) {
      console.error('Redis client is not open. Cannot get key:', key);
      return null;
    }
    try {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (err) {
      console.error(`Error getting key ${key} from cache:`, err);
      return null;
    }
  },

  async set(key, value, ttlSeconds = 3600) {
    if (!redisClient.isOpen) {
      console.error('Redis client is not open. Cannot set key:', key);
      return;
    }
    try {
      // Redis client requires the value to be a string.
      const stringValue = JSON.stringify(value);
      await redisClient.set(key, stringValue, {
        EX: ttlSeconds, // EX specifies the expiration in seconds
      });
    } catch (err) {
      console.error(`Error setting key ${key} in cache:`, err);
    }
  },

  async del(key) {
    if (!redisClient.isOpen) {
      console.error('Redis client is not open. Cannot delete key:', key);
      return;
    }
    try {
      await redisClient.del(key);
    } catch (err) {
      console.error(`Error deleting key ${key} from cache:`, err);
    }
  },

  // A "cache-aside" implementation.
  // It tries to get a value from the cache. If it's not there,
  // it calls the provided function `fn` to get the value,
  // stores it in the cache, and then returns it.
  async wrap(key, fn, ttlSeconds = 3600) {
    const cachedValue = await this.get(key);
    if (cachedValue) {
      return cachedValue;
    }

    const newValue = await fn();
    if (newValue !== null && newValue !== undefined) {
      await this.set(key, newValue, ttlSeconds);
    }
    return newValue;
  },
};

module.exports = cache;
