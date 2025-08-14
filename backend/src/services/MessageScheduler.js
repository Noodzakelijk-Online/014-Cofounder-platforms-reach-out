const Project = require('../models/Project');
const Message = require('../models/Message');
const FollowUpTemplate = require('../models/FollowUpTemplate');
const { spin } = require('../utils/spintax');
const { pool } = require('../database/connection_pool');

const BATCH_SIZE = 100;

class MessageScheduler {
  static async run() {
    // Two main tasks for the scheduler:
    // 1. Process new draft messages based on project rate limits.
    await this.processDrafts();
    // 2. Process any follow-ups that are due.
    await this.processDueFollowUps();
  }

  static async processDrafts() {
    let offset = 0;
    let hasMoreProjects = true;
    while (hasMoreProjects) {
      const projects = await this.getProjectsBatch(offset, BATCH_SIZE);
      if (projects.length === 0) {
        hasMoreProjects = false;
        continue;
      }
      for (const project of projects) {
        try {
          await this.processProjectDrafts(project);
        } catch (error) {
          console.error(`Error processing drafts for project ${project.id}:`, error);
        }
      }
      offset += BATCH_SIZE;
    }
  }

  static async getProjectsBatch(offset, limit) {
    // ... (this method remains the same)
  }

  static async processProjectDrafts(project) {
    // ... (this method, formerly processProject, remains the same)
  }

  static async processDueFollowUps() {
    const dueMessages = await this.getMessagesWithDueFollowUps();
    for (const message of dueMessages) {
      try {
        if (message.responseReceived) {
          await message.update({ followUpScheduled: false, followUpDate: null });
          continue;
        }

        const templates = await FollowUpTemplate.findByProjectId(message.projectId);
        if (templates.length === 0) continue;

        const nextFollowUpIndex = message.followUpCount;
        const template = templates[nextFollowUpIndex];

        if (!template) {
          // No more follow-ups in the sequence
          await message.update({ followUpScheduled: false, followUpDate: null });
          continue;
        }

        // Create and send the new follow-up message
        const newFollowUpMessage = await Message.create({
          userId: message.userId,
          projectId: message.projectId,
          recipient: message.recipient,
          subject: spin(template.templateSubject),
          content: spin(template.templateContent),
          status: 'draft', // Create as draft, then send
        });
        await newFollowUpMessage.send(); // This will log the outreach for spam prevention

        // Update the original message and schedule the next follow-up
        const nextTemplate = templates[nextFollowUpIndex + 1];
        const newFollowUpCount = message.followUpCount + 1;

        if (nextTemplate) {
          const followUpDate = new Date();
          followUpDate.setDate(followUpDate.getDate() + nextTemplate.delayDays);
          await message.update({
            followUpCount: newFollowUpCount,
            followUpDate: followUpDate,
          });
        } else {
          // This was the last follow-up
          await message.update({
            followUpCount: newFollowUpCount,
            followUpScheduled: false,
            followUpDate: null,
          });
        }
      } catch (error) {
        console.error(`Error processing follow-up for message ${message.id}:`, error);
      }
    }
  }

  static async getMessagesWithDueFollowUps() {
    const query = `
      SELECT * FROM messages
      WHERE follow_up_scheduled = true AND follow_up_date <= NOW();
    `;
    const result = await pool.query(query);
    // We need full Message instances to call .update() etc.
    return result.rows.map(row => new Message(row));
  }

  // ... (other static methods like getDraftMessagesForProject, getMessagesSentInInterval)
}

// To avoid duplication, I will just paste the whole file content
// with the old methods assumed to be present.

MessageScheduler.getProjectsBatch = async function(offset, limit) {
  const query = `
    SELECT id, user_id, name, message_interval, interval_unit
    FROM projects
    ORDER BY id
    OFFSET $1
    LIMIT $2
  `;
  const result = await pool.query(query, [offset, limit]);
  return result.rows.map(row => new Project({
    id: row.id,
    userId: row.user_id,
    name: row.name,
    messageInterval: row.message_interval,
    intervalUnit: row.interval_unit
  }));
};

MessageScheduler.processProjectDrafts = async function(project) {
  const messagesToSend = await this.getDraftMessagesForProject(project.id);
  if (messagesToSend.length === 0) return;
  const messagesSentInInterval = await this.getMessagesSentInInterval(project);
  const messagesAllowed = project.messageInterval - messagesSentInInterval;
  if (messagesAllowed <= 0) return;
  const messagesToProcess = messagesToSend.slice(0, messagesAllowed);
  for (const message of messagesToProcess) {
    try {
      await message.send();
    } catch (error) {
      console.error(`Error sending message ${message.id}:`, error);
    }
  }
};

MessageScheduler.getDraftMessagesForProject = async function(projectId) {
  const query = `
    SELECT id, user_id, project_id, platform_id, recipient, subject, content, status
    FROM messages
    WHERE project_id = $1 AND status = 'draft'
  `;
  const result = await pool.query(query, [projectId]);
  return result.rows.map(row => new Message(row));
};

MessageScheduler.getMessagesSentInInterval = async function(project) {
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
};


module.exports = MessageScheduler;
