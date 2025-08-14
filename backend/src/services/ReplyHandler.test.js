const ReplyHandler = require('./ReplyHandler');
const Message = require('../models/Message');

jest.mock('../models/Message');

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
  });

  it('should handle cases where the message is not found', async () => {
    Message.findById.mockResolvedValue(null);
    console.warn = jest.fn(); // Suppress console output for the test

    const replyPayload = { originalMessageId: 999 };
    await ReplyHandler.handleReply(replyPayload);

    expect(Message.findById).toHaveBeenCalledWith(999);
    expect(console.warn).toHaveBeenCalledWith('Received a reply for a message that does not exist: 999');
  });

  it('should handle cases where the payload has no message ID', async () => {
    console.error = jest.fn(); // Suppress console output for the test
    const replyPayload = { someOtherData: 'foo' };
    await ReplyHandler.handleReply(replyPayload);

    expect(Message.findById).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith('Received a reply payload without an originalMessageId.');
  });
});
