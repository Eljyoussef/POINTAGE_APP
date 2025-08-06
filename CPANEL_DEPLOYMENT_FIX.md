# cPanel Deployment Fix Guide

## 🚨 Problem Identified

Your Laravel + React application is failing on cPanel due to asset loading issues. The Maps page shows a blank page because the CSS and JS assets are not being found (404 errors).

## 🔧 Solutions

### 1. Environment Configuration

Add these to your `.env` file on cPanel:

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://yourdomain.com
ASSET_URL=https://yourdomain.com

# If your app is in a subdirectory, use:
# APP_URL=https://yourdomain.com/pointage_app
# ASSET_URL=https://yourdomain.com/pointage_app
```

### 2. Rebuild Assets for Production

Run these commands on your local machine, then upload the `public/build` folder:

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Or if you have a build script in package.json
npm run build
```

### 3. Upload the Correct Files

Make sure to upload these folders/files to cPanel:
- `public/build/` (entire folder with all assets)
- `public/.htaccess`
- All other Laravel files

### 4. Clear Laravel Caches

On cPanel, run these commands via SSH or terminal:

```bash
php artisan config:clear
php artisan cache:clear
php artisan view:clear
php artisan route:clear
```

### 5. Check File Permissions

Ensure these permissions on cPanel:
- `storage/` directory: 755
- `bootstrap/cache/` directory: 755
- `public/build/` directory: 755

### 6. Alternative: Force HTTPS Assets

If you're still having issues, modify your `app.blade.php`:

```php
<!-- Scripts -->
@routes
@viteReactRefresh
@vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])
@inertiaHead
```

Add this before the `@vite` directive:

```php
@if(config('app.env') === 'production')
    <script>
        window.assetUrl = '{{ config('app.asset_url', config('app.url')) }}';
    </script>
@endif
```

### 7. Check .htaccess Configuration

Make sure your `public/.htaccess` is properly configured:

```apache
<IfModule mod_rewrite.c>
    <IfModule mod_negotiation.c>
        Options -MultiViews -Indexes
    </IfModule>

    RewriteEngine On

    # Handle Authorization Header
    RewriteCond %{HTTP:Authorization} .
    RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]

    # Redirect Trailing Slashes If Not A Folder...
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_URI} (.+)/$
    RewriteRule ^ %1 [L,R=301]

    # Send Requests To Front Controller...
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^ index.php [L]
</IfModule>
```

## 🔍 Debugging Steps

### 1. Check Browser Console
Look for these specific errors:
- 404 errors for CSS/JS files
- CORS errors
- Asset URL mismatches

### 2. Verify Asset URLs
Check if the generated asset URLs in the HTML source are correct:
- Should point to your domain
- Should include the correct file paths

### 3. Test Individual Assets
Try accessing the asset files directly:
- `https://yourdomain.com/build/assets/Maps-CG6DamIu.css`
- `https://yourdomain.com/build/assets/Maps-Sur17UAa.js`

## 🎯 Quick Fix Checklist

- [ ] Set correct `APP_URL` and `ASSET_URL` in `.env`
- [ ] Rebuild assets with `npm run build`
- [ ] Upload entire `public/build/` folder
- [ ] Clear Laravel caches
- [ ] Check file permissions
- [ ] Verify .htaccess configuration

## 🚀 Expected Result

After implementing these fixes:
- Maps page should load properly
- All assets should load without 404 errors
- Navigation between pages should work correctly
- Leaflet map should display with tiles

## 📞 If Issues Persist

1. Check cPanel error logs
2. Verify PHP version compatibility
3. Ensure all Laravel dependencies are installed
4. Check if mod_rewrite is enabled on cPanel 