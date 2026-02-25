// startup_task.cpp - WinRT-based startup task addon for Windows Store apps
#include <napi.h>
#include <optional>
#include <string>

#ifdef _WIN32
#include <winrt/Windows.ApplicationModel.h>
#include <winrt/Windows.Foundation.h>
#include <winrt/Windows.Foundation.Collections.h>

using namespace winrt;
using namespace Windows::ApplicationModel;
using namespace Windows::Foundation;

// Initialize WinRT apartment on module load
struct WinRTInitializer {
  WinRTInitializer() {
    winrt::init_apartment();
  }
  ~WinRTInitializer() {
    winrt::uninit_apartment();
  }
};

static WinRTInitializer g_winrt_init;

// Startup task states (matches Windows.ApplicationModel.StartupTaskState)
// 0 = Disabled, 1 = DisabledByUser, 2 = Enabled, 3 = DisabledByPolicy, 4 = EnabledByPolicy

// Helper function to validate and extract taskId parameter
std::optional<std::string> GetTaskIdParam(const Napi::CallbackInfo& info) {
  auto env = info.Env();

  if (info.Length() < 1 || !info[0].IsString()) {
    Napi::TypeError::New(env, "Task ID string expected").ThrowAsJavaScriptException();
    return std::nullopt;
  }

  std::string taskId = info[0].As<Napi::String>().Utf8Value();
  if (taskId.empty()) {
    Napi::TypeError::New(env, "Task ID cannot be empty").ThrowAsJavaScriptException();
    return std::nullopt;
  }

  return taskId;
}

// Async worker for Enable operation
class EnableWorker : public Napi::AsyncWorker {
public:
  EnableWorker(Napi::Env env, Napi::Promise::Deferred deferred, std::string taskId)
    : Napi::AsyncWorker(env), deferred_(deferred), taskId_(taskId), state_(-1) {}

  void Execute() override {
    try {
      auto task = StartupTask::GetAsync(winrt::to_hstring(taskId_)).get();
      state_ = static_cast<int>(task.RequestEnableAsync().get());
    } catch (const winrt::hresult_error& e) {
      SetError(winrt::to_string(e.message()));
    }
  }

  void OnOK() override {
    deferred_.Resolve(Napi::Number::New(Env(), state_));
  }

  void OnError(const Napi::Error& error) override {
    deferred_.Reject(error.Value());
  }

private:
  Napi::Promise::Deferred deferred_;
  std::string taskId_;
  int state_;
};

// Async worker for Disable operation
class DisableWorker : public Napi::AsyncWorker {
public:
  DisableWorker(Napi::Env env, Napi::Promise::Deferred deferred, std::string taskId)
    : Napi::AsyncWorker(env), deferred_(deferred), taskId_(taskId) {}

  void Execute() override {
    try {
      auto task = StartupTask::GetAsync(winrt::to_hstring(taskId_)).get();
      task.Disable();
    } catch (const winrt::hresult_error& e) {
      SetError(winrt::to_string(e.message()));
    }
  }

  void OnOK() override {
    deferred_.Resolve(Env().Undefined());
  }

  void OnError(const Napi::Error& error) override {
    deferred_.Reject(error.Value());
  }

private:
  Napi::Promise::Deferred deferred_;
  std::string taskId_;
};

// Async worker for GetState operation
class GetStateWorker : public Napi::AsyncWorker {
public:
  GetStateWorker(Napi::Env env, Napi::Promise::Deferred deferred, std::string taskId)
    : Napi::AsyncWorker(env), deferred_(deferred), taskId_(taskId), state_(-1) {}

  void Execute() override {
    try {
      auto task = StartupTask::GetAsync(winrt::to_hstring(taskId_)).get();
      state_ = static_cast<int>(task.State());
    } catch (const winrt::hresult_error& e) {
      SetError(winrt::to_string(e.message()));
    }
  }

  void OnOK() override {
    deferred_.Resolve(Napi::Number::New(Env(), state_));
  }

  void OnError(const Napi::Error& error) override {
    deferred_.Reject(error.Value());
  }

private:
  Napi::Promise::Deferred deferred_;
  std::string taskId_;
  int state_;
};

// Async worker for GetForCurrentPackage operation
struct TaskInfo {
  std::string taskId;
  int state;
};

class GetForCurrentPackageWorker : public Napi::AsyncWorker {
public:
  GetForCurrentPackageWorker(Napi::Env env, Napi::Promise::Deferred deferred)
    : Napi::AsyncWorker(env), deferred_(deferred) {}

  void Execute() override {
    try {
      auto tasks = StartupTask::GetForCurrentPackageAsync().get();
      for (auto const& task : tasks) {
        TaskInfo info;
        info.taskId = winrt::to_string(task.TaskId());
        info.state = static_cast<int>(task.State());
        tasks_.push_back(info);
      }
    } catch (const winrt::hresult_error& e) {
      SetError(winrt::to_string(e.message()));
    }
  }

  void OnOK() override {
    auto env = Env();
    auto arr = Napi::Array::New(env, tasks_.size());

    for (size_t i = 0; i < tasks_.size(); i++) {
      auto obj = Napi::Object::New(env);
      obj.Set("taskId", Napi::String::New(env, tasks_[i].taskId));
      obj.Set("state", Napi::Number::New(env, tasks_[i].state));
      arr[static_cast<uint32_t>(i)] = obj;
    }

    deferred_.Resolve(arr);
  }

  void OnError(const Napi::Error& error) override {
    deferred_.Reject(error.Value());
  }

private:
  Napi::Promise::Deferred deferred_;
  std::vector<TaskInfo> tasks_;
};

Napi::Value Enable(const Napi::CallbackInfo& info) {
  auto env = info.Env();
  auto taskIdOpt = GetTaskIdParam(info);

  if (!taskIdOpt.has_value()) {
    return env.Undefined();
  }

  auto deferred = Napi::Promise::Deferred::New(env);
  auto worker = new EnableWorker(env, deferred, taskIdOpt.value());
  worker->Queue();

  return deferred.Promise();
}

Napi::Value Disable(const Napi::CallbackInfo& info) {
  auto env = info.Env();
  auto taskIdOpt = GetTaskIdParam(info);

  if (!taskIdOpt.has_value()) {
    return env.Undefined();
  }

  auto deferred = Napi::Promise::Deferred::New(env);
  auto worker = new DisableWorker(env, deferred, taskIdOpt.value());
  worker->Queue();

  return deferred.Promise();
}

Napi::Value GetState(const Napi::CallbackInfo& info) {
  auto env = info.Env();
  auto taskIdOpt = GetTaskIdParam(info);

  if (!taskIdOpt.has_value()) {
    return env.Undefined();
  }

  auto deferred = Napi::Promise::Deferred::New(env);
  auto worker = new GetStateWorker(env, deferred, taskIdOpt.value());
  worker->Queue();

  return deferred.Promise();
}

Napi::Value GetForCurrentPackage(const Napi::CallbackInfo& info) {
  auto env = info.Env();

  auto deferred = Napi::Promise::Deferred::New(env);
  auto worker = new GetForCurrentPackageWorker(env, deferred);
  worker->Queue();

  return deferred.Promise();
}

#else
// Non-Windows stubs (return rejected promises for consistency)
Napi::Value Enable(const Napi::CallbackInfo& info) {
  auto env = info.Env();
  auto deferred = Napi::Promise::Deferred::New(env);
  deferred.Reject(Napi::Error::New(env, "Not supported on this platform").Value());
  return deferred.Promise();
}

Napi::Value Disable(const Napi::CallbackInfo& info) {
  auto env = info.Env();
  auto deferred = Napi::Promise::Deferred::New(env);
  deferred.Reject(Napi::Error::New(env, "Not supported on this platform").Value());
  return deferred.Promise();
}

Napi::Value GetState(const Napi::CallbackInfo& info) {
  auto env = info.Env();
  auto deferred = Napi::Promise::Deferred::New(env);
  deferred.Reject(Napi::Error::New(env, "Not supported on this platform").Value());
  return deferred.Promise();
}

Napi::Value GetForCurrentPackage(const Napi::CallbackInfo& info) {
  auto env = info.Env();
  auto deferred = Napi::Promise::Deferred::New(env);
  deferred.Resolve(Napi::Array::New(env, 0));
  return deferred.Promise();
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
