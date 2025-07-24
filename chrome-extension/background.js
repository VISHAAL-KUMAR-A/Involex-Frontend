// Background script for handling API calls

// Default configuration
const DEFAULT_CONFIG = {
  apiUrl: 'http://127.0.0.1:8000/api/summarize-email/',
  timeout: 30000, // 30 seconds
};

// Initialize configuration
chrome.runtime.onInstalled.addListener(async () => {
  const config = await chrome.storage.sync.get(['apiUrl', 'timeout']);
  if (!config.apiUrl) {
    await chrome.storage.sync.set(DEFAULT_CONFIG);
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('🔧 DEBUG: Background script received message:', request.action);
  
  if (request.action === 'analyzeEmail') {
    analyzeEmail(request.data)
      .then(result => {
        console.log('✅ DEBUG: Sending success response:', result);
        sendResponse({ success: true, result: result });
      })
      .catch(error => {
        console.error('❌ DEBUG: Background script error:', error);
        // Send back a more detailed error object
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
    
    console.log('🔧 DEBUG: Sending email data to Django API:', emailData);
    console.log('🔧 DEBUG: API URL:', API_URL);
    
    const requestBody = JSON.stringify(emailData);
    console.log('🔧 DEBUG: Request body:', requestBody);

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': chrome.runtime.getURL(''),
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: requestBody,
      signal: controller.signal,
      credentials: 'include',
      mode: 'cors'
    });

    clearTimeout(timeoutId);

    console.log('🔧 DEBUG: Response status:', response.status);
    console.log('🔧 DEBUG: Response headers:', [...response.headers.entries()]);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔧 DEBUG: Error response body:', errorText);
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ DEBUG: API response:', result);
    
    // Store the analysis result in chrome storage for later retrieval
    await chrome.storage.local.set({
      [`analysis_${Date.now()}`]: {
        timestamp: new Date().toISOString(),
        emailData: emailData,
        result: result
      }
    });
    
    return result;
  } catch (error) {
    console.error('❌ DEBUG: Error calling Django API:', error);
    
    // Enhance error handling with specific error types
    if (error.name === 'AbortError') {
      throw new Error(`Request timed out after ${DEFAULT_CONFIG.timeout/1000} seconds`);
    } else if (error.message.includes('Failed to fetch')) {
      throw new Error('Unable to connect to the API. Please check if the server is running and accessible.');
    }
    
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