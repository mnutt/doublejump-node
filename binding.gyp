{
  "targets": [{
    "target_name": "doublejump",
    "sources": [
      "src/doublejump.cc",
      "src/metrohash64.cc"
    ],
    "include_dirs": [
      "<!@(node -p \"require('node-addon-api').include\")",
      "src"
    ],
    "dependencies": [
      "<!(node -p \"require('node-addon-api').gyp\")"
    ],
    "cflags!": [ "-fno-exceptions" ],
    "cflags_cc!": [ "-fno-exceptions" ],
    "xcode_settings": {
      "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
      "CLANG_CXX_LIBRARY": "libc++",
      "MACOSX_DEPLOYMENT_TARGET": "10.7",
      "OTHER_CFLAGS": [ "-std=c++17" ],
      "OTHER_LDFLAGS": [ "-undefined", "dynamic_lookup" ]
    },
    "msvs_settings": {
      "VCCLCompilerTool": { 
        "ExceptionHandling": 1,
        "LanguageStandard": "stdcpp17",
        "LanguageStandard_C": "stdclatest"
      },
      "VCCLCompilerTool_ExceptionHandling": 1
    },
    "defines": [ "NAPI_DISABLE_CPP_EXCEPTIONS" ],
    "conditions": [
      ['OS=="win"', {
        "defines": [
          "HISTOGRAM_IMPLEMENTATION"
        ],
        "libraries": [
          "-lshlwapi.lib"
        ],
        "msvs_settings": {
          "VCCLCompilerTool": {
            "ExceptionHandling": 1,
            "EnableEnhancedInstructionSet": "2"
          }
        }
      }]
    ]
  }]
} 