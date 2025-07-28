// Background script for handling API calls
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('🔧 DEBUG: Background script received message:', request.action);
  
  if (request.action === 'analyzeEmail') {
    console.log('🔧 DEBUG: Analyzing email with data:', {
      contentLength: request.data?.email_content?.length,
      recipient: request.data?.recipient_email,
      sender: request.data?.sender_email,
      subject: request.data?.subject
    });
    
    analyzeEmail(request.data)
      .then(result => {
        console.log('✅ DEBUG: API request successful:', result);
        sendResponse({ success: true, result: result });
      })
      .catch(error => {
        console.error('❌ DEBUG: API request failed:', error);
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
    
    console.log('🔧 DEBUG: Preparing API request');
    
    // Validate email data
    if (!emailData || typeof emailData !== 'object') {
      throw new Error('Invalid email data format');
    }
    
    if (!emailData.email_content || emailData.email_content.length < 10) {
      throw new Error('Email content is too short or missing');
    }
    
    if (!emailData.recipient_email || !emailData.recipient_email.includes('@')) {
      throw new Error('Invalid recipient email');
    }
    
    if (!emailData.sender_email || !emailData.sender_email.includes('@')) {
      throw new Error('Invalid sender email');
    }
    
    if (!emailData.subject) {
      throw new Error('Subject is required');
    }
    
    const requestBody = JSON.stringify(emailData);
    console.log('🔧 DEBUG: Sending request to API');
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': chrome.runtime.getURL(''),
      },
      body: requestBody
    });

    console.log('🔧 DEBUG: API response status:', response.status);
    
    if (!response.ok) {
      let errorMessage;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || `HTTP error! status: ${response.status}`;
      } catch {
        const errorText = await response.text();
        errorMessage = `HTTP error! status: ${response.status}, body: ${errorText}`;
      }
      console.error('🔧 DEBUG: API error response:', errorMessage);
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('✅ DEBUG: API response data:', result);
    
    if (!result || !result.summary) {
      throw new Error('Invalid API response format');
    }
    
    // Store the analysis result
    const analysisKey = `analysis_${Date.now()}`;
    const analysisData = {
      timestamp: new Date().toISOString(),
      emailData: emailData,
      result: result
    };
    
    console.log('🔧 DEBUG: Storing analysis:', { key: analysisKey, data: analysisData });
    
    await chrome.storage.local.set({
      [analysisKey]: analysisData
    });
    
    return result;
  } catch (error) {
    console.error('❌ DEBUG: Error in analyzeEmail:', error);
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