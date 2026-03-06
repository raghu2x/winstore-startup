// Allow tests to inject a mock binding
let binding = global.__WINSTORE_STARTUP_MOCK_BINDING__;

if (!binding) {
  try {
    binding = require('../build/Release/winstore_startup.node');
  } catch (e) {
    // Fallback for development or non-Windows platforms
    binding = {
      enable: () => Promise.reject(new Error('Not supported on this platform')),
      disable: () => Promise.reject(new Error('Not supported on this platform')),
      getState: () => Promise.reject(new Error('Not supported on this platform')),
      getForCurrentPackage: () => Promise.resolve([]),
    };
  }
}

module.exports = binding;
