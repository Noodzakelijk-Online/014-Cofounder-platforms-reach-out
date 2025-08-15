const HealthCheck = require('./HealthCheck');
const { pool } = require('../database/connection_pool');
const { redisClient } = require('../utils/cache');

// Mock the dependencies
jest.mock('../database/connection_pool');
jest.mock('../utils/cache');

describe('HealthCheck Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return UP when all dependencies are healthy', async () => {
    pool.query.mockResolvedValue();
    redisClient.ping.mockResolvedValue('PONG');
    redisClient.isOpen = true; // Ensure the mock client is "open"

    const result = await HealthCheck.check();

    expect(result.overallStatus).toBe('UP');
    expect(result.dependencies[0].status).toBe('UP'); // DB
    expect(result.dependencies[1].status).toBe('UP'); // Redis
  });

  it('should return DOWN when the database is down', async () => {
    pool.query.mockRejectedValue(new Error('DB connection error'));
    redisClient.ping.mockResolvedValue('PONG');
    redisClient.isOpen = true;

    const result = await HealthCheck.check();

    expect(result.overallStatus).toBe('DOWN');
    expect(result.dependencies[0].status).toBe('DOWN');
    expect(result.dependencies[0].error).toBe('DB connection error');
    expect(result.dependencies[1].status).toBe('UP');
  });

  it('should return DOWN when Redis is down', async () => {
    pool.query.mockResolvedValue();
    redisClient.ping.mockRejectedValue(new Error('Redis connection error'));
    redisClient.isOpen = true;

    const result = await HealthCheck.check();

    expect(result.overallStatus).toBe('DOWN');
    expect(result.dependencies[0].status).toBe('UP');
    expect(result.dependencies[1].status).toBe('DOWN');
    expect(result.dependencies[1].error).toBe('Redis connection error');
  });

  it('should return DOWN when the redis client is not open', async () => {
    pool.query.mockResolvedValue();
    redisClient.isOpen = false; // Simulate a closed client

    const result = await HealthCheck.check();

    expect(result.overallStatus).toBe('DOWN');
    expect(result.dependencies[1].status).toBe('DOWN');
    expect(result.dependencies[1].error).toBe('Redis client not connected');
  });
});
