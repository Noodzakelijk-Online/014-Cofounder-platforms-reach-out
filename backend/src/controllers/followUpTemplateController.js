const FollowUpTemplate = require('../models/FollowUpTemplate');
const Project = require('../models/Project');
const logger = require('../utils/logger');

// @desc    Get all follow-up templates for a project
// @route   GET /api/projects/:projectId/follow-up-templates
// @access  Private
async function getFollowUpTemplatesForProject(req, res) {
  const { projectId } = req.params;
  try {
    // First, verify the user owns the project
    const project = await Project.findById(projectId);
    if (!project || project.userId !== req.user.id) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const templates = await FollowUpTemplate.findByProjectId(projectId);
    res.json(templates);
  } catch (error) {
    logger.error({ err: error, projectId }, 'Error getting follow-up templates');
    res.status(500).json({ message: 'Server Error' });
  }
}

// @desc    Create a new follow-up template for a project
// @route   POST /api/projects/:projectId/follow-up-templates
// @access  Private
async function createFollowUpTemplate(req, res) {
  const { projectId } = req.params;
  const { sequenceOrder, delayDays, templateSubject, templateContent } = req.body;
  try {
    // Verify user owns the project
    const project = await Project.findById(projectId);
    if (!project || project.userId !== req.user.id) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const template = await FollowUpTemplate.create({
      projectId,
      sequenceOrder,
      delayDays,
      templateSubject,
      templateContent,
    });
    res.status(201).json(template);
  } catch (error) {
    logger.error({ err: error, projectId }, 'Error creating follow-up template');
    res.status(500).json({ message: 'Server Error' });
  }
}

// @desc    Update a follow-up template
// @route   PUT /api/follow-up-templates/:id
// @access  Private
async function updateFollowUpTemplate(req, res) {
  // This would require more logic to ensure the user owns the project
  // associated with this template. For now, we'll keep it simple.
  // A proper implementation would fetch the template, then its project, then check ownership.
  res.status(501).json({ message: 'Not implemented yet' });
}

// @desc    Delete a follow-up template
// @route   DELETE /api/follow-up-templates/:id
// @access  Private
async function deleteFollowUpTemplate(req, res) {
  // Similar to update, requires ownership check.
  res.status(501).json({ message: 'Not implemented yet' });
}


module.exports = {
  getFollowUpTemplatesForProject,
  createFollowUpTemplate,
  updateFollowUpTemplate,
  deleteFollowUpTemplate,
};
