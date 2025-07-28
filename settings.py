# CORS Configuration for Chrome Extension
CORS_ALLOWED_ORIGINS = [
    "chrome-extension://*",  # This won't work as it's not a valid origin pattern
    "http://localhost:8000",
    "http://127.0.0.1:8000"
]

# For development, it's better to use this
CORS_ALLOW_ALL_ORIGINS = True

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
    'x-extension-id'  # Add this for our custom header
]

CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

# Add this to ensure credentials are allowed if needed
CORS_ALLOW_CREDENTIALS = True

# Update CSRF settings to include chrome-extension schema
CSRF_TRUSTED_ORIGINS = [
    'http://localhost:8000',
    'http://127.0.0.1:8000',
    'chrome-extension://*'  # This pattern is valid for CSRF but not for CORS
]
