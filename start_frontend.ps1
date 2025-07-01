# PowerShell script to start the RideMatch frontend (React Native)
# Ensures proper Node.js environment and dependencies

Write-Host "🚀 Starting RideMatch Frontend..." -ForegroundColor Green
Write-Host "=" * 50

# Check if we're in the correct directory
$currentDir = Get-Location
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: Please run this script from the a3 directory" -ForegroundColor Red
    Write-Host "Current directory: $currentDir"
    exit 1
}

# Check if node_modules exists
if (-not (Test-Path "node_modules" -PathType Container)) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "✅ Dependencies already installed" -ForegroundColor Green
}

# Check for .env file
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  .env file not found. Creating a template..." -ForegroundColor Yellow
    @"
# API Configuration
API_BASE_URL=http://localhost:5000/api

# Expo Configuration
EXPO_PUBLIC_API_URL=http://localhost:5000/api
"@ | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "📝 Created .env template. Please update with your values." -ForegroundColor Cyan
}

# Clear any previous metro cache
Write-Host "🧹 Clearing Metro cache..." -ForegroundColor Yellow
npx expo start --clear

Write-Host "🚀 Starting Expo development server..." -ForegroundColor Green
Write-Host "Scan the QR code with Expo Go app or press 'a' for Android emulator" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Cyan
Write-Host "=" * 50 