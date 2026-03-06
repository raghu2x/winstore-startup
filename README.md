# winstore-startup

A Node.js native addon for managing Windows Store/UWP application startup tasks. This library provides programmatic control over whether your application automatically launches when Windows starts.

## Features

- Enable/disable startup tasks for Windows Store apps
- Query current startup task state
- Non-blocking async API (Promise-based)
- Optional task ID (automatically uses first task if not specified)
- TypeScript support with full type definitions
- Graceful error handling with descriptive messages

## Requirements

- **OS:** Windows only
- **Node.js:** >= 20.0.0
- **Architecture:** x64 or arm64

## Installation

```bash
npm install winstore-startup
```

The native addon is automatically compiled during installation.

## Setup

Before using this library, you must declare a startup task in your `AppxManifest.xml`. The library only manages existing startup tasks - it doesn't create them.

### AppxManifest.xml Configuration

Add the `desktop` namespace to your Package element:

```xml
<Package
  xmlns="http://schemas.microsoft.com/appx/manifest/foundation/windows10"
  xmlns:desktop="http://schemas.microsoft.com/appx/manifest/desktop/windows10"
  ...>
```

Then add the startup task extension inside your Application element:

```xml
<Applications>
  <Application Id="MyApp" Executable="app\MyApp.exe" EntryPoint="Windows.FullTrustApplication">
    ...
    <Extensions>
      <desktop:Extension
        Category="windows.startupTask"
        Executable="app\MyApp.exe"
        EntryPoint="Windows.FullTrustApplication">
        <desktop:StartupTask TaskId="MyStartupTask" Enabled="false" DisplayName="My App" />
      </desktop:Extension>
    </Extensions>
  </Application>
</Applications>
```

**Note:** The `TaskId` is what you pass to `enable('MyStartupTask')`. If you only have one task, you can call `enable()` without arguments and it will auto-select it.

## Usage

### Basic Example

```javascript
const { enable, disable, getState } = require('winstore-startup');

async function manageStartup() {
  try {
    // Enable auto-launch (uses first startup task automatically)
    await enable();

    // Check current state
    const state = await getState();
    console.log(state); // 2 = Enabled

    // Disable auto-launch
    await disable();
  } catch (error) {
    console.error('Failed to manage startup:', error.message);
  }
}

manageStartup();
```

### With Specific Task ID

```javascript
const { enable, disable, getState } = require('winstore-startup');

async function manageSpecificTask() {
  // Enable a specific task
  await enable('MyTaskId');

  // Get state of a specific task
  const state = await getState('MyTaskId');

  // Disable a specific task
  await disable('MyTaskId');
}
```

### List All Startup Tasks

```javascript
const { getForCurrentPackage, StartupTaskState } = require('winstore-startup');

async function listTasks() {
  const tasks = await getForCurrentPackage();

  for (const task of tasks) {
    console.log(`Task: ${task.taskId}, State: ${task.state}`);
  }
}
```

### TypeScript

```typescript
import {
  enable,
  disable,
  getState,
  getForCurrentPackage,
  StartupTaskState,
} from 'winstore-startup';

async function manageStartup(): Promise<void> {
  try {
    // Enable startup (uses first task if no ID provided)
    const result = await enable();
    if (result === StartupTaskState.Enabled) {
      console.log('Startup enabled');
    }

    // With specific task ID
    await enable('myTaskId');

    // Get all tasks
    const tasks = await getForCurrentPackage();
    console.log(tasks);
  } catch (error) {
    console.error('Operation failed:', error);
  }
}
```

## API Reference

### Functions

| Function                 | Description                       | Returns                      |
| ------------------------ | --------------------------------- | ---------------------------- |
| `enable(taskId?)`        | Enable a startup task             | `Promise<StartupTaskState>`  |
| `disable(taskId?)`       | Disable a startup task            | `Promise<void>`              |
| `getState(taskId?)`      | Get the current state of a task   | `Promise<StartupTaskState>`  |
| `getForCurrentPackage()` | Get all startup tasks for the app | `Promise<StartupTaskInfo[]>` |

All functions return Promises and accept an optional `taskId` parameter (except `getForCurrentPackage`). If `taskId` is not provided, the first startup task from the current package is used automatically.

### StartupTaskState Enum

| Value | Name               | Description                       |
| ----- | ------------------ | --------------------------------- |
| 0     | `Disabled`         | Task is disabled                  |
| 1     | `DisabledByUser`   | Task was disabled by the user     |
| 2     | `Enabled`          | Task is enabled                   |
| 3     | `DisabledByPolicy` | Task is disabled by system policy |
| 4     | `EnabledByPolicy`  | Task is enabled by system policy  |

### StartupTaskInfo Interface

```typescript
interface StartupTaskInfo {
  taskId: string;
  state: StartupTaskState;
}
```

### Error Handling

All functions throw errors with descriptive messages when:

- No startup task is found in the app manifest
- The specified task ID doesn't exist
- The operation fails at the Windows API level
- Running on a non-Windows platform

```javascript
try {
  await enable();
} catch (error) {
  // Handle error - e.g., "No startup task found. Ensure your app manifest includes a startup task declaration."
  console.error(error.message);
}
```

## How It Works

This library uses the Windows Runtime (WinRT) `StartupTask` API to manage application startup behavior. It compiles a native C++ addon using Node-API that bridges JavaScript to the Windows APIs.

All operations are non-blocking - they run on a separate thread and return Promises, ensuring your Node.js event loop stays responsive.

On non-Windows platforms, the functions reject with an error message indicating the platform is not supported.

## Scripts

```bash
npm run build    # Rebuild the native addon
npm run clean    # Clean build artifacts
```

## License

MIT
