const MessageScheduler = require('./MessageScheduler');
const Project = require('../models/Project');
const Message = require('../models/Message');
const { pool } = require('../database/connection_pool');

jest.mock('../models/Project');
jest.mock('../models/Message');
jest.mock('../database/connection_pool', () => ({
  pool: {
    query: jest.fn(),
  },
}));

describe('MessageScheduler Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should send messages for a project that has not reached its limit', async () => {
    const mockSend = jest.fn();
    Message.mockImplementation(() => {
      return {
        id: 1,
        send: mockSend,
      };
    });
    const project = { id: 1, messageInterval: 5, intervalUnit: 'day' };
    jest.spyOn(MessageScheduler, 'getAllProjects').mockResolvedValue([project]);
    jest.spyOn(MessageScheduler, 'getDraftMessagesForProject').mockResolvedValue([new Message(), new Message()]);
    jest.spyOn(MessageScheduler, 'getMessagesSentInInterval').mockResolvedValue(2); // 2 already sent

    await MessageScheduler.run();

    expect(MessageScheduler.getAllProjects).toHaveBeenCalledTimes(1);
    expect(MessageScheduler.getDraftMessagesForProject).toHaveBeenCalledWith(1);
    expect(MessageScheduler.getMessagesSentInInterval).toHaveBeenCalledWith(project);
    expect(mockSend).toHaveBeenCalledTimes(2);
  });

  it('should not send messages if the project has reached its limit', async () => {
    const mockSend = jest.fn();
    Message.mockImplementation(() => {
      return {
        id: 1,
        send: mockSend,
      };
    });
    const project = { id: 1, messageInterval: 5, intervalUnit: 'day' };
    jest.spyOn(MessageScheduler, 'getAllProjects').mockResolvedValue([project]);
    jest.spyOn(MessageScheduler, 'getDraftMessagesForProject').mockResolvedValue([new Message()]);
    jest.spyOn(MessageScheduler, 'getMessagesSentInInterval').mockResolvedValue(5); // Limit reached

    await MessageScheduler.run();

    expect(mockSend).not.toHaveBeenCalled();
  });

  it('should not send messages if there are no drafts', async () => {
    const mockSend = jest.fn();
    Message.mockImplementation(() => {
      return {
        id: 1,
        send: mockSend,
      };
    });
    const project = { id: 1, messageInterval: 5, intervalUnit: 'day' };
    jest.spyOn(MessageScheduler, 'getAllProjects').mockResolvedValue([project]);
    jest.spyOn(MessageScheduler, 'getDraftMessagesForProject').mockResolvedValue([]);
    jest.spyOn(MessageScheduler, 'getMessagesSentInInterval').mockResolvedValue(0);

    await MessageScheduler.run();

    expect(mockSend).not.toHaveBeenCalled();
  });

  it('should handle errors when sending a message', async () => {
    const mockSend = jest.fn().mockRejectedValue(new Error('Send failed'));
    Message.mockImplementation(() => {
      return {
        id: 1,
        send: mockSend,
      };
    });

    const project = { id: 1, messageInterval: 5, intervalUnit: 'day' };
    jest.spyOn(MessageScheduler, 'getAllProjects').mockResolvedValue([project]);
    jest.spyOn(MessageScheduler, 'getDraftMessagesForProject').mockResolvedValue([new Message()]);
    jest.spyOn(MessageScheduler, 'getMessagesSentInInterval').mockResolvedValue(0);
    console.error = jest.fn(); // Mock console.error

    await MessageScheduler.run();

    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith('Error sending message 1:', new Error('Send failed'));
  });
});
