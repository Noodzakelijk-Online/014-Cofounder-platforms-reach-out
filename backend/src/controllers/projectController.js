const Project = require('../models/Project');
const logger = require('../utils/logger');

// @desc    Get all projects for a user
// @route   GET /api/projects
// @access  Private
async function getProjects(req, res) {
  try {
    const projects = await Project.findByUserId(req.user.id);
    res.json(projects);
  } catch (error) {
    logger.error({ err: error, userId: req.user.id }, 'Error getting projects');
    res.status(500).json({ message: 'Server Error' });
  }
}

// @desc    Get a single project by ID
// @route   GET /api/projects/:id
// @access  Private
async function getProjectById(req, res) {
  try {
    const project = await Project.findById(req.params.id);
    if (project && project.userId === req.user.id) {
      res.json(project);
    } else {
      res.status(404).json({ message: 'Project not found' });
    }
  } catch (error) {
    logger.error({ err: error, projectId: req.params.id }, 'Error getting project by ID');
    res.status(500).json({ message: 'Server Error' });
  }
}

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private
async function createProject(req, res) {
  const { name, messageInterval, intervalUnit } = req.body;
  try {
    const project = await Project.create({
      userId: req.user.id,
      name,
      messageInterval,
      intervalUnit,
    });
    res.status(201).json(project);
  } catch (error) {
    logger.error({ err: error, userId: req.user.id }, 'Error creating project');
    res.status(500).json({ message: 'Server Error' });
  }
}

// @desc    Update a project
// @route   PUT /api/projects/:id
// @access  Private
async function updateProject(req, res) {
  try {
    const project = await Project.findById(req.params.id);
    if (project && project.userId === req.user.id) {
      const updatedProject = await project.update(req.body);
      res.json(updatedProject);
    } else {
      res.status(404).json({ message: 'Project not found' });
    }
  } catch (error) {
    logger.error({ err: error, projectId: req.params.id }, 'Error updating project');
    res.status(500).json({ message: 'Server Error' });
  }
}

// @desc    Delete a project
// @route   DELETE /api/projects/:id
// @access  Private
async function deleteProject(req, res) {
  try {
    const project = await Project.findById(req.params.id);
    if (project && project.userId === req.user.id) {
      await project.delete();
      res.json({ message: 'Project removed' });
    } else {
      res.status(404).json({ message: 'Project not found' });
    }
  } catch (error) {
    logger.error({ err: error, projectId: req.params.id }, 'Error deleting project');
    res.status(500).json({ message: 'Server Error' });
  }
}

// @desc    Get stats for a project
// @route   GET /api/projects/:id/stats
// @access  Private
async function getProjectStats(req, res) {
  try {
    const project = await Project.findById(req.params.id);
    if (project && project.userId === req.user.id) {
      const responseRate = project.messagesSentCount > 0
        ? (project.responsesReceivedCount / project.messagesSentCount) * 100
        : 0;
      res.json({
        messagesSentCount: project.messagesSentCount,
        responsesReceivedCount: project.responsesReceivedCount,
        responseRate: responseRate.toFixed(2),
      });
    } else {
      res.status(404).json({ message: 'Project not found' });
    }
  } catch (error) {
    logger.error({ err: error, projectId: req.params.id }, 'Error getting project stats');
    res.status(500).json({ message: 'Server Error' });
  }
}

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getProjectStats,
};
