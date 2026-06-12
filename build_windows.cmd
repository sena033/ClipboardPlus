@echo off
setlocal enabledelayedexpansion

echo === SecondBrain Windows automated build ===

REM Check for git
where git >nul 2>nul
if errorlevel 1 (
  echo Git not found. Please install Git for Windows and re-run this script.
  exit /b 1
)

REM Set paths
set VCPKG_DIR=%CD%\vcpkg
set TOOLCHAIN=%VCPKG_DIR%\scripts\buildsystems\vcpkg.cmake

REM Clone vcpkg if missing
if not exist "%VCPKG_DIR%\bootstrap-vcpkg.bat" (
  echo Cloning vcpkg...
  git clone https://github.com/microsoft/vcpkg.git "%VCPKG_DIR%"
  if errorlevel 1 (
    echo Failed to clone vcpkg.
    exit /b 1
  )
)

REM Bootstrap vcpkg
pushd "%VCPKG_DIR%"
if not exist "installed" (
  echo Bootstrapping vcpkg (this may take a minute)...
  call bootstrap-vcpkg.bat
  if errorlevel 1 (
    echo vcpkg bootstrap failed.
    popd
    exit /b 1
  )
)

REM Install raylib via vcpkg for x64
echo Installing raylib via vcpkg (x64)...
call .\vcpkg.exe install raylib:x64-windows
if errorlevel 1 (
  echo vcpkg install failed. Check prerequisites (Visual Studio with C++ workload).
  popd
  exit /b 1
)
popd

REM Create build directory and run CMake
if not exist build mkdir build
cd build

echo Running CMake configure...
cmake -G "Visual Studio 17 2022" -A x64 -DCMAKE_TOOLCHAIN_FILE="%TOOLCHAIN%" ..
if errorlevel 1 (
  echo CMake configure failed.
  exit /b 1
)

echo Building solution...
cmake --build . --config Release
if errorlevel 1 (
  echo Build failed.
  exit /b 1
)

echo Build complete. Executable at build\Release\secondbrain.exe
endlocal
pause
