const FollowUpTemplate = require('./FollowUpTemplate');
const { pool } = require('../database/connection_pool');

// Mock the database connection_pool
jest.mock('../database/connection_pool');

describe('FollowUpTemplate Model', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const templateData = {
    projectId: 1,
    sequenceOrder: 1,
    delayDays: 3,
    templateSubject: 'Following up',
    templateContent: 'Just following up on my previous message.',
  };

  const dbRow = {
    id: 1,
    project_id: 1,
    sequence_order: 1,
    delay_days: 3,
    template_subject: 'Following up',
    template_content: 'Just following up on my previous message.',
    created_at: new Date(),
    updated_at: new Date(),
  };

  describe('create', () => {
    it('should create a new follow-up template', async () => {
      pool.query.mockResolvedValue({ rows: [dbRow] });
      const template = await FollowUpTemplate.create(templateData);
      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(template).toBeInstanceOf(FollowUpTemplate);
      expect(template.projectId).toBe(1);
    });
  });

  describe('findById', () => {
    it('should find a template by ID', async () => {
      pool.query.mockResolvedValue({ rows: [dbRow] });
      const template = await FollowUpTemplate.findById(1);
      expect(pool.query).toHaveBeenCalledWith(expect.any(String), [1]);
      expect(template.id).toBe(1);
    });

    it('should return null if template not found', async () => {
      pool.query.mockResolvedValue({ rows: [] });
      const template = await FollowUpTemplate.findById(999);
      expect(template).toBeNull();
    });
  });

  describe('findByProjectId', () => {
    it('should find all templates for a project', async () => {
      pool.query.mockResolvedValue({ rows: [dbRow, { ...dbRow, id: 2, sequence_order: 2 }] });
      const templates = await FollowUpTemplate.findByProjectId(1);
      expect(pool.query).toHaveBeenCalledWith(expect.any(String), [1]);
      expect(templates).toHaveLength(2);
      expect(templates[0].sequenceOrder).toBe(1);
      expect(templates[1].sequenceOrder).toBe(2);
    });
  });
});
