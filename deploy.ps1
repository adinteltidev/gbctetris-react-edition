# 1. Configuration
$projectName = "Tetris"
$targetPath = "C:\inetpub\wwwroot\$projectName"
$buildPath = "$PSScriptRoot\dist"
$siteName = "TetrisGame"
$port = 8080

# Import IIS Module
Import-Module WebAdministration

# 2. Build the React Project
Write-Host "Starting React Build..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Error "Build failed. Deployment aborted."
    exit
}

# 3. Ensure Target Directory exists
if (!(Test-Path $targetPath)) {
    Write-Host "Creating directory $targetPath..." -ForegroundColor Cyan
    New-Item -ItemType Directory -Path $targetPath -Force
}

# 4. Clean existing files
Write-Host "Cleaning target directory..." -ForegroundColor Cyan
Get-ChildItem -Path $targetPath | Remove-Item -Recurse -Force

# 5. Copy Build Files to IIS
Write-Host "Deploying files to $targetPath..." -ForegroundColor Cyan
Copy-Item -Path "$buildPath\*" -Destination $targetPath -Recurse -Force

# 6. Copy web.config (Ensuring it goes to the root of the site)
if (Test-Path "$PSScriptRoot\web.config") {
    Write-Host "Copying web.config..." -ForegroundColor Cyan
    Copy-Item -Path "$PSScriptRoot\web.config" -Destination $targetPath -Force
} else {
    Write-Host "Warning: web.config not found in source root!" -ForegroundColor Yellow
}

# 7. Automate IIS Site Creation
Write-Host "Configuring IIS Website..." -ForegroundColor Magenta

# Remove the site if it already exists to ensure a fresh start
if (Get-Website -Name $siteName) {
    Write-Host "Removing existing IIS site: $siteName"
    Remove-Website -Name $siteName
}

# Create the new Website
Write-Host "Creating new IIS site: $siteName on port $port"
New-Website -Name $siteName -Port $port -PhysicalPath $targetPath -ApplicationPool "DefaultAppPool" -Force

# 8. Final Message
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "Visit: http://localhost:$port" -ForegroundColor Yellow