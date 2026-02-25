export enum StartupTaskState {
  Disabled = 0,
  DisabledByUser = 1,
  Enabled = 2,
  DisabledByPolicy = 3,
  EnabledByPolicy = 4
}

export interface StartupTaskInfo {
  taskId: string;
  state: StartupTaskState;
}

/**
 * Enable a startup task
 * @param taskId - The startup task ID (optional, uses first task if not provided)
 * @returns The resulting state
 * @throws {Error} If no startup task is found or operation fails
 */
export function enable(taskId?: string): Promise<StartupTaskState>;

/**
 * Disable a startup task
 * @param taskId - The startup task ID (optional, uses first task if not provided)
 * @throws {Error} If no startup task is found or operation fails
 */
export function disable(taskId?: string): Promise<void>;

/**
 * Get state of a startup task
 * @param taskId - The startup task ID (optional, uses first task if not provided)
 * @returns The current state
 * @throws {Error} If no startup task is found or operation fails
 */
export function getState(taskId?: string): Promise<StartupTaskState>;

/**
 * Get all startup tasks for the current package
 * @returns Array of startup task information
 */
export function getForCurrentPackage(): Promise<StartupTaskInfo[]>;
