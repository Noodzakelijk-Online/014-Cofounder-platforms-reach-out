const express = require('express');
const {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getProjectStats,
} = require('../controllers/projectController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/').get(protect, getProjects).post(protect, createProject);
router
  .route('/:id')
  .get(protect, getProjectById)
  .put(protect, updateProject)
  .delete(protect, deleteProject);

router.route('/:id/stats').get(protect, getProjectStats);

// Nested routes for follow-up templates
const followUpTemplateRouter = require('./followUpTemplateRoutes');
router.use('/:projectId/follow-up-templates', followUpTemplateRouter);

module.exports = router;
