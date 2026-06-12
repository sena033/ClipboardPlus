cmake_minimum_required(VERSION 3.10)
project(secondbrain-native C)

set(CMAKE_C_STANDARD 99)

add_library(secondbrain SHARED
    ${CMAKE_SOURCE_DIR}/../../../../src/main.c
    ${CMAKE_SOURCE_DIR}/../../../../src/core/note.c
    ${CMAKE_SOURCE_DIR}/../../../../src/core/markdown.c
    ${CMAKE_SOURCE_DIR}/../../../../src/core/filemgr.c
    ${CMAKE_SOURCE_DIR}/../../../../src/core/graph.c
    ${CMAKE_SOURCE_DIR}/../../../../src/ui/ui.c
)

# Include paths
target_include_directories(secondbrain PRIVATE
    ${CMAKE_SOURCE_DIR}/../../../../src
    ${CMAKE_SOURCE_DIR}/../../../../src/core
    ${CMAKE_SOURCE_DIR}/../../../../src/ui
)

# Linker settings: expect raylib for Android to be provided via prebuilt or submodule
find_library(log-lib log)
target_link_libraries(secondbrain PRIVATE ${log-lib})
