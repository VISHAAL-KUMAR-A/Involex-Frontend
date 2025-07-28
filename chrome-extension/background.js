// Background script for handling API calls

// Default configuration
const DEFAULT_CONFIG = {
  apiUrl: 'http://127.0.0.1:8000/api/summarize-email/',
  timeout: 30000, // 30 seconds
};

// Initialize configuration
chrome.runtime.onInstalled.addListener(async () => {
  console.log('🔧 Extension installed/updated');
  const config = await chrome.storage.sync.get(['apiUrl', 'timeout']);
  if (!config.apiUrl) {
    console.log('🔧 Setting default configuration');
    await chrome.storage.sync.set(DEFAULT_CONFIG);
  }
  console.log('🔧 Current configuration:', config);
});

// Log when the background script starts
console.log('🔧 Background script started');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('🔧 Background script received message:', {
    action: request.action,
    sender: sender.tab?.url || 'unknown',
    data: request.data
  });
  
  if (request.action === 'analyzeEmail') {
    analyzeEmail(request.data)
      .then(result => {
        console.log('✅ Sending success response:', result);
        sendResponse({ success: true, result: result });
      })
      .catch(error => {
        console.error('❌ Background script error:', error);
        sendResponse({ 
          success: false, 
          error: {
            message: error.message,
            type: error.name,
            details: error.stack
          }
        });
      });
    
    // Return true to indicate we'll send a response asynchronously
    return true;
  }
  
  // Always return true for async response
  return true;
});

async function analyzeEmail(emailData) {
  try {
    // Get current configuration
    const config = await chrome.storage.sync.get(['apiUrl', 'timeout']);
    const API_URL = config.apiUrl || DEFAULT_CONFIG.apiUrl;
    const TIMEOUT = config.timeout || DEFAULT_CONFIG.timeout;
    
    console.log('🔧 DEBUG: Making API request to:', API_URL);
    console.log('🔧 DEBUG: Request data:', {
      content_length: emailData.email_content?.length,
      recipient: emailData.recipient_email,
      subject: emailData.subject?.length
    });

    const requestBody = JSON.stringify(emailData);

    // Log the exact request we're about to make
    console.log('🔧 DEBUG: Request details:', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      bodyLength: requestBody.length
    });
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: requestBody
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        url: API_URL,
        headers: Object.fromEntries(response.headers)
      });
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ API Success:', result);
    
    // Store the analysis result
    await chrome.storage.local.set({
      [`analysis_${Date.now()}`]: {
        timestamp: new Date().toISOString(),
        emailData: emailData,
        result: result
      }
    });
    
    return result;
  } catch (error) {
    console.error('❌ Error in analyzeEmail:', {
      name: error.name,
      message: error.message,
      cause: error.cause
    });
    throw error;
  }
}

// Clean up old stored analyses (keep only last 50)
chrome.runtime.onStartup.addListener(async () => {
  const storage = await chrome.storage.local.get();
  const analysisKeys = Object.keys(storage).filter(key => key.startsWith('analysis_'));
  
  if (analysisKeys.length > 50) {
    const keysToRemove = analysisKeys
      .sort()
      .slice(0, analysisKeys.length - 50);
    
    for (const key of keysToRemove) {
      await chrome.storage.local.remove(key);
    }
  }
}); 