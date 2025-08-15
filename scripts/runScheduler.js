const MessageScheduler = require('../backend/src/services/MessageScheduler');
const logger = require('../backend/src/utils/logger');

async function run() {
  logger.info('Running message scheduler...');
  try {
    await MessageScheduler.run();
    logger.info('Message scheduler finished successfully.');
  } catch (error) {
    logger.error({ err: error }, 'Error running message scheduler');
    process.exit(1);
  }
  process.exit(0);
}

run();
