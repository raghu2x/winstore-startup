const binding = require('./lib/binding.js');

/**
 * Startup task states
 */
const StartupTaskState = {
  Disabled: 0,
  DisabledByUser: 1,
  Enabled: 2,
  DisabledByPolicy: 3,
  EnabledByPolicy: 4,
};

/**
 * Get the first task ID from the current package
 * @returns {Promise<string|null>}
 */
async function getFirstTaskId() {
  const tasks = await binding.getForCurrentPackage();
  return tasks.length > 0 ? tasks[0].taskId : null;
}

/**
 * Enable a startup task
 * @param {string} [taskId] - The startup task ID (optional, uses first task if not provided)
 * @returns {Promise<number>} The resulting state
 * @throws {Error} If no startup task is found or operation fails
 */
async function enable(taskId) {
  const id = taskId || (await getFirstTaskId());
  if (!id) {
    throw new Error('No startup task found. Ensure your app manifest includes a startup task declaration.');
  }
  return binding.enable(id);
}

/**
 * Disable a startup task
 * @param {string} [taskId] - The startup task ID (optional, uses first task if not provided)
 * @returns {Promise<void>}
 * @throws {Error} If no startup task is found or operation fails
 */
async function disable(taskId) {
  const id = taskId || (await getFirstTaskId());
  if (!id) {
    throw new Error('No startup task found. Ensure your app manifest includes a startup task declaration.');
  }
  return binding.disable(id);
}

/**
 * Get state of a startup task
 * @param {string} [taskId] - The startup task ID (optional, uses first task if not provided)
 * @returns {Promise<number>} The current state
 * @throws {Error} If no startup task is found or operation fails
 */
async function getState(taskId) {
  const id = taskId || (await getFirstTaskId());
  if (!id) {
    throw new Error('No startup task found. Ensure your app manifest includes a startup task declaration.');
  }
  return binding.getState(id);
}

/**
 * Get all startup tasks for the current package
 * @returns {Promise<Array<{taskId: string, state: number}>>}
 */
async function getForCurrentPackage() {
  return binding.getForCurrentPackage();
}

module.exports = {
  enable,
  disable,
  getState,
  getForCurrentPackage,
  StartupTaskState,
};
