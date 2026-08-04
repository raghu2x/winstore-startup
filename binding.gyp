{
  "targets": [
    {
      "target_name": "winstore_startup",
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")"
      ],
      "conditions": [
        [
          "OS=='win'",
          {
            "cflags!": ["-fno-exceptions"],
            "cflags_cc!": ["-fno-exceptions"],
            "sources": ["startup_task.cpp"],
            "msvs_settings": {
              "VCCLCompilerTool": {
                "AdditionalOptions": ["/std:c++20"],
                "ExceptionHandling": 1
              }
            },
            "msvs_version": "auto",
            "libraries": ["windowsapp.lib"]
          },
          {
            "sources": ["startup_task.cpp"],
            "defines": ["NODE_ADDON_API_DISABLE_CPP_EXCEPTIONS"],
            "cflags_cc!": ["-fno-exceptions"]
          }
        ]
      ]
    }
  ]
}
