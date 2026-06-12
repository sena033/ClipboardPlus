#!/usr/bin/env bash
set -euo pipefail

echo "Building SecondBrain desktop..."
mkdir -p build
cd build
cmake .. -DCMAKE_BUILD_TYPE=Release
cmake --build . --config Release
echo "Build finished. Binary location: $(pwd)/secondbrain"
