const { pool } = require('../database/connection_pool');

class FollowUpTemplate {
  constructor(data = {}) {
    this.id = data.id || null;
    this.projectId = data.projectId || null;
    this.sequenceOrder = data.sequenceOrder || 1;
    this.delayDays = data.delayDays || 3; // Default to 3 days after previous message
    this.templateSubject = data.templateSubject || '';
    this.templateContent = data.templateContent || '';
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  /**
   * Create a new follow-up template
   * @param {Object} templateData - Template data
   * @returns {Promise<FollowUpTemplate>}
   */
  static async create(templateData) {
    const query = `
      INSERT INTO follow_up_templates (project_id, sequence_order, delay_days, template_subject, template_content)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const values = [
      templateData.projectId,
      templateData.sequenceOrder,
      templateData.delayDays,
      templateData.templateSubject,
      templateData.templateContent,
    ];
    const result = await pool.query(query, values);
    return new FollowUpTemplate(this.mapRow(result.rows[0]));
  }

  /**
   * Find a follow-up template by its ID
   * @param {number} id - Template ID
   * @returns {Promise<FollowUpTemplate|null>}
   */
  static async findById(id) {
    const query = 'SELECT * FROM follow_up_templates WHERE id = $1;';
    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) return null;
    return new FollowUpTemplate(this.mapRow(result.rows[0]));
  }

  /**
   * Find all follow-up templates for a project, ordered by sequence
   * @param {number} projectId - Project ID
   * @returns {Promise<FollowUpTemplate[]>}
   */
  static async findByProjectId(projectId) {
    const query = 'SELECT * FROM follow_up_templates WHERE project_id = $1 ORDER BY sequence_order ASC;';
    const result = await pool.query(query, [projectId]);
    return result.rows.map(row => new FollowUpTemplate(this.mapRow(row)));
  }

  /**
   * Helper function to map database row to constructor properties
   */
  static mapRow(row) {
    return {
      id: row.id,
      projectId: row.project_id,
      sequenceOrder: row.sequence_order,
      delayDays: row.delay_days,
      templateSubject: row.template_subject,
      templateContent: row.template_content,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

module.exports = FollowUpTemplate;
