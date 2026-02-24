// startup_task.cpp - WinRT-based startup task addon for Windows Store apps
#include <napi.h>

#ifdef _WIN32
#include <winrt/Windows.ApplicationModel.h>
#include <winrt/Windows.Foundation.h>
#include <winrt/Windows.Foundation.Collections.h>

using namespace winrt;
using namespace Windows::ApplicationModel;
using namespace Windows::Foundation;

// Startup task states (matches Windows.ApplicationModel.StartupTaskState)
// 0 = Disabled, 1 = DisabledByUser, 2 = Enabled, 3 = DisabledByPolicy, 4 = EnabledByPolicy

Napi::Value Enable(const Napi::CallbackInfo& info) {
  auto env = info.Env();

  try {
    if (info.Length() < 1 || !info[0].IsString()) {
      Napi::TypeError::New(env, "Task ID string expected").ThrowAsJavaScriptException();
      return env.Undefined();
    }

    std::string taskId = info[0].As<Napi::String>().Utf8Value();
    auto task = StartupTask::GetAsync(winrt::to_hstring(taskId)).get();
    auto state = task.RequestEnableAsync().get();

    return Napi::Number::New(env, static_cast<int>(state));
  } catch (const winrt::hresult_error& e) {
    Napi::Error::New(env, winrt::to_string(e.message())).ThrowAsJavaScriptException();
    return env.Undefined();
  }
}

Napi::Value Disable(const Napi::CallbackInfo& info) {
  auto env = info.Env();

  try {
    if (info.Length() < 1 || !info[0].IsString()) {
      Napi::TypeError::New(env, "Task ID string expected").ThrowAsJavaScriptException();
      return env.Undefined();
    }

    std::string taskId = info[0].As<Napi::String>().Utf8Value();
    auto task = StartupTask::GetAsync(winrt::to_hstring(taskId)).get();
    task.Disable();

    return env.Undefined();
  } catch (const winrt::hresult_error& e) {
    Napi::Error::New(env, winrt::to_string(e.message())).ThrowAsJavaScriptException();
    return env.Undefined();
  }
}

Napi::Value GetState(const Napi::CallbackInfo& info) {
  auto env = info.Env();

  try {
    if (info.Length() < 1 || !info[0].IsString()) {
      Napi::TypeError::New(env, "Task ID string expected").ThrowAsJavaScriptException();
      return env.Undefined();
    }

    std::string taskId = info[0].As<Napi::String>().Utf8Value();
    auto task = StartupTask::GetAsync(winrt::to_hstring(taskId)).get();

    return Napi::Number::New(env, static_cast<int>(task.State()));
  } catch (const winrt::hresult_error& e) {
    Napi::Error::New(env, winrt::to_string(e.message())).ThrowAsJavaScriptException();
    return env.Undefined();
  }
}

Napi::Value GetForCurrentPackage(const Napi::CallbackInfo& info) {
  auto env = info.Env();

  try {
    auto tasks = StartupTask::GetForCurrentPackageAsync().get();
    auto arr = Napi::Array::New(env, tasks.Size());

    uint32_t i = 0;
    for (auto const& task : tasks) {
      auto obj = Napi::Object::New(env);
      obj.Set("taskId", Napi::String::New(env, winrt::to_string(task.TaskId())));
      obj.Set("state", Napi::Number::New(env, static_cast<int>(task.State())));
      arr[i++] = obj;
    }

    return arr;
  } catch (const winrt::hresult_error& e) {
    Napi::Error::New(env, winrt::to_string(e.message())).ThrowAsJavaScriptException();
    return env.Undefined();
  }
}

#else
// Non-Windows stubs
Napi::Value Enable(const Napi::CallbackInfo& info) {
  return info.Env().Undefined();
}
Napi::Value Disable(const Napi::CallbackInfo& info) {
  return info.Env().Undefined();
}
Napi::Value GetState(const Napi::CallbackInfo& info) {
  return Napi::Number::New(info.Env(), -1);
}
Napi::Value GetForCurrentPackage(const Napi::CallbackInfo& info) {
  return Napi::Array::New(info.Env(), 0);
}
#endif

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set("enable", Napi::Function::New(env, Enable));
  exports.Set("disable", Napi::Function::New(env, Disable));
  exports.Set("getState", Napi::Function::New(env, GetState));
  exports.Set("getForCurrentPackage", Napi::Function::New(env, GetForCurrentPackage));
  return exports;
}

NODE_API_MODULE(winstore_startup, Init)
