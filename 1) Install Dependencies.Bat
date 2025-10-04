@echo off
REM Navigate to backend folder
cd /d "%~dp0\backend"

REM Install Node dependencies
echo Installing Node.js dependencies...
npm install

pause
