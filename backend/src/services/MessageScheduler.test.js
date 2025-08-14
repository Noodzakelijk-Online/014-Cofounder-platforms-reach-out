const MessageScheduler = require('./MessageScheduler');
const Message = require('../models/Message');
const FollowUpTemplate = require('../models/FollowUpTemplate');
const { spin } = require('../utils/spintax');
const { pool } = require('../database/connection_pool');

// Mock dependencies
jest.mock('../database/connection_pool');
jest.mock('../models/Message');
jest.mock('../models/FollowUpTemplate');
jest.mock('../utils/spintax');

describe('MessageScheduler Service - Follow-ups', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock the Message class constructor to assign properties
    Message.mockImplementation(data => ({
      ...data,
      update: jest.fn().mockResolvedValue(true),
      send: jest.fn().mockResolvedValue(true),
    }));
  });

  it('should process a due follow-up and schedule the next one', async () => {
    const originalMessage = new Message({
      id: 1,
      userId: 1,
      projectId: 1,
      recipient: 'test@test.com',
      responseReceived: false,
      followUpCount: 0,
      followUpScheduled: true,
    });

    const followUpTemplates = [
      { id: 1, sequenceOrder: 1, delayDays: 3, templateSubject: 'Re: {Subject}', templateContent: 'First follow-up' },
      { id: 2, sequenceOrder: 2, delayDays: 5, templateSubject: 'Re: {Subject}', templateContent: 'Second follow-up' },
    ];

    jest.spyOn(MessageScheduler, 'getMessagesWithDueFollowUps').mockResolvedValue([originalMessage]);
    FollowUpTemplate.findByProjectId.mockResolvedValue(followUpTemplates);
    Message.create.mockResolvedValue({ send: jest.fn().mockResolvedValue(true) });
    spin.mockImplementation(text => text);

    await MessageScheduler.processDueFollowUps();

    expect(MessageScheduler.getMessagesWithDueFollowUps).toHaveBeenCalledTimes(1);
    expect(FollowUpTemplate.findByProjectId).toHaveBeenCalledWith(1);
    expect(Message.create).toHaveBeenCalledWith(expect.objectContaining({
      content: 'First follow-up'
    }));
    expect(originalMessage.update).toHaveBeenCalledWith({
      followUpCount: 1,
      followUpDate: expect.any(Date),
    });
  });

  it('should stop follow-ups if the sequence is complete', async () => {
    const originalMessage = new Message({
      id: 2,
      projectId: 1,
      followUpCount: 1,
      responseReceived: false,
    });

    const followUpTemplates = [
      { id: 1, sequenceOrder: 1, delayDays: 3, templateSubject: 'Re: {Subject}', templateContent: 'First follow-up' },
    ];

    jest.spyOn(MessageScheduler, 'getMessagesWithDueFollowUps').mockResolvedValue([originalMessage]);
    FollowUpTemplate.findByProjectId.mockResolvedValue(followUpTemplates);

    await MessageScheduler.processDueFollowUps();

    expect(Message.create).not.toHaveBeenCalled();
    expect(originalMessage.update).toHaveBeenCalledWith({
      followUpScheduled: false,
      followUpDate: null,
    });
  });
});
