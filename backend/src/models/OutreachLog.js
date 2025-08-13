/**
 * OutreachLog Model
 *
 * This model logs outreach attempts to co-founders to prevent spamming.
 */

const { pool } = require('../database/connection_pool');

class OutreachLog {
  /**
   * Log an outreach attempt
   * @param {number} userId - User ID
   * @param {string} recipient - Recipient identifier (e.g., email)
   * @returns {Promise<void>}
   */
  static async create(userId, recipient) {
    const query = `
      INSERT INTO outreach_logs (user_id, recipient, outreach_date)
      VALUES ($1, $2, NOW())
    `;
    await pool.query(query, [userId, recipient]);
  }

  /**
   * Check if a recipient has been contacted by a user within the last month
   * @param {number} userId - User ID
   * @param {string} recipient - Recipient identifier
   * @returns {Promise<boolean>} - True if contacted recently, false otherwise
   */
  static async hasBeenContactedRecently(userId, recipient) {
    const query = `
      SELECT 1
      FROM outreach_logs
      WHERE user_id = $1
        AND recipient = $2
        AND outreach_date > NOW() - INTERVAL '1 month'
    `;
    const result = await pool.query(query, [userId, recipient]);
    return result.rows.length > 0;
  }
}

module.exports = OutreachLog;
