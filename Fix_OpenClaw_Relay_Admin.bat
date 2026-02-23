@echo off
setlocal EnableExtensions

title Fix OpenClaw Relay Portproxy (Admin)

set "DISTRO=Ubuntu-24.04"
set "WSL_USER=openclaw"
set "RELAY_PORT=18792"

echo ==========================================
echo OpenClaw Relay One-Click Fix
echo ==========================================

net session >nul 2>&1
if errorlevel 1 (
  echo Requesting Administrator permission...
  powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)

echo [1/5] Resolve WSL IP...
set "WSL_IP="
for /f "tokens=1" %%I in ('wsl -d %DISTRO% -u %WSL_USER% -- hostname -I') do set "WSL_IP=%%I"
if not defined WSL_IP (
  echo Failed: cannot read WSL IP. Ensure WSL distro/user exists.
  goto :end
)
echo WSL IP: %WSL_IP%

echo [2/5] Verify relay in WSL on 127.0.0.1:%RELAY_PORT% ...
wsl -d %DISTRO% -u %WSL_USER% -- bash -lc "curl -sS -m 3 http://127.0.0.1:%RELAY_PORT%/ >/dev/null"
if errorlevel 1 (
  echo Relay is not reachable inside WSL. Start OpenClaw gateway first, then run again.
  goto :end
)
echo Relay inside WSL: OK

echo [3/5] Recreate Windows portproxy rule...
netsh interface portproxy delete v4tov4 listenaddress=127.0.0.1 listenport=%RELAY_PORT% >nul 2>&1
netsh interface portproxy add v4tov4 listenaddress=127.0.0.1 listenport=%RELAY_PORT% connectaddress=%WSL_IP% connectport=%RELAY_PORT%
if errorlevel 1 (
  echo Failed: portproxy add error.
  goto :end
)
echo Portproxy updated.

echo [4/5] Ensure firewall allow rule...
netsh advfirewall firewall delete rule name="OpenClaw Relay %RELAY_PORT%" >nul 2>&1
netsh advfirewall firewall add rule name="OpenClaw Relay %RELAY_PORT%" dir=in action=allow protocol=TCP localport=%RELAY_PORT% >nul 2>&1
echo Firewall rule updated.

echo [5/5] Verify from Windows localhost...
curl.exe -sS -m 3 http://127.0.0.1:%RELAY_PORT%/
if errorlevel 1 (
  echo.
  echo Verify failed from Windows localhost.
  goto :end
)
echo.
echo Success. Chrome extension relay should be reachable now.

:end
echo.
echo Done.
pause
endlocal
