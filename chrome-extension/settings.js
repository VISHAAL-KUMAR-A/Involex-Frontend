// Settings page script
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  
  document.getElementById('testConnection').addEventListener('click', testAPIConnection);
  document.getElementById('saveSettings').addEventListener('click', saveSettings);
  document.getElementById('resetSettings').addEventListener('click', resetSettings);
  document.getElementById('clearData').addEventListener('click', clearStoredData);
});

const defaultSettings = {
  apiUrl: 'http://127.0.0.1:8000/api/summarize-email/',
  enableGmail: true,
  enableOutlook: true,
  minEmailLength: 5,
  showNotifications: true,
  notificationDuration: 8,
  maxStoredAnalyses: 50
};

async function loadSettings() {
  try {
    const settings = await chrome.storage.sync.get(defaultSettings);
    
    document.getElementById('apiUrl').value = settings.apiUrl;
    document.getElementById('enableGmail').checked = settings.enableGmail;
    document.getElementById('enableOutlook').checked = settings.enableOutlook;
    document.getElementById('minEmailLength').value = settings.minEmailLength;
    document.getElementById('showNotifications').checked = settings.showNotifications;
    document.getElementById('notificationDuration').value = settings.notificationDuration;
    document.getElementById('maxStoredAnalyses').value = settings.maxStoredAnalyses;
    
    console.log('Settings loaded:', settings);
  } catch (error) {
    console.error('Error loading settings:', error);
    showNotification('Error loading settings', 'error');
  }
}

async function saveSettings() {
  try {
    const settings = {
      apiUrl: document.getElementById('apiUrl').value.trim(),
      enableGmail: document.getElementById('enableGmail').checked,
      enableOutlook: document.getElementById('enableOutlook').checked,
      minEmailLength: parseInt(document.getElementById('minEmailLength').value),
      showNotifications: document.getElementById('showNotifications').checked,
      notificationDuration: parseInt(document.getElementById('notificationDuration').value),
      maxStoredAnalyses: parseInt(document.getElementById('maxStoredAnalyses').value)
    };
    
    // Validate settings
    if (!settings.apiUrl || !settings.apiUrl.startsWith('http')) {
      throw new Error('Please enter a valid API URL');
    }
    
    if (settings.minEmailLength < 1 || settings.minEmailLength > 100) {
      throw new Error('Minimum email length must be between 1 and 100 words');
    }
    
    if (settings.notificationDuration < 3 || settings.notificationDuration > 30) {
      throw new Error('Notification duration must be between 3 and 30 seconds');
    }
    
    if (settings.maxStoredAnalyses < 10 || settings.maxStoredAnalyses > 500) {
      throw new Error('Maximum stored analyses must be between 10 and 500');
    }
    
    await chrome.storage.sync.set(settings);
    
    showNotification('Settings saved successfully!', 'success');
    console.log('Settings saved:', settings);
    
    // Notify content scripts about settings update
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.url.includes('mail.google.com') || 
          tab.url.includes('outlook.live.com') || 
          tab.url.includes('outlook.office.com')) {
        try {
          await chrome.tabs.sendMessage(tab.id, {
            action: 'settingsUpdated',
            settings: settings
          });
        } catch (error) {
          // Tab might not have content script loaded yet
        }
      }
    }
    
  } catch (error) {
    console.error('Error saving settings:', error);
    showNotification(error.message || 'Error saving settings', 'error');
  }
}

async function resetSettings() {
  if (confirm('Are you sure you want to reset all settings to default values?')) {
    try {
      await chrome.storage.sync.clear();
      await loadSettings();
      showNotification('Settings reset to defaults', 'success');
    } catch (error) {
      console.error('Error resetting settings:', error);
      showNotification('Error resetting settings', 'error');
    }
  }
}

async function clearStoredData() {
  if (confirm('Are you sure you want to clear all stored email analyses? This cannot be undone.')) {
    try {
      const storage = await chrome.storage.local.get();
      const analysisKeys = Object.keys(storage).filter(key => key.startsWith('analysis_'));
      
      for (const key of analysisKeys) {
        await chrome.storage.local.remove(key);
      }
      
      showNotification(`Cleared ${analysisKeys.length} stored analyses`, 'success');
    } catch (error) {
      console.error('Error clearing data:', error);
      showNotification('Error clearing stored data', 'error');
    }
  }
}

async function testAPIConnection() {
  const testButton = document.getElementById('testConnection');
  const connectionStatus = document.getElementById('connectionStatus');
  const testResult = document.getElementById('testResult');
  
  testButton.disabled = true;
  testButton.textContent = 'Testing...';
  connectionStatus.innerHTML = '';
  testResult.style.display = 'none';
  
  try {
    const apiUrl = document.getElementById('apiUrl').value.trim();
    
    if (!apiUrl) {
      throw new Error('Please enter an API URL');
    }
    
    // Test with a sample email
    const testEmail = {
      email_content: "This is a test email to verify the API connection is working properly.",
      sender_email: "test@example.com",
      recipient_email: "recipient@example.com",
      subject: "API Connection Test"
    };
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(testEmail)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    connectionStatus.innerHTML = '<span class="status-indicator success">✅ Connected</span>';
    testResult.className = 'test-result success';
    testResult.innerHTML = `
      <strong>✅ Connection Successful!</strong><br>
      API Response Time: ${result.processing_time || 'N/A'}s<br>
      Summary Generated: ${result.summary ? 'Yes' : 'No'}
    `;
    testResult.style.display = 'block';
    
  } catch (error) {
    console.error('API test failed:', error);
    
    connectionStatus.innerHTML = '<span class="status-indicator error">❌ Failed</span>';
    testResult.className = 'test-result error';
    testResult.innerHTML = `
      <strong>❌ Connection Failed</strong><br>
      Error: ${error.message}<br><br>
      <strong>Troubleshooting:</strong><br>
      • Make sure your Django server is running<br>
      • Check if the API URL is correct<br>
      • Verify CORS settings allow requests from Chrome extensions<br>
      • Check your firewall settings
    `;
    testResult.style.display = 'block';
  } finally {
    testButton.disabled = false;
    testButton.textContent = 'Test Connection';
  }
}

function showNotification(message, type) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 6px;
    color: white;
    font-weight: 500;
    z-index: 10000;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    background: ${type === 'success' ? '#10b981' : '#ef4444'};
  `;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 3000);
} 