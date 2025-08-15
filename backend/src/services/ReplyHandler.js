const Message = require('../models/Message');
const logger = require('../utils/logger');

class ReplyHandler {
  /**
   * Handles an incoming reply.
   * This would typically be called from a webhook endpoint.
   * @param {Object} replyPayload - The data from the incoming reply.
   * @returns {Promise<void>}
   */
  static async handleReply(replyPayload) {
    // In a real-world scenario, this logic would be more complex.
    // It would need to parse email headers (In-Reply-To, References)
    // or use a unique identifier from the reply body or subject to find the
    // original message.
    // For this implementation, we'll assume the payload directly gives us the
    // ID of the message that was replied to.
    const originalMessageId = replyPayload.originalMessageId;

    if (!originalMessageId) {
      logger.error({ payload: replyPayload }, 'Received a reply payload without an originalMessageId.');
      return;
    }

    try {
      const message = await Message.findById(originalMessageId);

      if (!message) {
        logger.warn({ originalMessageId }, 'Received a reply for a message that does not exist.');
        return;
      }

      if (message.responseReceived) {
        logger.info({ messageId: originalMessageId }, 'Received a reply for an already-responded message. Ignoring.');
        return;
      }

      await message.markResponded();
      logger.info({ messageId: originalMessageId }, 'Message marked as responded.');

    } catch (error) {
      logger.error({ err: error, originalMessageId }, 'Error processing reply.');
    }
  }
}

module.exports = ReplyHandler;
