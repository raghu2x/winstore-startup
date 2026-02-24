const path = require('path');

let binding;

try {
  binding = require('./build/Release/winstore_startup.node');
} catch (e) {
  // Fallback for development or non-Windows platforms
  binding = {
    enable: () => -1,
    disable: () => {},
    getState: () => -1,
    getForCurrentPackage: () => []
  };
}

/**
 * Startup task states
 */
const StartupTaskState = {
  Disabled: 0,
  DisabledByUser: 1,
  Enabled: 2,
  DisabledByPolicy: 3,
  EnabledByPolicy: 4
};

/**
 * Get the first task ID from the current package
 * @returns {string|null}
 */
function getFirstTaskId() {
  const tasks = binding.getForCurrentPackage();
  return tasks.length > 0 ? tasks[0].taskId : null;
}

/**
 * Enable a startup task
 * @param {string} [taskId] - The startup task ID (optional, uses first task if not provided)
 * @returns {number} The resulting state
 */
function enable(taskId) {
  const id = taskId || getFirstTaskId();
  if (!id) {
    return -1;
  }
  return binding.enable(id);
}

/**
 * Disable a startup task
 * @param {string} [taskId] - The startup task ID (optional, uses first task if not provided)
 */
function disable(taskId) {
  const id = taskId || getFirstTaskId();
  if (!id) {
    return;
  }
  return binding.disable(id);
}

/**
 * Get state of a startup task
 * @param {string} [taskId] - The startup task ID (optional, uses first task if not provided)
 * @returns {number} The current state
 */
function getState(taskId) {
  const id = taskId || getFirstTaskId();
  if (!id) {
    return -1;
  }
  return binding.getState(id);
}

module.exports = {
  enable,
  disable,
  getState,
  StartupTaskState
};
