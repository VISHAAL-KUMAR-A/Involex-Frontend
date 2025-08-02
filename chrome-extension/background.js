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
  
  if (request.action === 'fetchClioMatters') {
    fetchClioMatters()
      .then(matters => sendResponse({ success: true, matters }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  return true;
});

// Handle Clio OAuth callback with improved error handling
chrome.webNavigation.onCompleted.addListener(async (details) => {
  // Log all URLs for debugging (but only process callback URLs)
  if (details.url.includes('clio.com') || details.url.includes('127.0.0.1:8000')) {
    console.log('🔧 DEBUG: Navigation completed to:', details.url);
  }
  
  // Only process URLs that actually start with our callback URL, not authorization URLs that contain it as a parameter
  if (details.url.startsWith('http://127.0.0.1:8000/api/clio/callback/')) {
    console.log('✅ DEBUG: Processing ACTUAL OAuth callback URL:', details.url);
    
    try {
      // Extract code and error from URL parameters first
      const url = new URL(details.url);
      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error');
      
      if (error) {
        throw new Error(`OAuth error: ${error}`);
      }
      
      if (!code) {
        throw new Error('No authorization code received from Clio');
      }
      
      console.log('🔧 DEBUG: Found authorization code, reading page content...');
      
      // Wait a moment for the page to load, then read its content
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Execute script in the callback tab to read the response
      const results = await chrome.scripting.executeScript({
        target: { tabId: details.tabId },
        func: () => {
          // Try to get JSON data from the page
          try {
            const bodyText = document.body.textContent || document.body.innerText;
            console.log('🔧 DEBUG: Page content:', bodyText);
            
            // Try to parse as JSON first
            const jsonData = JSON.parse(bodyText);
            return { success: true, data: jsonData };
          } catch (e) {
            // If not JSON, look for error messages in HTML
            const title = document.title;
            const content = document.body.textContent || document.body.innerText;
            
            // Check for Django error pages
            if (content.includes('ValueError') || content.includes('Django') || title.includes('Error')) {
              return { 
                success: false, 
                error: 'Backend server error - please contact your developer',
                details: content.substring(0, 100),
                isDjangoError: true
              };
            }
            
            // Look for other error patterns
            if (content.includes('error') || title.includes('Error')) {
              return { 
                success: false, 
                error: title || 'Authentication failed' 
              };
            }
            
            // Return the raw content for debugging
            return { 
              success: false, 
              error: 'Unable to parse response',
              rawContent: content.substring(0, 200)
            };
          }
        }
      });
      
      const result = results[0].result;
      console.log('🔧 DEBUG: Page content result:', result);
      
      let data;
      if (result.success && result.data) {
        data = result.data;
        console.log('🔧 DEBUG: Successfully extracted JSON data:', data);
      } else {
        let errorMessage = result.error || 'Failed to read callback response';
        
        // Provide more helpful error message for Django errors
        if (result.isDjangoError) {
          errorMessage = `Backend Error: The Django server has a configuration issue. Please tell your backend developer to fix the JsonResponse headers in views.py. Details: ${result.details}`;
        }
        
        console.error('🔧 DEBUG: Failed to extract data:', errorMessage);
        throw new Error(errorMessage);
      }
      
      if (data.status === 'success' && data.email) {
        // Store only authentication data
        await chrome.storage.local.set({ 
          clioUserEmail: data.email,
          clioAuthTime: Date.now(),
          isClioAuthenticated: true
        });
        
        // Fetch user's matters immediately after authentication
        try {
          const mattersResponse = await fetch(`http://127.0.0.1:8000/api/clio/matters/?email=${encodeURIComponent(data.email)}`);
          if (mattersResponse.ok) {
            const mattersData = await mattersResponse.json();
            await chrome.storage.local.set({
              clioMatters: mattersData.matters
            });
            console.log('✅ Fetched Clio matters:', mattersData.matters);
          }
        } catch (error) {
          console.error('Error fetching matters:', error);
        }
        
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

        // Create a beautiful success page
        chrome.tabs.create({
          url: chrome.runtime.getURL('auth-success.html') + '?success=true&email=' + encodeURIComponent(data.email),
          active: true
        }, (newTab) => {
          // Send success message to the new tab after it loads
          setTimeout(() => {
            chrome.tabs.sendMessage(newTab.id, {
              action: 'authResult',
              success: true,
              email: data.email
            }).catch(err => {
              console.log('🔧 DEBUG: Could not send message to tab, tab may have closed');
            });
          }, 500);
        });

        // Close the callback tab
        chrome.tabs.remove(details.tabId);
      } else {
        // Show error notification
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon128.png',
          title: 'Clio Login Failed',
          message: data.error || 'Authentication failed. Please try logging out of Clio and try again.'
        });
        
        // Create a beautiful error page
        chrome.tabs.create({
          url: chrome.runtime.getURL('auth-success.html') + '?error=' + encodeURIComponent(data.error || 'Authentication failed'),
          active: true
        }, (newTab) => {
          // Send error message to the new tab after it loads
          setTimeout(() => {
            chrome.tabs.sendMessage(newTab.id, {
              action: 'authResult',
              success: false,
              error: data.error || 'Authentication failed'
            }).catch(err => {
              console.log('🔧 DEBUG: Could not send message to tab, tab may have closed');
            });
          }, 500);
        });
        
        // Close the callback tab
        chrome.tabs.remove(details.tabId);
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
      
      // Create a beautiful error page
      chrome.tabs.create({
        url: chrome.runtime.getURL('auth-success.html') + '?error=' + encodeURIComponent(error.message),
        active: true
      }, (newTab) => {
        // Send error message to the new tab after it loads
        setTimeout(() => {
          chrome.tabs.sendMessage(newTab.id, {
            action: 'authResult',
            success: false,
            error: error.message
          }).catch(err => {
            console.log('🔧 DEBUG: Could not send message to tab, tab may have closed');
          });
        }, 500);
      });
      
      // Close the callback tab
      chrome.tabs.remove(details.tabId);
    }
  }
});

// Add function to check auth status
async function checkClioAuthStatus() {
  const { clioUserEmail, clioAuthTime, isClioAuthenticated } = await chrome.storage.local.get([
    'clioUserEmail', 
    'clioAuthTime',
    'isClioAuthenticated'
  ]);
  
  if (!clioUserEmail || !isClioAuthenticated) {
    console.log('🔧 DEBUG: No Clio authentication found');
    return false;
  }
  
  // Check if auth is older than 12 hours
  const authAge = Date.now() - (clioAuthTime || 0);
  if (authAge > 12 * 60 * 60 * 1000) {
    console.log('🔧 DEBUG: Clio authentication expired');
    // Clear expired auth
    await chrome.storage.local.remove([
      'clioUserEmail', 
      'clioAuthTime', 
      'clioMatterId',
      'isClioAuthenticated'
    ]);
    return false;
  }
  
  console.log('🔧 DEBUG: Clio authentication valid');
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
      let errorMessage = 'Failed to fetch matters';
      try {
        const data = await response.json();
        errorMessage = data.error || data.detail || `HTTP ${response.status}`;
        
        // Check for specific backend errors that might indicate server needs restart
        if (errorMessage.includes('region') || errorMessage.includes('ClioUser')) {
          errorMessage = 'Backend server needs restart. Please ask your backend developer to restart the Django server.';
        }
      } catch (e) {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
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
    
    // Log helpful info if no matter selected
    if (!selectedMatterId) {
      console.log('🔧 DEBUG: No matter selected - email will be analyzed without matter association');
      // Remove matter_id if not set to avoid backend validation errors
      delete emailData.matter_id;
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