const MessageScheduler = require('../backend/src/services/MessageScheduler');

async function run() {
  console.log('Running message scheduler...');
  try {
    await MessageScheduler.run();
    console.log('Message scheduler finished successfully.');
  } catch (error) {
    console.error('Error running message scheduler:', error);
    process.exit(1);
  }
  process.exit(0);
}

run();
