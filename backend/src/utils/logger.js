const pino = require('pino');

// Configure the logger
const logger = pino({
  level: process.env.LOG_LEVEL || 'info', // Default to 'info', can be 'debug', 'warn', 'error', etc.
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  timestamp: () => `,"time":"${new Date().toISOString()}"`,
});

module.exports = logger;
