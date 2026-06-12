cmake_minimum_required(VERSION 3.10)
project(secondbrain C)

# Turn on c99
set(CMAKE_C_STANDARD 99)

# Options
option(BUILD_ANDROID "Building for Android" OFF)

if(NOT BUILD_ANDROID)
  add_executable(secondbrain
    src/main.c
    src/core/note.c
    src/core/markdown.c
    src/core/filemgr.c
    src/core/graph.c
    src/ui/ui.c
    src/ui/theme.c
  )
  target_include_directories(secondbrain PRIVATE src src/core src/ui)
  # Expect user to install raylib on system. Try to find package.
  find_package(raylib REQUIRED)
  target_link_libraries(secondbrain PRIVATE raylib)
else()
  # Android-specific target will be handled by android/CMakeLists.txt when imported by Gradle
endif()
