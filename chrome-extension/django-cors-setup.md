# Django CORS Setup for Chrome Extension

To allow your Chrome extension to communicate with your Django API, you need to configure CORS (Cross-Origin Resource Sharing) properly.

## Install django-cors-headers

```bash
pip install django-cors-headers
```

## Update Django Settings

Add the following to your Django `settings.py`:

```python
# Add to INSTALLED_APPS
INSTALLED_APPS = [
    # ... your existing apps
    'corsheaders',
    # ... rest of your apps
]

# Add to MIDDLEWARE (should be at the top)
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    # ... rest of your middleware
]

# CORS settings for Chrome Extension
CORS_ALLOWED_ORIGINS = [
    "chrome-extension://*",  # Allow any Chrome extension
]

# For development only - allows all origins
CORS_ALLOW_ALL_ORIGINS = True

# Allow specific headers that Chrome extensions send
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# Allow specific methods
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

# Allow credentials if needed
CORS_ALLOW_CREDENTIALS = True
```

## Alternative Configuration (More Secure)

For production, be more specific:

```python
# Only allow your specific extension ID (get this after installing)
CORS_ALLOWED_ORIGINS = [
    "chrome-extension://your-extension-id-here",
]

# Or allow localhost for development
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:8000",
    "chrome-extension://*",
]
```

## Test Your CORS Setup

After configuring CORS, test your API:

```bash
# Make sure your Django server is running
python manage.py runserver

# Test the endpoint directly
curl -X POST http://127.0.0.1:8000/api/summarize-email/ \
  -H "Content-Type: application/json" \
  -d '{
    "email_content": "Test email content",
    "sender_email": "test@example.com",
    "recipient_email": "recipient@example.com",
    "subject": "Test Subject"
  }'
```

## Common Issues

### 1. CORS Error in Console
If you see CORS errors in the browser console:
- Make sure `corsheaders` is installed
- Check middleware order (CorsMiddleware should be first)
- Verify CORS_ALLOWED_ORIGINS includes your extension

### 2. Extension Can't Connect
- Ensure Django server is running on the correct port
- Check firewall settings
- Verify API URL in extension settings

### 3. OPTIONS Request Failing
- Make sure CORS_ALLOW_METHODS includes 'OPTIONS'
- Check that CorsMiddleware is properly configured

## Debugging CORS

Add this to your Django view for debugging:

```python
import logging
logger = logging.getLogger(__name__)

def your_api_view(request):
    logger.info(f"Request headers: {request.headers}")
    logger.info(f"Request method: {request.method}")
    logger.info(f"Request origin: {request.headers.get('Origin', 'No origin')}")
    # ... rest of your view logic
```

This will help you see what headers and origins the extension is sending. 