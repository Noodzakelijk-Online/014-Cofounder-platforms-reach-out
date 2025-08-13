const MessageScheduler = require('./MessageScheduler');
const Project = require('../models/Project');
const Message = require('../models/Message');
const { pool } = require('../database/connection_pool');

// Mock dependencies
jest.mock('../database/connection_pool');
jest.mock('../models/Project');
jest.mock('../models/Message');

describe('MessageScheduler Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('run', () => {
    it('should process projects and send messages', async () => {
      const mockSend = jest.fn().mockResolvedValue(true);
      Message.mockImplementation(() => ({ id: 1, send: mockSend }));

      const projectsBatch = [{ id: 1, messageInterval: 5, intervalUnit: 'day' }];
      // Mock the implementation of getProjectsBatch which is a static method
      const getProjectsBatchSpy = jest.spyOn(MessageScheduler, 'getProjectsBatch')
        .mockResolvedValueOnce(projectsBatch)
        .mockResolvedValueOnce([]); // Return empty array for the second call to stop the loop

      const draftMessages = [new Message(), new Message()];
      jest.spyOn(MessageScheduler, 'getDraftMessagesForProject').mockResolvedValue(draftMessages);
      jest.spyOn(MessageScheduler, 'getMessagesSentInInterval').mockResolvedValue(2);

      await MessageScheduler.run();

      expect(getProjectsBatchSpy).toHaveBeenCalledTimes(2);
      expect(mockSend).toHaveBeenCalledTimes(2); // 3 allowed, 2 drafts available

      getProjectsBatchSpy.mockRestore();
    });
  });
});
