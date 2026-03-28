# winstore-startup

A Node.js native addon for managing Windows Store (MSIX) startup tasks in Electron apps. This library provides programmatic control over whether your application automatically launches when Windows starts.

> **Note:** This library only works for apps distributed via Microsoft Store or packaged as MSIX/AppX. It uses the WinRT `StartupTask` API which is not available to traditional Win32 apps.

## Features

- Enable/disable startup tasks for Windows Store (MSIX) apps
- Query current startup task state
- Non-blocking async API (Promise-based)
- Optional task ID (automatically uses first task if not specified)
- TypeScript support with full type definitions
- Prebuilt binaries for x64 and arm64 (no compile step needed)
- Graceful error handling with descriptive messages

## Requirements

- **OS:** Windows only
- **Node.js:** >= 20.0.0
- **Architecture:** x64 or arm64
- **Packaging:** App must be packaged as MSIX/AppX (e.g., via Microsoft Store, electron-builder, or MSIX Packaging Tool)

## Installation

```bash
npm install winstore-startup
```

Prebuilt binaries are included for x64 and arm64. A compile step is only needed if no matching prebuild is found (requires node-gyp and MSVC build tools).

## Setup

### 1. Declare the Startup Task in AppxManifest.xml

Before using this library, you must declare a startup task in your `AppxManifest.xml`. The library only manages existing startup tasks — it cannot create them.

Add the `desktop` namespace to your `Package` element:

```xml
<Package
  xmlns="http://schemas.microsoft.com/appx/manifest/foundation/windows10"
  xmlns:desktop="http://schemas.microsoft.com/appx/manifest/desktop/windows10"
  ...>
```

Then add the startup task extension inside your `Application` element:

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

**Important:** Set `Enabled="false"` in the manifest. The user or your app controls the actual state at runtime via this library. The `TaskId` value is what you pass to `enable('MyStartupTask')`.

### 2. electron-builder Configuration

If you use electron-builder, set the `appx.additionalManifestProperties` or provide a custom manifest template. Ensure `runFullTrust` capability is declared:

```json
{
  "appx": {
    "applicationId": "MyApp",
    "displayName": "My App",
    "identityName": "Publisher.MyApp",
    "capabilities": "runFullTrust"
  }
}
```

electron-builder generates the `AppxManifest.xml` during packaging. You can provide a custom manifest template via the `appx.customManifestTemplate` option to inject the startup task extension shown above.

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
  await enable('MyStartupTask');

  const state = await getState('MyStartupTask');

  await disable('MyStartupTask');
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

### Typical Electron Integration

A common pattern is to show a "Start with Windows" toggle in your app's settings:

```javascript
const { enable, disable, getState, StartupTaskState } = require('winstore-startup');

// Get current state to reflect in UI
async function getStartupEnabled() {
  const state = await getState();
  return state === StartupTaskState.Enabled || state === StartupTaskState.EnabledByPolicy;
}

// Toggle based on user action
async function setStartupEnabled(enabled) {
  if (enabled) {
    const resultState = await enable();
    // Note: enable() may return DisabledByUser if user previously denied it
    return resultState === StartupTaskState.Enabled;
  } else {
    await disable();
    return false;
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
    const result = await enable();
    if (result === StartupTaskState.Enabled) {
      console.log('Startup enabled');
    } else if (result === StartupTaskState.DisabledByUser) {
      console.log('User has previously disabled startup — cannot re-enable programmatically');
    }

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

All functions are async (Promise-based) and accept an optional `taskId`. If `taskId` is omitted, the first startup task from the current package is used automatically.

### StartupTaskState Enum

| Value | Name               | Description                                                          |
| ----- | ------------------ | -------------------------------------------------------------------- |
| 0     | `Disabled`         | Task is disabled                                                     |
| 1     | `DisabledByUser`   | User disabled it via Task Manager — `enable()` cannot override this  |
| 2     | `Enabled`          | Task is enabled                                                      |
| 3     | `DisabledByPolicy` | Disabled by system/group policy — cannot be changed programmatically |
| 4     | `EnabledByPolicy`  | Enabled by system/group policy — cannot be changed programmatically  |

> **Important:** `enable()` returns the resulting state, not a boolean. If the result is `DisabledByUser` or `DisabledByPolicy`, the task was **not** enabled. Always check the returned state.

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
- Running on a non-Windows platform or outside an MSIX package

```javascript
try {
  await enable();
} catch (error) {
  // e.g., "No startup task found. Ensure your app manifest includes a startup task declaration."
  console.error(error.message);
}
```

## How It Works

This library uses the Windows Runtime (WinRT) `Windows.ApplicationModel.StartupTask` API. It compiles a native C++ addon via Node-API (N-API) that bridges JavaScript to WinRT.

All operations run on a worker thread and return Promises — the Node.js event loop is never blocked.

The addon is loaded via `node-gyp-build`, which automatically selects a prebuilt binary when available, or falls back to a locally compiled build from `./build/Release/`.

On non-Windows platforms, all functions reject with a platform error (except `getForCurrentPackage` which resolves to an empty array).

## Scripts

```bash
npm run build          # Rebuild the native addon from source
npm run prebuild       # Build prebuilt binary for current arch
npm run prebuild:all   # Build prebuilt binaries for x64 and arm64
npm run clean          # Clean build artifacts and node_modules
npm test               # Run tests
```

## License

MIT
