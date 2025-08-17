const { spin } = require('../utils/spintax');
const logger = require('../utils/logger');

// @desc    Get randomized previews of a spintax string
// @route   POST /api/utils/preview-spintax
// @access  Public (or Private, depending on requirements)
async function previewSpintax(req, res) {
  const { text, count = 5 } = req.body;

  if (!text) {
    return res.status(400).json({ message: 'Text to spin is required.' });
  }

  try {
    const previews = [];
    for (let i = 0; i < count; i++) {
      previews.push(spin(text));
    }
    res.json({ previews });
  } catch (error) {
    logger.error({ err: error, spintaxText: text }, 'Error generating spintax previews');
    res.status(500).json({ message: 'Server Error' });
  }
}

module.exports = {
  previewSpintax,
};
