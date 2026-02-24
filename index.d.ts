export enum StartupTaskState {
  Disabled = 0,
  DisabledByUser = 1,
  Enabled = 2,
  DisabledByPolicy = 3,
  EnabledByPolicy = 4
}

/**
 * Enable a startup task
 * @param taskId - The startup task ID (optional, uses first task if not provided)
 * @returns The resulting state
 */
export function enable(taskId?: string): StartupTaskState;

/**
 * Disable a startup task
 * @param taskId - The startup task ID (optional, uses first task if not provided)
 */
export function disable(taskId?: string): void;

/**
 * Get state of a startup task
 * @param taskId - The startup task ID (optional, uses first task if not provided)
 * @returns The current state
 */
export function getState(taskId?: string): StartupTaskState;
