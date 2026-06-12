Desktop build (Windows/Linux/macOS)

Prerequisites:
- CMake 3.10+
- A C compiler (gcc/clang/MSVC)
- Raylib installed (system package or built from source)

Steps:
1. git clone <repo>
2. mkdir build && cd build
3. cmake ..
4. cmake --build . --config Release
5. Run the produced binary (secondbrain or secondbrain.exe)

Android (native .so via NativeActivity)

Prerequisites:
- Android Studio with NDK (r21+ recommended)
- CMake (bundled with Android Studio) and Android SDK

Steps:
1. Open the android/ folder in Android Studio
2. Ensure the NDK path is configured in Preferences
3. Sync the Gradle project; the CMakeLists under android/app/src/main/cpp will be used to build the native library
4. Build and run on device/emulator

Notes:
- This repository provides a lightweight native skeleton. For a production-ready APK you may want to integrate a Java/Kotlin wrapper and proper resource handling.
