const express = require('express');
const {
  getFollowUpTemplatesForProject,
  createFollowUpTemplate,
  updateFollowUpTemplate,
  deleteFollowUpTemplate,
} = require('../controllers/followUpTemplateController');
const { protect } = require('../middleware/authMiddleware');

// Note: This router will be mounted under /api/projects/:projectId/follow-up-templates
// And also separately for individual template management.
// This requires some clever routing in server.js

const router = express.Router({ mergeParams: true }); // mergeParams allows us to get :projectId

router
  .route('/')
  .get(protect, getFollowUpTemplatesForProject)
  .post(protect, createFollowUpTemplate);

// These routes would be on a separate router mounted at /api/follow-up-templates
// router.route('/:id').put(protect, updateFollowUpTemplate).delete(protect, deleteFollowUpTemplate);

module.exports = router;
