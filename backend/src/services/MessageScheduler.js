const Project = require('../models/Project');
const Message = require('../models/Message');
const { pool } = require('../database/connection_pool');

class MessageScheduler {
  static async run() {
    const projects = await this.getAllProjects();

    for (const project of projects) {
      try {
        await this.processProject(project);
      } catch (error) {
        console.error(`Error processing project ${project.id}:`, error);
      }
    }
  }

  static async getAllProjects() {
    const query = `
      SELECT id, user_id, name, message_interval, interval_unit
      FROM projects
    `;
    const result = await pool.query(query);
    return result.rows.map(row => new Project({
      id: row.id,
      userId: row.user_id,
      name: row.name,
      messageInterval: row.message_interval,
      intervalUnit: row.interval_unit
    }));
  }

  static async processProject(project) {
    const messagesToSend = await this.getDraftMessagesForProject(project.id);
    if (messagesToSend.length === 0) {
      return;
    }

    const messagesSentInInterval = await this.getMessagesSentInInterval(project);
    const messagesAllowed = project.messageInterval - messagesSentInInterval;

    if (messagesAllowed <= 0) {
      return;
    }

    const messagesToProcess = messagesToSend.slice(0, messagesAllowed);
    for (const message of messagesToProcess) {
      try {
        await message.send();
      } catch (error) {
        console.error(`Error sending message ${message.id}:`, error);
      }
    }
  }

  static async getDraftMessagesForProject(projectId) {
    const query = `
      SELECT id, user_id, project_id, platform_id, recipient, subject, content, status
      FROM messages
      WHERE project_id = $1 AND status = 'draft'
    `;
    const result = await pool.query(query, [projectId]);
    return result.rows.map(row => new Message(row));
  }

  static async getMessagesSentInInterval(project) {
    const interval = `1 ${project.intervalUnit}`;
    const query = `
      SELECT COUNT(*)
      FROM messages
      WHERE project_id = $1
        AND status = 'sent'
        AND updated_at > NOW() - $2::interval
    `;
    const result = await pool.query(query, [project.id, interval]);
    return parseInt(result.rows[0].count, 10);
  }
}

module.exports = MessageScheduler;
