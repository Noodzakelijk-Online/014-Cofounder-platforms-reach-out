/**
 * Message Model
 * 
 * This model represents a message in the Co-Founders Automated Reach Out Platform.
 * It includes methods for creating, updating, and managing messages, as well as
 * handling follow-ups, unresponsiveness flagging, and analytics tracking.
 */

const { pool } = require('../database/connection_pool');
const CachedModel = require('./CachedModel');
const { cache } = require('../utils/cache');
const scheduler = require('../utils/scheduler');
const redisPubSub = require('../utils/redisPubSub');
const OutreachLog = require('./OutreachLog');

class Message extends CachedModel {
  constructor(data = {}) {
    super();
    this.id = data.id || null;
    this.userId = data.userId || null;
    this.projectId = data.projectId || null;
    this.platformId = data.platformId || null;
    this.recipient = data.recipient || '';
    this.subject = data.subject || '';
    this.content = data.content || '';
    this.metadata = data.metadata || {}; // To store placeholders like {firstName: 'John'}
    this.status = data.status || 'draft'; // draft, sent, responded, unresponsive
    this.responseReceived = data.responseReceived || false;
    this.followUpCount = data.followUpCount || 0;
    this.followUpScheduled = data.followUpScheduled || false;
    this.followUpDate = data.followUpDate || null;
    this.unresponsiveFlagged = data.unresponsiveFlagged || false;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  /**
   * Create a new message
   * @param {Object} messageData - Message data
   * @returns {Promise<Message>} - Newly created message
   */
  static async create(messageData) {
    const query = `
      INSERT INTO messages (
        user_id, project_id, platform_id, recipient, subject, content, metadata, status,
        response_received, follow_up_count, follow_up_scheduled,
        follow_up_date, unresponsive_flagged, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
      RETURNING *
    `;

    const values = [
      messageData.userId,
      messageData.projectId,
      messageData.platformId,
      messageData.recipient,
      messageData.subject,
      messageData.content,
      messageData.metadata || {},
      messageData.status || 'draft',
      messageData.responseReceived || false,
      messageData.followUpCount || 0,
      messageData.followUpScheduled || false,
      messageData.followUpDate,
      messageData.unresponsiveFlagged || false
    ];

    try {
      const result = await pool.query(query, values);
      const message = new Message(Message.mapRow(result.rows[0]));

      // Invalidate cache
      await cache.del(`messages:${message.id}`);
      await cache.del(`messages:user:${message.userId}`);

      // Schedule follow-up if needed
      if (message.followUpScheduled && message.followUpDate) {
        await scheduler.scheduleFollowUp(message.id, message.followUpDate);
      }

      return message;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find a message by ID
   * @param {number} id - Message ID
   * @returns {Promise<Message|null>} - Message if found, null otherwise
   */
  static async findById(id) {
    // Try to get from cache first
    const cachedMessage = await cache.get(`messages:${id}`);
    if (cachedMessage) {
      return new Message(JSON.parse(cachedMessage));
    }

    const query = `
      SELECT id, user_id, project_id, platform_id, recipient, subject, content, status,
             response_received, follow_up_count, follow_up_scheduled,
             follow_up_date, unresponsive_flagged, created_at, updated_at
      FROM messages
      WHERE id = $1
    `;

    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const message = new Message(Message.mapRow(result.rows[0]));

    // Cache the message
    await cache.set(`messages:${id}`, JSON.stringify(message), 3600); // Cache for 1 hour

    return message;
  }

  /**
   * Find messages by user ID
   * @param {number} userId - User ID
   * @param {Object} options - Query options (limit, offset, status, platform)
   * @returns {Promise<Array<Message>>} - Array of messages
   */
  static async findByUserId(userId, options = {}) {
    const limit = options.limit || 20;
    const offset = options.offset || 0;
    
    let query = `
      SELECT id, user_id, project_id, platform_id, recipient, subject, content, status,
             response_received, follow_up_count, follow_up_scheduled,
             follow_up_date, unresponsive_flagged, created_at, updated_at
      FROM messages
      WHERE user_id = $1
    `;
    
    const queryParams = [userId];
    let paramIndex = 2;
    
    if (options.status) {
      query += ` AND status = $${paramIndex++}`;
      queryParams.push(options.status);
    }
    
    if (options.platform) {
      query += ` AND platform_id = $${paramIndex++}`;
      queryParams.push(options.platform);
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    queryParams.push(limit, offset);
    
    const result = await pool.query(query, queryParams);
    
    return result.rows.map(row => new Message(Message.mapRow(row)));
  }

  /**
   * Helper function to map database row to constructor properties
   */
  static mapRow(row) {
    return {
      id: row.id,
      userId: row.user_id,
      projectId: row.project_id,
      platformId: row.platform_id,
      recipient: row.recipient,
      subject: row.subject,
      content: row.content,
      metadata: row.metadata,
      status: row.status,
      responseReceived: row.response_received,
      followUpCount: row.follow_up_count,
      followUpScheduled: row.follow_up_scheduled,
      followUpDate: row.follow_up_date,
      unresponsiveFlagged: row.unresponsive_flagged,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Update message information
   * @param {Object} messageData - Message data to update
   * @returns {Promise<Message>} - Updated message
   */
  async update(messageData) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (messageData.projectId !== undefined) {
      fields.push(`project_id = $${paramIndex++}`);
      values.push(messageData.projectId);
      this.projectId = messageData.projectId;
    }

    if (messageData.metadata !== undefined) {
      fields.push(`metadata = $${paramIndex++}`);
      values.push(messageData.metadata);
      this.metadata = messageData.metadata;
    }

    if (messageData.recipient !== undefined) {
      fields.push(`recipient = $${paramIndex++}`);
      values.push(messageData.recipient);
      this.recipient = messageData.recipient;
    }

    if (messageData.subject !== undefined) {
      fields.push(`subject = $${paramIndex++}`);
      values.push(messageData.subject);
      this.subject = messageData.subject;
    }

    if (messageData.content !== undefined) {
      fields.push(`content = $${paramIndex++}`);
      values.push(messageData.content);
      this.content = messageData.content;
    }

    if (messageData.status !== undefined) {
      fields.push(`status = $${paramIndex++}`);
      values.push(messageData.status);
      this.status = messageData.status;
    }

    if (messageData.responseReceived !== undefined) {
      fields.push(`response_received = $${paramIndex++}`);
      values.push(messageData.responseReceived);
      this.responseReceived = messageData.responseReceived;
    }

    if (messageData.followUpCount !== undefined) {
      fields.push(`follow_up_count = $${paramIndex++}`);
      values.push(messageData.followUpCount);
      this.followUpCount = messageData.followUpCount;
    }

    if (messageData.followUpScheduled !== undefined) {
      fields.push(`follow_up_scheduled = $${paramIndex++}`);
      values.push(messageData.followUpScheduled);
      this.followUpScheduled = messageData.followUpScheduled;
    }

    if (messageData.followUpDate !== undefined) {
      fields.push(`follow_up_date = $${paramIndex++}`);
      values.push(messageData.followUpDate);
      this.followUpDate = messageData.followUpDate;
    }

    if (messageData.unresponsiveFlagged !== undefined) {
      fields.push(`unresponsive_flagged = $${paramIndex++}`);
      values.push(messageData.unresponsiveFlagged);
      this.unresponsiveFlagged = messageData.unresponsiveFlagged;
    }

    fields.push(`updated_at = NOW()`);
    
    if (fields.length === 1) {
      // Only updated_at was changed, nothing to update
      return this;
    }

    values.push(this.id);

    const query = `
      UPDATE messages
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, user_id, project_id, platform_id, recipient, subject, content, status,
                response_received, follow_up_count, follow_up_scheduled,
                follow_up_date, unresponsive_flagged, created_at, updated_at
    `;

    const result = await pool.query(query, values);
    
    const updatedMessage = new Message(Message.mapRow(result.rows[0]));

    // Invalidate cache
    await cache.del(`messages:${this.id}`);
    await cache.del(`messages:user:${this.userId}`);

    // Schedule or cancel follow-up if needed
    if (messageData.followUpScheduled !== undefined) {
      if (messageData.followUpScheduled && messageData.followUpDate) {
        await scheduler.scheduleFollowUp(this.id, messageData.followUpDate);
      } else {
        await scheduler.cancelFollowUp(this.id);
      }
    }

    // Notify about status change
    if (messageData.status !== undefined && messageData.status !== this.status) {
      await redisPubSub.publish('messageStatusChanged', { messageId: this.id, status: messageData.status });
    }

    return updatedMessage;
  }

  /**
   * Send a message
   * @returns {Promise<Message>} - Sent message
   */
  async send() {
    if (this.status !== 'draft') {
      throw new Error('Only draft messages can be sent');
    }

    // Check for recent outreach (spam prevention)
    const hasBeenContacted = await OutreachLog.hasBeenContactedRecently(this.userId, this.recipient);
    if (hasBeenContacted) {
      throw new Error('This recipient has been contacted within the last month.');
    }

    // Update status to 'sent'
    const sentMessage = await this.update({ status: 'sent' });

    // Log the outreach
    await OutreachLog.create(this.userId, this.recipient);

    // Increment the project's sent count
    const Project = require('./Project');
    const project = await Project.findById(this.projectId);
    if (project) {
      await project.incrementStats({ messagesSent: 1 });
    }

    // After sending, schedule the first follow-up from the sequence
    const FollowUpTemplate = require('./FollowUpTemplate');
    const templates = await FollowUpTemplate.findByProjectId(this.projectId);
    const firstTemplate = templates[0];

    if (firstTemplate) {
      const followUpDate = new Date();
      followUpDate.setDate(followUpDate.getDate() + firstTemplate.delayDays);
      await this.update({
        followUpScheduled: true,
        followUpDate: followUpDate,
      });
    }

    return sentMessage;
  }

  /**
   * Mark message as having received a response
   * @returns {Promise<Message>} - Updated message
   */
  async markResponded() {
    // Cancel any scheduled follow-ups
    await scheduler.cancelFollowUp(this.id);

    // Update message status
    return this.update({
      status: 'responded',
      responseReceived: true,
      followUpScheduled: false,
      followUpDate: null
    });
  }

  /**
   * Flag recipient as unresponsive
   * @returns {Promise<Message>} - Updated message
   */
  async flagUnresponsive() {
    // Cancel any scheduled follow-ups
    await scheduler.cancelFollowUp(this.id);

    // Update message status
    return this.update({
      status: 'unresponsive',
      unresponsiveFlagged: true,
      followUpScheduled: false,
      followUpDate: null
    });
  }

  /**
   * Reactivate an unresponsive recipient
   * @returns {Promise<Message>} - Updated message
   */
  async reactivate() {
    if (!this.unresponsiveFlagged) {
      throw new Error('Only unresponsive recipients can be reactivated');
    }

    // Update message status
    return this.update({
      status: 'sent',
      unresponsiveFlagged: false,
      followUpCount: 0
    });
  }

  /**
   * Delete a message
   * @returns {Promise<boolean>} - True if successful
   */
  async delete() {
    // Cancel any scheduled follow-ups
    if (this.followUpScheduled) {
      await scheduler.cancelFollowUp(this.id);
    }

    const query = `
      DELETE FROM messages
      WHERE id = $1
    `;

    await pool.query(query, [this.id]);
    
    // Invalidate cache
    await cache.del(`messages:${this.id}`);
    await cache.del(`messages:user:${this.userId}`);

    return true;
  }

  /**
   * Get message statistics for a user
   * @param {number} userId - User ID
   * @returns {Promise<Object>} - Message statistics
   */
  static async getStatistics(userId) {
    const query = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
        SUM(CASE WHEN status = 'responded' THEN 1 ELSE 0 END) as responded,
        SUM(CASE WHEN status = 'unresponsive' THEN 1 ELSE 0 END) as unresponsive,
        SUM(CASE WHEN follow_up_scheduled = true THEN 1 ELSE 0 END) as follow_ups_scheduled,
        SUM(CASE WHEN follow_up_count > 0 THEN 1 ELSE 0 END) as follow_ups_sent
      FROM messages
      WHERE user_id = $1
    `;

    const result = await pool.query(query, [userId]);
    
    const stats = result.rows[0];
    const total = parseInt(stats.total);
    const sent = parseInt(stats.sent);
    const responded = parseInt(stats.responded);
    
    // Calculate response rate
    const responseRate = sent > 0 ? (responded / sent) * 100 : 0;

    return {
      total,
      sent,
      responded,
      unresponsive: parseInt(stats.unresponsive),
      followUpsScheduled: parseInt(stats.follow_ups_scheduled),
      followUpsSent: parseInt(stats.follow_ups_sent),
      responseRate
    };
  }
}

module.exports = Message;
