const Message = require('./Message');
const { pool } = require('../database/connection_pool');
const cache = require('../utils/cache');
const scheduler = require('../utils/scheduler');
const OutreachLog = require('./OutreachLog');

jest.mock('../database/connection_pool', () => ({
  pool: {
    query: jest.fn(),
  },
}));

jest.mock('../utils/cache', () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
}));

jest.mock('../utils/scheduler', () => ({
  scheduleFollowUp: jest.fn(),
  cancelFollowUp: jest.fn(),
}));

jest.mock('./OutreachLog', () => ({
  hasBeenContactedRecently: jest.fn(),
  create: jest.fn(),
}));

describe('Message Model', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new message and return it', async () => {
      const messageData = {
        userId: 1,
        projectId: 1,
        platformId: 1,
        recipient: 'test@example.com',
        subject: 'Test Message',
        content: 'Hello, world!',
      };
      const dbResult = {
        rows: [{
          id: 1,
          user_id: 1,
          project_id: 1,
          platform_id: 1,
          recipient: 'test@example.com',
          subject: 'Test Message',
          content: 'Hello, world!',
          status: 'draft',
          created_at: new Date(),
          updated_at: new Date(),
        }],
      };
      pool.query.mockResolvedValue(dbResult);

      const message = await Message.create(messageData);

      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(cache.del).toHaveBeenCalledWith('messages:1');
      expect(cache.del).toHaveBeenCalledWith('messages:user:1');
      expect(message).toBeInstanceOf(Message);
      expect(message.subject).toBe('Test Message');
    });
  });

  describe('send', () => {
    it('should send a draft message, update status, and log outreach', async () => {
      const message = new Message({
        id: 1,
        userId: 1,
        recipient: 'test@example.com',
        status: 'draft',
      });
      // Mock the update method within the send method
      message.update = jest.fn().mockResolvedValue({ ...message, status: 'sent' });
      OutreachLog.hasBeenContactedRecently.mockResolvedValue(false);

      const sentMessage = await message.send();

      expect(OutreachLog.hasBeenContactedRecently).toHaveBeenCalledWith(1, 'test@example.com');
      expect(message.update).toHaveBeenCalledWith({ status: 'sent' });
      expect(OutreachLog.create).toHaveBeenCalledWith(1, 'test@example.com');
      expect(sentMessage.status).toBe('sent');
    });

    it('should throw an error if the message is not a draft', async () => {
      const message = new Message({ status: 'sent' });
      await expect(message.send()).rejects.toThrow('Only draft messages can be sent');
    });

    it('should throw an error if the recipient has been contacted recently', async () => {
      const message = new Message({
        userId: 1,
        recipient: 'test@example.com',
        status: 'draft',
      });
      OutreachLog.hasBeenContactedRecently.mockResolvedValue(true);

      await expect(message.send()).rejects.toThrow('This recipient has been contacted within the last month.');
    });
  });
});
