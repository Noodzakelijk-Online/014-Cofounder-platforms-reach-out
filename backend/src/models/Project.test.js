const Project = require('./Project');
const { pool } = require('../database/connection_pool');
const cache = require('../utils/cache');

// Mock our own utility modules
jest.mock('../database/connection_pool');
jest.mock('../utils/cache');

describe('Project Model', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new project and return it', async () => {
      const projectData = { userId: 1, name: 'Test Project' };
      const dbResult = {
        rows: [{
          id: 1,
          user_id: 1, // Corrected from userId
          name: 'Test Project',
          message_interval: 10,
          interval_unit: 'day',
        }],
      };
      pool.query.mockResolvedValue(dbResult);

      const project = await Project.create(projectData);

      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(cache.del).toHaveBeenCalledWith('projects:user:1'); // Should pass now
      expect(project).toBeInstanceOf(Project);
    });
  });

  describe('findById', () => {
    it('should return a project from cache if it exists', async () => {
      const cachedProject = { id: 1, name: 'Cached Project' };
      // The real cache would return a string, so we mock that behavior.
      cache.get.mockResolvedValue(JSON.stringify(cachedProject));

      const project = await Project.findById(1);

      expect(cache.get).toHaveBeenCalledWith('projects:1');
      expect(pool.query).not.toHaveBeenCalled();
      // The constructor will have been called with the parsed object
      expect(project.name).toBe('Cached Project');
    });

    it('should return a project from the database if not in cache', async () => {
      const dbResult = {
        rows: [{
          id: 1,
          user_id: 1,
          name: 'DB Project',
        }],
      };
      cache.get.mockResolvedValue(null);
      pool.query.mockResolvedValue(dbResult);

      const project = await Project.findById(1);

      expect(cache.get).toHaveBeenCalledWith('projects:1');
      expect(pool.query).toHaveBeenCalledTimes(1);
      // The real cache.set receives a stringified object.
      expect(cache.set).toHaveBeenCalledWith('projects:1', expect.any(String), 3600);
    });
  });
});
