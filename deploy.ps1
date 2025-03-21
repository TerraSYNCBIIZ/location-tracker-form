# TERRASYNC Deployment Script for Windows
# Run this script from PowerShell with Administrator privileges

Write-Host "📦 Starting TERRASYNC deployment process..." -ForegroundColor Cyan

# Check for environment variables file
if (-not (Test-Path -Path ".env.local")) {
    Write-Host "❌ ERROR: Missing .env.local file. Please create it with the required environment variables." -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host "📥 Installing dependencies..." -ForegroundColor Cyan
npm ci

# Run lint
Write-Host "🔍 Checking code quality..." -ForegroundColor Cyan
npm run lint

# Run build
Write-Host "🔨 Building application..." -ForegroundColor Cyan
npm run build

# Prepare deployment directory
Write-Host "🗂️ Preparing deployment files..." -ForegroundColor Cyan
if (Test-Path -Path "deployment") {
    Remove-Item -Path "deployment" -Recurse -Force
}
New-Item -Path "deployment" -ItemType Directory

# Copy necessary files
Copy-Item -Path ".next" -Destination "deployment\" -Recurse
Copy-Item -Path "public" -Destination "deployment\" -Recurse
Copy-Item -Path "package.json" -Destination "deployment\"
Copy-Item -Path "package-lock.json" -Destination "deployment\"
Copy-Item -Path "next.config.mjs" -Destination "deployment\"
Copy-Item -Path ".env.local" -Destination "deployment\"

# Create the start script
$startScript = @"
@echo off
echo Installing production dependencies...
call npm install --production
echo Starting the application...
call npm start
"@

$startScript | Out-File -FilePath "deployment\start.bat" -Encoding utf8

Write-Host "✅ Deployment package created successfully in the 'deployment' directory." -ForegroundColor Green
Write-Host "📋 Instructions:" -ForegroundColor Yellow
Write-Host "  1. Copy the 'deployment' directory to your server" -ForegroundColor White
Write-Host "  2. Run start.bat inside the deployment directory" -ForegroundColor White
Write-Host "🚀 TERRASYNC is ready for deployment!" -ForegroundColor Green 