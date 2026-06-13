@echo off
REM Double-click this to play Pickle Bandit without PowerShell execution-policy headaches.
REM It launches a local server with Node and opens your browser.
echo Starting Pickle Bandit...
where npx >nul 2>nul
if %errorlevel%==0 (
  start "" http://localhost:3000
  cmd /c npx --yes serve . -l 3000
) else (
  echo Node.js not found. Install Node from https://nodejs.org then run this again.
  pause
)
