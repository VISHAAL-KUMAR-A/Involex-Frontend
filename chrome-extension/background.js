// Background script for handling API calls
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
        sendResponse({ success: false, error: error.message });
      });
    
    // Return true to indicate we'll send a response asynchronously
    return true;
  }
  
  // Always return true for async response
  return true;
});

async function analyzeEmail(emailData) {
  try {
    const API_URL = 'http://127.0.0.1:8000/api/summarize-email/';
    
    console.log('🔧 DEBUG: Sending email data to Django API:', emailData);
    console.log('🔧 DEBUG: API URL:', API_URL);
    
    const requestBody = JSON.stringify(emailData);
    console.log('🔧 DEBUG: Request body:', requestBody);
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: requestBody
    });

    console.log('🔧 DEBUG: Response status:', response.status);
    console.log('🔧 DEBUG: Response headers:', [...response.headers.entries()]);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔧 DEBUG: Error response body:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
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