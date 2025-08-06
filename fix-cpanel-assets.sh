#!/bin/bash

echo "🔧 cPanel Asset Fix Script"
echo "=========================="

# Check if we're in the right directory
if [ ! -f "composer.json" ]; then
    echo "❌ Error: Please run this script from your Laravel project root"
    exit 1
fi

echo "📦 Installing/Updating NPM dependencies..."
npm install

echo "🏗️ Building assets for production..."
npm run build

echo "🧹 Clearing Laravel caches..."
php artisan config:clear
php artisan cache:clear
php artisan view:clear
php artisan route:clear

echo "📁 Checking build directory..."
if [ -d "public/build" ]; then
    echo "✅ Build directory exists"
    echo "📊 Build contents:"
    ls -la public/build/assets/ | head -10
else
    echo "❌ Build directory not found!"
    exit 1
fi

echo ""
echo "🎯 Next Steps:"
echo "1. Upload the entire 'public/build/' folder to your cPanel"
echo "2. Set APP_URL and ASSET_URL in your .env file"
echo "3. Clear cPanel caches if available"
echo ""
echo "📋 Example .env settings:"
echo "APP_ENV=production"
echo "APP_DEBUG=false"
echo "APP_URL=https://yourdomain.com"
echo "ASSET_URL=https://yourdomain.com"
echo ""
echo "✅ Script completed!" 