const OutreachLog = require('./OutreachLog');
const { pool } = require('../database/connection_pool');

// Mock our own utility module
jest.mock('../database/connection_pool');

describe('OutreachLog Model', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should log an outreach attempt', async () => {
      pool.query.mockResolvedValue();
      await OutreachLog.create(1, 'test@example.com');
      expect(pool.query).toHaveBeenCalledWith(expect.any(String), [1, 'test@example.com']);
    });
  });

  describe('hasBeenContactedRecently', () => {
    it('should return true if the recipient has been contacted recently', async () => {
      pool.query.mockResolvedValue({ rows: [{ exists: true }] });
      const result = await OutreachLog.hasBeenContactedRecently(1, 'test@example.com');
      expect(result).toBe(true);
    });

    it('should return false if the recipient has not been contacted recently', async () => {
      pool.query.mockResolvedValue({ rows: [] });
      const result = await OutreachLog.hasBeenContactedRecently(1, 'test@example.com');
      expect(result).toBe(false);
    });
  });
});
