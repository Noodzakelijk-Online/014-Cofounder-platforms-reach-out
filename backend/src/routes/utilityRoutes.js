const express = require('express');
const { previewSpintax } = require('../controllers/utilityController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// This could be protected if only logged-in users should access it
router.post('/preview-spintax', protect, previewSpintax);

module.exports = router;
