# winstore-startup

A Node.js native addon for managing Windows Store/UWP application startup tasks. This library provides programmatic control over whether your application automatically launches when Windows starts.

## Features

- Enable/disable startup tasks for Windows Store apps
- Query current startup task state
- Optional task ID (automatically uses first task if not specified)
- TypeScript support with full type definitions
- Graceful fallbacks on non-Windows platforms

## Requirements

- **OS:** Windows only
- **Node.js:** >= 18.0.0
- **Architecture:** x64 or arm64

## Installation

```bash
npm install winstore-startup
```

The native addon is automatically compiled during installation.

## Usage

### Basic Example

```javascript
const { enable, disable, getState } = require('winstore-startup');

// Enable auto-launch (uses first startup task automatically)
enable();

// Check current state
const state = getState();
console.log(state); // 2 = Enabled

// Disable auto-launch
disable();
```

### With Specific Task ID

```javascript
const { enable, disable, getState } = require('winstore-startup');

// Enable a specific task
enable('MyTaskId');

// Get state of a specific task
const state = getState('MyTaskId');

// Disable a specific task
disable('MyTaskId');
```

### TypeScript

```typescript
import { enable, disable, getState, StartupTaskState } from 'winstore-startup';

// Enable startup (uses first task if no ID provided)
const result = enable();
if (result === StartupTaskState.Enabled) {
  console.log('Startup enabled');
}

// With specific task ID
enable('myTaskId');
```

## API Reference

### Functions

| Function | Description | Returns |
|----------|-------------|---------|
| `enable(taskId?)` | Enable a startup task | `StartupTaskState` |
| `disable(taskId?)` | Disable a startup task | `void` |
| `getState(taskId?)` | Get the current state of a task | `StartupTaskState` |

All functions accept an optional `taskId` parameter. If not provided, the first startup task from the current package is used automatically.

### StartupTaskState Enum

| Value | Name | Description |
|-------|------|-------------|
| 0 | `Disabled` | Task is disabled |
| 1 | `DisabledByUser` | Task was disabled by the user |
| 2 | `Enabled` | Task is enabled |
| 3 | `DisabledByPolicy` | Task is disabled by system policy |
| 4 | `EnabledByPolicy` | Task is enabled by system policy |

## How It Works

This library uses the Windows Runtime (WinRT) `StartupTask` API to manage application startup behavior. It compiles a native C++ addon using Node-API that bridges JavaScript to the Windows APIs.

On non-Windows platforms, the library provides stub implementations that return safe default values.

## Scripts

```bash
npm run build    # Rebuild the native addon
npm run clean    # Clean build artifacts
```

## License

ISC
