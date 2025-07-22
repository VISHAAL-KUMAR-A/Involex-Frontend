# Quick Installation Guide

## Prerequisites
- ✅ Django API running on `http://127.0.0.1:8000/api/summarize-email/`
- ✅ Chrome or Chromium browser
- ✅ Gmail or Outlook account

## Step 1: Configure Django CORS

1. Install django-cors-headers:
   ```bash
   pip install django-cors-headers
   ```

2. Add to your Django `settings.py`:
   ```python
   INSTALLED_APPS = [
       # ... existing apps
       'corsheaders',
   ]
   
   MIDDLEWARE = [
       'corsheaders.middleware.CorsMiddleware',
       'django.middleware.common.CommonMiddleware',
       # ... rest of middleware
   ]
   
   # Allow Chrome extension requests
   CORS_ALLOW_ALL_ORIGINS = True  # For development
   ```

3. Restart your Django server:
   ```bash
   python manage.py runserver
   ```

## Step 2: Install Chrome Extension

1. **Open Chrome Extensions page:**
   - Type `chrome://extensions/` in address bar
   - OR go to Menu → More Tools → Extensions

2. **Enable Developer Mode:**
   - Toggle "Developer mode" in top-right corner

3. **Load the extension:**
   - Click "Load unpacked"
   - Select the `chrome-extension` folder
   - Extension should appear in your extensions list

4. **Pin the extension:**
   - Click the puzzle piece icon (🧩) in Chrome toolbar
   - Pin "Involex Email Analyzer" for easy access

## Step 3: Test the Extension

1. **Test API Connection:**
   - Click the Involex extension icon
   - Click "Extension Settings"
   - Click "Test Connection"
   - Should show "✅ Connected"

2. **Test Email Analysis:**
   - Go to Gmail (mail.google.com) or Outlook
   - Compose a new email
   - Fill in recipient, subject, and body (at least 10 words)
   - Click Send
   - You should see a green notification with analysis results!

## Troubleshooting

### ❌ "API connection: Disconnected"
- Make sure Django server is running: `python manage.py runserver`
- Check API URL in extension settings
- Review CORS configuration (see django-cors-setup.md)

### ❌ Extension not detecting emails
- Make sure you're on Gmail or Outlook web interface
- Refresh the page after installing extension
- Check browser console (F12) for error messages
- Ensure compose window is fully loaded before sending

### ❌ CORS errors in console
- Install django-cors-headers: `pip install django-cors-headers`
- Add corsheaders to INSTALLED_APPS and MIDDLEWARE
- Set CORS_ALLOW_ALL_ORIGINS = True

### ❌ No notification appears
- Check extension popup for recent analyses
- Verify email has sufficient content (10+ words)
- Look for error messages in browser console

## Next Steps

1. **Customize Settings:**
   - Adjust notification duration
   - Set minimum email length
   - Configure which email providers to monitor

2. **View Analytics:**
   - Click extension icon to see recent email analyses
   - Review processing times and word counts

3. **Icon Customization:**
   - Replace placeholder icon files in `icons/` folder with actual PNG images
   - Recommended size: 16x16, 48x48, 128x128 pixels

## Support

If you encounter issues:
1. Check browser console for errors (F12 → Console)
2. Verify Django API works independently
3. Review CORS configuration
4. Ensure extension has proper permissions

For detailed troubleshooting, see README.md 