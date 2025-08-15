const Project = require('./Project');
const { pool } = require('../database/connection_pool');
const { cache } = require('../utils/cache');

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
          user_id: 1,
          name: 'Test Project',
        }],
      };
      pool.query.mockResolvedValue(dbResult);

      const project = await Project.create(projectData);

      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(cache.del).toHaveBeenCalledWith('projects:user:1');
      expect(project).toBeInstanceOf(Project);
    });
  });

  describe('findById', () => {
    it('should return a project from cache if it exists', async () => {
      const cachedProject = { id: 1, name: 'Cached Project' };
      cache.get.mockResolvedValue(JSON.stringify(cachedProject)); // Stringify the object

      const project = await Project.findById(1);

      expect(cache.get).toHaveBeenCalledWith('projects:1');
      expect(pool.query).not.toHaveBeenCalled();
      expect(project.name).toBe('Cached Project');
    });

    it('should return a project from the database if not in cache', async () => {
      const dbResult = { rows: [{ id: 1, name: 'DB Project' }] };
      cache.get.mockResolvedValue(null);
      pool.query.mockResolvedValue(dbResult);

      const project = await Project.findById(1);

      expect(cache.get).toHaveBeenCalledWith('projects:1');
      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(cache.set).toHaveBeenCalledWith('projects:1', expect.any(String), 3600); // Expect a string
    });
  });
});
