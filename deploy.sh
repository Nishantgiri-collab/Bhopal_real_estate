#!/bin/bash

# Bhopal Real Estate Auto-Deploy Script
# Run on Hostinger server via GitHub Actions

echo "🚀 Starting deployment..."

# Navigate to app directory
cd /home/u864153968/domains/darkgrey-whale-922741.hostingersite.com/nodejs

# Pull latest code
echo "📥 Pulling from GitHub..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm install
cd server && npm install && cd ..

# Build frontend
echo "🏗️  Building frontend..."
npm run build

# Restart application
echo "🔄 Restarting Node.js app..."
pm2 restart bhopal-estate || pm2 start server.js --name "bhopal-estate"
pm2 save

echo "✅ Deployment complete!"
