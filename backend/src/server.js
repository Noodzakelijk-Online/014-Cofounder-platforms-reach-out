const express = require('express');
const logger = require('./utils/logger');

const app = express();

// Middleware
app.use(express.json()); // for parsing application/json

// A simple root route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// API Routes
const userRoutes = require('./routes/userRoutes');
const projectRoutes = require('./routes/projectRoutes');
const utilityRoutes = require('./routes/utilityRoutes');

app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/utils', utilityRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});

module.exports = app; // Export for testing
