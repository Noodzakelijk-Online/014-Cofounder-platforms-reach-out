const Message = require('./Message');
const { pool } = require('../database/connection_pool');
const cache = require('../utils/cache');
const scheduler = require('../utils/scheduler');
const OutreachLog = require('./OutreachLog');

// Mock dependencies
jest.mock('../database/connection_pool');
jest.mock('../utils/cache');
jest.mock('../utils/scheduler');
jest.mock('./OutreachLog');

describe('Message Model', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new message', async () => {
      const messageData = { userId: 1, projectId: 1, subject: 'Test' };
      const dbResult = {
        rows: [{
          id: 1,
          user_id: 1, // Corrected key
          project_id: 1, // Corrected key
          subject: 'Test',
        }],
      };
      pool.query.mockResolvedValue(dbResult);

      const message = await Message.create(messageData);

      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(cache.del).toHaveBeenCalledWith(`messages:1`);
      expect(cache.del).toHaveBeenCalledWith(`messages:user:1`); // Added expectation
      expect(message).toBeInstanceOf(Message);
    });
  });

  describe('findById', () => {
    it('should return a message from cache if it exists', async () => {
      const cachedMessage = { id: 1, subject: 'Cached Message' };
      cache.get.mockResolvedValue(JSON.stringify(cachedMessage));

      const message = await Message.findById(1);

      expect(cache.get).toHaveBeenCalledWith('messages:1');
      expect(pool.query).not.toHaveBeenCalled();
      expect(message.subject).toBe('Cached Message');
    });
  });

  describe('send', () => {
    it('should send a draft message', async () => {
      const message = new Message({ id: 1, userId: 1, status: 'draft' });
      message.update = jest.fn().mockResolvedValue({ status: 'sent' });
      OutreachLog.hasBeenContactedRecently.mockResolvedValue(false);

      await message.send();

      expect(OutreachLog.hasBeenContactedRecently).toHaveBeenCalled();
      expect(message.update).toHaveBeenCalledWith({ status: 'sent' });
      expect(OutreachLog.create).toHaveBeenCalled();
    });
  });
});
