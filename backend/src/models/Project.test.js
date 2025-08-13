const Project = require('./Project');
const { pool } = require('../database/connection_pool');
const cache = require('../utils/cache');

jest.mock('../database/connection_pool', () => ({
  pool: {
    query: jest.fn(),
  },
}));

jest.mock('../utils/cache', () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
}));

describe('Project Model', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new project and return it', async () => {
      const projectData = {
        userId: 1,
        name: 'Test Project',
        messageInterval: 10,
        intervalUnit: 'day',
      };
      const dbResult = {
        rows: [{
          id: 1,
          user_id: 1,
          name: 'Test Project',
          message_interval: 10,
          interval_unit: 'day',
          created_at: new Date(),
          updated_at: new Date(),
        }],
      };
      pool.query.mockResolvedValue(dbResult);

      const project = await Project.create(projectData);

      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(cache.del).toHaveBeenCalledWith('projects:user:1');
      expect(project).toBeInstanceOf(Project);
      expect(project.name).toBe('Test Project');
    });

    it('should throw an error if the database query fails', async () => {
      const projectData = { userId: 1, name: 'Test Project' };
      pool.query.mockRejectedValue(new Error('DB error'));

      await expect(Project.create(projectData)).rejects.toThrow('DB error');
    });
  });

  describe('findById', () => {
    it('should return a project from cache if it exists', async () => {
      const cachedProject = { id: 1, name: 'Cached Project' };
      cache.get.mockResolvedValue(JSON.stringify(cachedProject));

      const project = await Project.findById(1);

      expect(cache.get).toHaveBeenCalledWith('projects:1');
      expect(pool.query).not.toHaveBeenCalled();
      expect(project.name).toBe('Cached Project');
    });

    it('should return a project from the database if not in cache', async () => {
      const dbResult = {
        rows: [{
          id: 1,
          user_id: 1,
          name: 'DB Project',
          message_interval: 10,
          interval_unit: 'day',
        }],
      };
      cache.get.mockResolvedValue(null);
      pool.query.mockResolvedValue(dbResult);

      const project = await Project.findById(1);

      expect(cache.get).toHaveBeenCalledWith('projects:1');
      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(cache.set).toHaveBeenCalledWith('projects:1', expect.any(String), 3600);
      expect(project.name).toBe('DB Project');
    });

    it('should return null if project is not found', async () => {
      cache.get.mockResolvedValue(null);
      pool.query.mockResolvedValue({ rows: [] });

      const project = await Project.findById(1);

      expect(project).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('should return projects from cache if they exist', async () => {
      const cachedProjects = [{ id: 1, name: 'Cached Project' }];
      cache.get.mockResolvedValue(JSON.stringify(cachedProjects));

      const projects = await Project.findByUserId(1);

      expect(cache.get).toHaveBeenCalledWith('projects:user:1');
      expect(pool.query).not.toHaveBeenCalled();
      expect(projects[0].name).toBe('Cached Project');
    });

    it('should return projects from the database if not in cache', async () => {
      const dbResult = {
        rows: [{
          id: 1,
          user_id: 1,
          name: 'DB Project',
          message_interval: 10,
          interval_unit: 'day',
        }],
      };
      cache.get.mockResolvedValue(null);
      pool.query.mockResolvedValue(dbResult);

      const projects = await Project.findByUserId(1);

      expect(cache.get).toHaveBeenCalledWith('projects:user:1');
      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(cache.set).toHaveBeenCalledWith('projects:user:1', expect.any(String), 3600);
      expect(projects[0].name).toBe('DB Project');
    });

    it('should return an empty array if no projects are found', async () => {
      cache.get.mockResolvedValue(null);
      pool.query.mockResolvedValue({ rows: [] });

      const projects = await Project.findByUserId(1);

      expect(projects).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update a project and return the updated instance', async () => {
      const project = new Project({ id: 1, userId: 1, name: 'Old Name' });
      const updatedData = { name: 'New Name' };
      const dbResult = {
        rows: [{
          id: 1,
          user_id: 1,
          name: 'New Name',
          message_interval: 10,
          interval_unit: 'day',
        }],
      };
      pool.query.mockResolvedValue(dbResult);

      const updatedProject = await project.update(updatedData);

      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(cache.del).toHaveBeenCalledWith('projects:1');
      expect(cache.del).toHaveBeenCalledWith('projects:user:1');
      expect(updatedProject.name).toBe('New Name');
    });
  });

  describe('delete', () => {
    it('should delete a project and return true', async () => {
      const project = new Project({ id: 1, userId: 1, name: 'Test Project' });
      pool.query.mockResolvedValue();

      const result = await project.delete();

      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(cache.del).toHaveBeenCalledWith('projects:1');
      expect(cache.del).toHaveBeenCalledWith('projects:user:1');
      expect(result).toBe(true);
    });
  });
});
