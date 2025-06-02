Write-Host "Starting AIOS Desktop App..." -ForegroundColor Green

# Navigate to the directory containing the script
Set-Location -Path $PSScriptRoot
Write-Host "Current directory: $(Get-Location)" -ForegroundColor Cyan

# Stash current changes
Write-Host "Stashing current changes..." -ForegroundColor Yellow
git stash

# Pull latest changes from remote
Write-Host "Pulling latest changes..." -ForegroundColor Yellow
git pull

# Restore stashed changes
Write-Host "Restoring stashed changes..." -ForegroundColor Yellow
git stash pop

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Cyan
npm install

# Start the app in dev mode
Write-Host "Starting app in development mode..." -ForegroundColor Green
npm run dev

Write-Host "Done!" -ForegroundColor Green 