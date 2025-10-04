@echo off
rem Save as run-backend.bat next to the 'backend' folder

cd /d "%~dp0backend"
node index.js
pause
