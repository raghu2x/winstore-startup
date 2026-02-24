{
  "targets": [
    {
      "target_name": "winstore_startup",
      "cflags!": ["-fno-exceptions"],
      "cflags_cc!": ["-fno-exceptions"],
      "sources": ["startup_task.cpp"],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")"
      ],
      "defines": ["NAPI_DISABLE_CPP_EXCEPTIONS"],
      "conditions": [
        [
          "OS=='win'",
          {
            "msvs_settings": {
              "VCCLCompilerTool": {
                "AdditionalOptions": ["/std:c++17", "/await"],
                "ExceptionHandling": 1
              }
            },
            "libraries": ["windowsapp.lib"]
          }
        ]
      ]
    }
  ]
}
