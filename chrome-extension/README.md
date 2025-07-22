# Involex Email Analyzer - Chrome Extension

This Chrome extension automatically analyzes emails when they are sent from Gmail or Outlook, providing AI-powered summaries using your Django API.

## Features

- 🔍 **Automatic Email Detection**: Monitors when you send emails from Gmail or Outlook
- 🤖 **AI Summarization**: Uses your Django API to generate intelligent email summaries
- 📊 **Word Count Analysis**: Shows original vs summary word counts
- 📈 **Processing Time**: Displays API processing performance
- 💾 **Local Storage**: Keeps recent analyses for easy access
- ⚙️ **Configurable**: Customizable settings for different preferences
- 🔔 **Visual Notifications**: Shows analysis results directly on the email page

## Supported Email Providers

- Gmail (mail.google.com)
- Outlook Online (outlook.live.com, outlook.office.com)

## Installation

### 1. Prepare Your Django API

Make sure your Django API is running on `http://127.0.0.1:8000/api/summarize-email/` and accepts the following JSON format:

```json
{
    "email_content": "Email body text",
    "sender_email": "sender@example.com", 
    "recipient_email": "recipient@example.com",
    "subject": "Email subject"
}
```

### 2. Install the Chrome Extension

1. **Download/Clone** this extension folder to your computer
2. **Open Chrome** and navigate to `chrome://extensions/`
3. **Enable Developer Mode** (toggle in the top right)
4. **Click "Load unpacked"** and select the `chrome-extension` folder
5. **Pin the extension** to your toolbar for easy access

### 3. Configure the Extension

1. Click the Involex extension icon in your toolbar
2. Click "Extension Settings"
3. Verify the API URL is correct: `http://127.0.0.1:8000/api/summarize-email/`
4. Test the connection to ensure your Django API is accessible
5. Adjust other settings as needed

## Usage

### Automatic Analysis

1. **Navigate** to Gmail or Outlook in your browser
2. **Compose** a new email as normal
3. **Fill in** recipient, subject, and email content
4. **Click Send** - the extension will automatically:
   - Detect the email being sent
   - Extract the email data
   - Send it to your Django API
   - Show a notification with the analysis results

### View Results

- **Popup**: Click the extension icon to see recent analyses
- **Settings**: Access detailed configuration options
- **Notifications**: See instant results when emails are sent

## API Integration

The extension sends POST requests to your Django API with this structure:

```javascript
fetch('http://127.0.0.1:8000/api/summarize-email/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  body: JSON.stringify({
    email_content: "Email body...",
    sender_email: "user@example.com",
    recipient_email: "contact@company.com", 
    subject: "Email Subject"
  })
})
```

Expected response format:
```json
{
  "summary": "AI-generated summary...",
  "word_count_original": 45,
  "word_count_summary": 23,
  "billable_description": "Detailed billing description...",
  "processing_time": 2.34
}
```

## Configuration Options

### API Settings
- **API URL**: Your Django endpoint URL
- **Connection Testing**: Verify API accessibility

### Email Monitoring
- **Enable Gmail**: Monitor Gmail compose windows
- **Enable Outlook**: Monitor Outlook compose windows  
- **Minimum Email Length**: Only analyze emails above word threshold

### Notifications
- **Show Notifications**: Display analysis results on page
- **Notification Duration**: How long to show notifications

### Data Management
- **Storage Limit**: Number of analyses to keep locally
- **Clear Data**: Remove all stored analysis history

## Troubleshooting

### Extension Not Working
1. **Check URL**: Ensure you're on Gmail or Outlook
2. **Refresh Page**: Reload the email page after installing
3. **Check Console**: Open Developer Tools (F12) for error messages

### API Connection Issues
1. **Django Server**: Ensure your Django server is running
2. **CORS Settings**: Configure Django to allow Chrome extension requests:
   ```python
   # In Django settings.py
   CORS_ALLOWED_ORIGINS = [
       "chrome-extension://*",
   ]
   CORS_ALLOW_ALL_ORIGINS = True  # For development only
   ```
3. **Firewall**: Check if localhost requests are blocked
4. **Test Connection**: Use the extension's built-in connection test

### Email Not Being Detected
1. **Compose Window**: Ensure you're in a compose/new email window
2. **Email Content**: Check minimum word count requirements
3. **Send Button**: Make sure you're clicking the actual send button
4. **Wait Time**: Allow a moment after clicking send for processing

## Development

### File Structure
```
chrome-extension/
├── manifest.json       # Extension configuration
├── content.js         # Email monitoring and extraction
├── background.js      # API communication
├── popup.html         # Extension popup interface
├── popup.js          # Popup functionality
├── settings.html      # Configuration page
├── settings.js       # Settings management
└── README.md         # This file
```

### Key Components

- **Content Script**: Monitors email compose windows and detects sending
- **Background Script**: Handles API calls and data storage
- **Popup**: Shows recent analyses and status
- **Settings**: Configurable options and API testing

## Privacy & Security

- **Local Processing**: Email data is only sent to your specified API
- **No External Services**: No third-party services are used
- **Local Storage**: Analysis results are stored locally in your browser
- **No Tracking**: No analytics or tracking are implemented

## Support

For issues or questions:
1. Check the browser console for error messages
2. Test your Django API independently
3. Verify Chrome extension permissions
4. Review CORS configuration in Django

## Version History

- **v1.0**: Initial release with Gmail and Outlook support 