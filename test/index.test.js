import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';

// Create mock binding once at module level
const mockBinding = {
  enable: vi.fn(),
  disable: vi.fn(),
  getState: vi.fn(),
  getForCurrentPackage: vi.fn(),
};

// Set the global mock BEFORE any imports
global.__WINSTORE_STARTUP_MOCK_BINDING__ = mockBinding;

// Now import the module (will use our mock)
let startup;

beforeAll(async () => {
  startup = await import('../index.js');
});

beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks();
  // Set default return value for getForCurrentPackage
  mockBinding.getForCurrentPackage.mockResolvedValue([]);
});

describe('winstore-startup', () => {
  describe('StartupTaskState', () => {
    it('should export correct state values', () => {
      expect(startup.StartupTaskState).toEqual({
        Disabled: 0,
        DisabledByUser: 1,
        Enabled: 2,
        DisabledByPolicy: 3,
        EnabledByPolicy: 4,
      });
    });
  });

  describe('exports', () => {
    it('should export all expected functions', () => {
      expect(typeof startup.enable).toBe('function');
      expect(typeof startup.disable).toBe('function');
      expect(typeof startup.getState).toBe('function');
      expect(typeof startup.getForCurrentPackage).toBe('function');
    });
  });

  describe('getForCurrentPackage', () => {
    it('should return tasks from binding', async () => {
      const mockTasks = [
        { taskId: 'task1', state: 2 },
        { taskId: 'task2', state: 0 },
      ];
      mockBinding.getForCurrentPackage.mockResolvedValue(mockTasks);

      const result = await startup.getForCurrentPackage();

      expect(result).toEqual(mockTasks);
      expect(mockBinding.getForCurrentPackage).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no tasks exist', async () => {
      mockBinding.getForCurrentPackage.mockResolvedValue([]);

      const result = await startup.getForCurrentPackage();

      expect(result).toEqual([]);
    });
  });

  describe('enable', () => {
    it('should enable task with provided taskId', async () => {
      mockBinding.enable.mockResolvedValue(2);

      const result = await startup.enable('my-task');

      expect(result).toBe(2);
      expect(mockBinding.enable).toHaveBeenCalledWith('my-task');
    });

    it('should use first task when taskId not provided', async () => {
      mockBinding.getForCurrentPackage.mockResolvedValue([
        { taskId: 'first-task', state: 0 },
        { taskId: 'second-task', state: 0 },
      ]);
      mockBinding.enable.mockResolvedValue(2);

      const result = await startup.enable();

      expect(result).toBe(2);
      expect(mockBinding.enable).toHaveBeenCalledWith('first-task');
    });

    it('should throw when no taskId provided and no tasks exist', async () => {
      mockBinding.getForCurrentPackage.mockResolvedValue([]);

      await expect(startup.enable()).rejects.toThrow(
        'No startup task found. Ensure your app manifest includes a startup task declaration.',
      );
    });
  });

  describe('disable', () => {
    it('should disable task with provided taskId', async () => {
      mockBinding.disable.mockResolvedValue(undefined);

      await startup.disable('my-task');

      expect(mockBinding.disable).toHaveBeenCalledWith('my-task');
    });

    it('should use first task when taskId not provided', async () => {
      mockBinding.getForCurrentPackage.mockResolvedValue([
        { taskId: 'first-task', state: 2 },
      ]);
      mockBinding.disable.mockResolvedValue(undefined);

      await startup.disable();

      expect(mockBinding.disable).toHaveBeenCalledWith('first-task');
    });

    it('should throw when no taskId provided and no tasks exist', async () => {
      mockBinding.getForCurrentPackage.mockResolvedValue([]);

      await expect(startup.disable()).rejects.toThrow(
        'No startup task found. Ensure your app manifest includes a startup task declaration.',
      );
    });
  });

  describe('getState', () => {
    it('should get state with provided taskId', async () => {
      mockBinding.getState.mockResolvedValue(2);

      const result = await startup.getState('my-task');

      expect(result).toBe(2);
      expect(mockBinding.getState).toHaveBeenCalledWith('my-task');
    });

    it('should use first task when taskId not provided', async () => {
      mockBinding.getForCurrentPackage.mockResolvedValue([
        { taskId: 'first-task', state: 1 },
      ]);
      mockBinding.getState.mockResolvedValue(1);

      const result = await startup.getState();

      expect(result).toBe(1);
      expect(mockBinding.getState).toHaveBeenCalledWith('first-task');
    });

    it('should throw when no taskId provided and no tasks exist', async () => {
      mockBinding.getForCurrentPackage.mockResolvedValue([]);

      await expect(startup.getState()).rejects.toThrow(
        'No startup task found. Ensure your app manifest includes a startup task declaration.',
      );
    });

    it('should return all state types correctly', async () => {
      mockBinding.getState
        .mockResolvedValueOnce(0) // Disabled
        .mockResolvedValueOnce(1) // DisabledByUser
        .mockResolvedValueOnce(2) // Enabled
        .mockResolvedValueOnce(3) // DisabledByPolicy
        .mockResolvedValueOnce(4); // EnabledByPolicy

      expect(await startup.getState('t1')).toBe(0);
      expect(await startup.getState('t2')).toBe(1);
      expect(await startup.getState('t3')).toBe(2);
      expect(await startup.getState('t4')).toBe(3);
      expect(await startup.getState('t5')).toBe(4);
    });
  });

  describe('fallback behavior (simulated)', () => {
    it('should handle platform error from binding', async () => {
      mockBinding.enable.mockRejectedValue(
        new Error('Not supported on this platform'),
      );
      mockBinding.disable.mockRejectedValue(
        new Error('Not supported on this platform'),
      );
      mockBinding.getState.mockRejectedValue(
        new Error('Not supported on this platform'),
      );

      await expect(startup.enable('task')).rejects.toThrow(
        'Not supported on this platform',
      );
      await expect(startup.disable('task')).rejects.toThrow(
        'Not supported on this platform',
      );
      await expect(startup.getState('task')).rejects.toThrow(
        'Not supported on this platform',
      );
    });

    it('should return empty array for getForCurrentPackage on unsupported platform', async () => {
      mockBinding.getForCurrentPackage.mockResolvedValue([]);

      const result = await startup.getForCurrentPackage();
      expect(result).toEqual([]);
    });
  });
});
