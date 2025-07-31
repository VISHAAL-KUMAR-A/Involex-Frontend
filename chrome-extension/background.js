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
    
    return true;
  }
  
  return true;
});

// Handle Clio OAuth callback with improved error handling
chrome.webNavigation.onCompleted.addListener(async (details) => {
  if (details.url.includes('http://127.0.0.1:8000/api/clio/callback/')) {
    try {
      // Get the response directly from the page
      const response = await fetch(details.url);
      const data = await response.json();
      
      if (data.status === 'success' && data.email) {
        // Store user email and auth time
        await chrome.storage.local.set({ 
          clioUserEmail: data.email,
          clioAuthTime: Date.now() // Store auth time to track session
        });
        
        // Notify settings page
        chrome.runtime.sendMessage({
          action: 'clioAuthSuccess',
          email: data.email
        });
        
        // Show success notification
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon128.png',
          title: 'Clio Login Successful',
          message: `Logged in as ${data.email}`
        });

        // Only close the tab on successful authentication
        chrome.tabs.remove(details.tabId);
      } else {
        // Don't close the tab, show error in the page
        chrome.tabs.sendMessage(details.tabId, {
          action: 'showAuthError',
          error: data.error || 'Authentication failed'
        });
        
        // Show error notification
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon128.png',
          title: 'Clio Login Failed',
          message: data.error || 'Authentication failed. Please try logging out of Clio and try again.'
        });
      }
    } catch (error) {
      console.error('Error completing Clio authentication:', error);
      
      // Show error notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'Clio Login Failed',
        message: 'Please try logging out of Clio at app.clio.com first, then try again.'
      });
      
      // Don't close the tab on error
      chrome.tabs.sendMessage(details.tabId, {
        action: 'showAuthError',
        error: error.message
      });
    }
  }
});

// Add function to check auth status
async function checkClioAuthStatus() {
  const { clioUserEmail, clioAuthTime } = await chrome.storage.local.get(['clioUserEmail', 'clioAuthTime']);
  
  if (!clioUserEmail) return false;
  
  // Check if auth is older than 12 hours
  const authAge = Date.now() - (clioAuthTime || 0);
  if (authAge > 12 * 60 * 60 * 1000) {
    // Clear expired auth
    await chrome.storage.local.remove(['clioUserEmail', 'clioAuthTime', 'selectedMatterId']);
    return false;
  }
  
  return true;
}

// Update fetchClioMatters with improved error handling
async function fetchClioMatters() {
  try {
    const isAuthed = await checkClioAuthStatus();
    if (!isAuthed) {
      throw new Error('Clio authentication expired. Please log in again.');
    }
    
    const { clioUserEmail } = await chrome.storage.local.get(['clioUserEmail']);
    const response = await fetch(`http://127.0.0.1:8000/api/clio/matters/?email=${encodeURIComponent(clioUserEmail)}`);
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to fetch matters');
    }
    
    const data = await response.json();
    return data.matters;
  } catch (error) {
    console.error('Error fetching Clio matters:', error);
    // If auth error, clear stored data
    if (error.message.includes('authentication')) {
      await chrome.storage.local.remove(['clioUserEmail', 'clioAuthTime', 'selectedMatterId']);
    }
    throw error;
  }
}

// Update analyzeEmail function to check auth status
async function analyzeEmail(emailData) {
  try {
    const API_URL = 'http://127.0.0.1:8000/api/summarize-email/';
    
    // Check auth status before proceeding
    const isAuthed = await checkClioAuthStatus();
    if (!isAuthed) {
      throw new Error('Clio authentication expired. Please log in again.');
    }
    
    // Get Clio user email and selected matter ID
    const { clioUserEmail, selectedMatterId } = await chrome.storage.local.get(['clioUserEmail', 'selectedMatterId']);
    
    if (clioUserEmail) {
      emailData.sender_email = clioUserEmail;
      emailData.matter_id = selectedMatterId;
    }
    
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

// Add message listener for matter fetching
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'fetchClioMatters') {
    fetchClioMatters()
      .then(matters => sendResponse({ success: true, matters }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

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