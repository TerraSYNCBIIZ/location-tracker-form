#!/bin/bash

# TERRASYNC Deployment Script

# Ensure script stops on error
set -e

echo "📦 Starting TERRASYNC deployment process..."

# Check for environment variables file
if [ ! -f .env.local ]; then
  echo "❌ ERROR: Missing .env.local file. Please create it with the required environment variables."
  exit 1
fi

# Install dependencies
echo "📥 Installing dependencies..."
npm ci

# Run lint
echo "🔍 Checking code quality..."
npm run lint

# Run build
echo "🔨 Building application..."
npm run build

# Prepare deployment directory
echo "🗂️ Preparing deployment files..."
if [ -d "deployment" ]; then
  rm -rf deployment
fi
mkdir -p deployment

# Copy necessary files
cp -r .next deployment/
cp -r public deployment/
cp package.json deployment/
cp package-lock.json deployment/
cp next.config.mjs deployment/
cp .env.local deployment/

# Create the start script
cat > deployment/start.sh << EOL
#!/bin/bash
npm install --production
npm start
EOL

chmod +x deployment/start.sh

echo "✅ Deployment package created successfully in the 'deployment' directory."
echo "📋 Instructions:"
echo "  1. Copy the 'deployment' directory to your server"
echo "  2. Run ./start.sh inside the deployment directory"
echo "🚀 TERRASYNC is ready for deployment!" 