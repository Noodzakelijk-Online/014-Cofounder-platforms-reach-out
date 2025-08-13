// This is a mock implementation of the scheduler for testing purposes.

const scheduler = {
  scheduleFollowUp: () => {
    throw new Error('This is a mock scheduler. You should not be calling this directly in tests.');
  },
  cancelFollowUp: () => {
    throw new Error('This is a mock scheduler. You should not be calling this directly in tests.');
  },
};

module.exports = scheduler;
