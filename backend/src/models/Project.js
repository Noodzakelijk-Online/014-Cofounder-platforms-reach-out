/**
 * Project Model
 *
 * This model represents a project in the Co-Founders Automated Reach Out Platform.
 * It includes settings for message sending intervals and other project-specific
 * configurations.
 */

const { pool } = require('../database/connection_pool');
const CachedModel = require('./CachedModel');
const { cache } = require('../utils/cache');

class Project extends CachedModel {
  constructor(data = {}) {
    super();
    this.id = data.id || null;
    this.userId = data.userId || null;
    this.name = data.name || '';
    this.messageInterval = data.messageInterval || 1; // Default to 1 message per interval
    this.intervalUnit = data.intervalUnit || 'day'; // 'day', 'week', 'month'
    this.messagesSentCount = data.messagesSentCount || 0;
    this.responsesReceivedCount = data.responsesReceivedCount || 0;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  /**
   * Create a new project
   * @param {Object} projectData - Project data
   * @returns {Promise<Project>} - Newly created project
   */
  static async create(projectData) {
    const query = `
      INSERT INTO projects (user_id, name, message_interval, interval_unit)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;

    const values = [
      projectData.userId,
      projectData.name,
      projectData.messageInterval,
      projectData.intervalUnit,
    ];

    try {
      const result = await pool.query(query, values);
      const project = new Project({
        id: result.rows[0].id,
        userId: result.rows[0].user_id,
        name: result.rows[0].name,
        messageInterval: result.rows[0].message_interval,
        intervalUnit: result.rows[0].interval_unit,
        createdAt: result.rows[0].created_at,
        updatedAt: result.rows[0].updated_at
      });

      // Invalidate cache
      await cache.del(`projects:user:${project.userId}`);

      return project;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find a project by ID
   * @param {number} id - Project ID
   * @returns {Promise<Project|null>} - Project if found, null otherwise
   */
  static async findById(id) {
    // Try to get from cache first
    const cachedProject = await cache.get(`projects:${id}`);
    if (cachedProject) {
      // The cache might not have the latest stats, but it's a trade-off.
      // For real-time stats, we could skip the cache here.
      return new Project(JSON.parse(cachedProject));
    }

    const query = `SELECT * FROM projects WHERE id = $1`;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    const project = new Project(this.mapRow(result.rows[0]));

    // Cache the project
    await cache.set(`projects:${id}`, JSON.stringify(project), 3600); // Cache for 1 hour

    return project;
  }

  /**
   * Find projects by user ID
   * @param {number} userId - User ID
   * @returns {Promise<Array<Project>>} - Array of projects
   */
  static async findByUserId(userId) {
    // Try to get from cache first
    const cachedProjects = await cache.get(`projects:user:${userId}`);
    if (cachedProjects) {
      return JSON.parse(cachedProjects).map(p => new Project(p));
    }

    const query = `SELECT * FROM projects WHERE user_id = $1`;
    const result = await pool.query(query, [userId]);
    const projects = result.rows.map(row => new Project(this.mapRow(row)));

    // Cache the projects
    await cache.set(`projects:user:${userId}`, JSON.stringify(projects), 3600); // Cache for 1 hour

    return projects;
  }

  /**
   * Atomically increments stats for a project.
   * @param {Object} fieldsToIncrement - e.g. { messagesSent: 1 }
   */
  async incrementStats(fieldsToIncrement) {
    let query = 'UPDATE projects SET ';
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (fieldsToIncrement.messagesSent) {
      updates.push(`messages_sent_count = messages_sent_count + $${paramIndex++}`);
      values.push(fieldsToIncrement.messagesSent);
    }
    if (fieldsToIncrement.responsesReceived) {
      updates.push(`responses_received_count = responses_received_count + $${paramIndex++}`);
      values.push(fieldsToIncrement.responsesReceived);
    }

    if (updates.length === 0) return this;

    query += updates.join(', ');
    query += ` WHERE id = $${paramIndex} RETURNING *;`;
    values.push(this.id);

    const result = await pool.query(query, values);
    const updatedProject = new Project(Project.mapRow(result.rows[0]));

    // Update the current instance with new values
    this.messagesSentCount = updatedProject.messagesSentCount;
    this.responsesReceivedCount = updatedProject.responsesReceivedCount;

    // Invalidate cache
    await cache.del(`projects:${this.id}`);
    await cache.del(`projects:user:${this.userId}`);

    return updatedProject;
  }

  /**
   * Helper function to map database row to constructor properties
   */
  static mapRow(row) {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      messageInterval: row.message_interval,
      intervalUnit: row.interval_unit,
      messagesSentCount: row.messages_sent_count,
      responsesReceivedCount: row.responses_received_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Update project information
   * @param {Object} projectData - Project data to update
   * @returns {Promise<Project>} - Updated project
   */
  async update(projectData) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (projectData.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(projectData.name);
      this.name = projectData.name;
    }

    if (projectData.messageInterval !== undefined) {
      fields.push(`message_interval = $${paramIndex++}`);
      values.push(projectData.messageInterval);
      this.messageInterval = projectData.messageInterval;
    }

    if (projectData.intervalUnit !== undefined) {
      fields.push(`interval_unit = $${paramIndex++}`);
      values.push(projectData.intervalUnit);
      this.intervalUnit = projectData.intervalUnit;
    }

    fields.push(`updated_at = NOW()`);

    if (fields.length === 1) {
      // Only updated_at was changed, nothing to update
      return this;
    }

    values.push(this.id);

    const query = `
      UPDATE projects
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, user_id, name, message_interval, interval_unit, created_at, updated_at
    `;

    const result = await pool.query(query, values);

    const updatedProject = new Project({
      id: result.rows[0].id,
      userId: result.rows[0].user_id,
      name: result.rows[0].name,
      messageInterval: result.rows[0].message_interval,
      intervalUnit: result.rows[0].interval_unit,
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at
    });

    // Invalidate cache
    await cache.del(`projects:${this.id}`);
    await cache.del(`projects:user:${this.userId}`);

    return updatedProject;
  }

  /**
   * Delete a project
   * @returns {Promise<boolean>} - True if successful
   */
  async delete() {
    const query = `
      DELETE FROM projects
      WHERE id = $1
    `;

    await pool.query(query, [this.id]);

    // Invalidate cache
    await cache.del(`projects:${this.id}`);
    await cache.del(`projects:user:${this.userId}`);

    return true;
  }
}

module.exports = Project;
