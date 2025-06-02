@echo off
echo Starting AIOS Desktop App...

:: Navigate to the directory containing the script
cd /d "%~dp0"
echo Current directory: %cd%

:: Stash current changes
echo Stashing current changes...
git stash

:: Pull latest changes from remote
echo Pulling latest changes...
git pull

:: Restore stashed changes
echo Restoring stashed changes...
git stash pop

:: Install dependencies
echo Installing dependencies...
call npm install

:: Start the app in dev mode
echo Starting app in development mode...
call npm run dev

echo Done! 