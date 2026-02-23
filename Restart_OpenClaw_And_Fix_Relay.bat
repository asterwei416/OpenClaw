@echo off
setlocal EnableExtensions

title Restart OpenClaw + Fix Relay

set "BASE_DIR=%~dp0"
set "RESTART_BAT=%BASE_DIR%..\..\..\Restart_OpenClaw.bat"
set "RELAY_FIX_BAT=%BASE_DIR%Fix_OpenClaw_Relay_Admin.bat"

echo ==========================================
echo Restart OpenClaw + Fix Relay (One Click)
echo ==========================================
echo.

if not exist "%RESTART_BAT%" (
  echo Missing file: %RESTART_BAT%
  goto :end
)
if not exist "%RELAY_FIX_BAT%" (
  echo Missing file: %RELAY_FIX_BAT%
  goto :end
)

echo [1/2] Restart OpenClaw gateway...
set "NO_PAUSE=1"
call "%RESTART_BAT%"
if errorlevel 1 (
  echo Restart step returned non-zero exit code.
)
echo.
echo [2/2] Fix browser relay portproxy (will request Admin if needed)...
call "%RELAY_FIX_BAT%"

:end
echo.
echo Done.
pause
endlocal
