#!/bin/zsh

echo "\033[32mStarting AIOS Desktop App...\033[0m"

# Get the absolute path to the script directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Navigate to the aios-desktop-app directory
echo "\033[36mNavigating to app directory...\033[0m"
cd "$SCRIPT_DIR"
echo "Current directory: $(pwd)"

# Stash current changes
echo "\033[33mStashing current changes...\033[0m"
git stash

# Pull latest changes from remote
echo "\033[33mPulling latest changes...\033[0m"
git pull

# Restore stashed changes
echo "\033[33mRestoring stashed changes...\033[0m"
git stash pop

# Install dependencies
echo "\033[36mInstalling dependencies...\033[0m"
npm install

# Start the app in dev mode
echo "\033[32mStarting app in development mode...\033[0m"
npm run dev

echo "\033[32mDone!\033[0m" 