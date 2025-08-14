const Message = require('../models/Message');

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
      console.error('Received a reply payload without an originalMessageId.');
      // In a real app, you might want to log this to a dead-letter queue.
      return;
    }

    try {
      const message = await Message.findById(originalMessageId);

      if (!message) {
        console.warn(`Received a reply for a message that does not exist: ${originalMessageId}`);
        return;
      }

      // If the message was already marked as responded, do nothing.
      if (message.responseReceived) {
        return;
      }

      // Mark the message as responded. This will also cancel any
      // scheduled follow-ups for it.
      await message.markResponded();
      console.log(`Message ${originalMessageId} marked as responded.`);

    } catch (error) {
      console.error(`Error processing reply for message ${originalMessageId}:`, error);
      // It's important to catch errors here so that one bad reply doesn't
      // crash the whole ingestion process.
    }
  }
}

module.exports = ReplyHandler;
