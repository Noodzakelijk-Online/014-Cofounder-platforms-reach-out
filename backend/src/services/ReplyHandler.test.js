const ReplyHandler = require('./ReplyHandler');
const Message = require('../models/Message');
const logger = require('../utils/logger');

jest.mock('../models/Message');
jest.mock('../utils/logger'); // Mock the logger to spy on its methods

describe('ReplyHandler Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should find a message and mark it as responded', async () => {
    const mockMessage = {
      id: 123,
      responseReceived: false,
      markResponded: jest.fn().mockResolvedValue(true),
    };
    Message.findById.mockResolvedValue(mockMessage);

    const replyPayload = { originalMessageId: 123 };
    await ReplyHandler.handleReply(replyPayload);

    expect(Message.findById).toHaveBeenCalledWith(123);
    expect(mockMessage.markResponded).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith({ messageId: 123 }, 'Message marked as responded.');
  });

  it('should do nothing if the message is already marked as responded', async () => {
    const mockMessage = {
      id: 123,
      responseReceived: true,
      markResponded: jest.fn(),
    };
    Message.findById.mockResolvedValue(mockMessage);

    const replyPayload = { originalMessageId: 123 };
    await ReplyHandler.handleReply(replyPayload);

    expect(Message.findById).toHaveBeenCalledWith(123);
    expect(mockMessage.markResponded).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith({ messageId: 123 }, 'Received a reply for an already-responded message. Ignoring.');
  });

  it('should handle cases where the message is not found', async () => {
    Message.findById.mockResolvedValue(null);

    const replyPayload = { originalMessageId: 999 };
    await ReplyHandler.handleReply(replyPayload);

    expect(Message.findById).toHaveBeenCalledWith(999);
    expect(logger.warn).toHaveBeenCalledWith({ originalMessageId: 999 }, 'Received a reply for a message that does not exist.');
  });

  it('should handle cases where the payload has no message ID', async () => {
    const replyPayload = { someOtherData: 'foo' };
    await ReplyHandler.handleReply(replyPayload);

    expect(Message.findById).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith({ payload: replyPayload }, 'Received a reply payload without an originalMessageId.');
  });
});
