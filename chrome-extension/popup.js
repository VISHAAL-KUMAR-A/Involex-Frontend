// Popup script
document.addEventListener('DOMContentLoaded', async () => {
  await updateStatus();
  await loadRecentAnalyses();
  
  document.getElementById('settingsBtn').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
  });

  document.getElementById('debugBtn').addEventListener('click', async () => {
    try {
      // Get current tab info
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Get extension info
      const manifest = chrome.runtime.getManifest();
      
      // Get storage info
      const storage = await chrome.storage.local.get();
      const analysisCount = Object.keys(storage).filter(key => key.startsWith('analysis_')).length;
      
      // Create debug info
      const debugInfo = {
        extension: {
          id: chrome.runtime.id,
          version: manifest.version,
          state: chrome.runtime.getURL('') ? 'Active' : 'Inactive'
        },
        currentPage: {
          url: tab.url,
          title: tab.title
        },
        storage: {
          analysisCount,
          lastAnalysis: storage[Object.keys(storage).filter(key => key.startsWith('analysis_')).sort().pop()]
        }
      };
      
      // Display debug info
      console.log('🔧 DEBUG INFO:', debugInfo);
      
      // Create a debug tab
      const debugHtml = `
        <html>
          <head>
            <title>Involex Debug Info</title>
            <style>
              body { font-family: monospace; padding: 20px; }
              pre { background: #f3f4f6; padding: 15px; border-radius: 5px; }
            </style>
          </head>
          <body>
            <h2>Involex Debug Information</h2>
            <pre>${JSON.stringify(debugInfo, null, 2)}</pre>
          </body>
        </html>
      `;
      
      const blob = new Blob([debugHtml], { type: 'text/html' });
      const debugUrl = URL.createObjectURL(blob);
      chrome.tabs.create({ url: debugUrl });
      
    } catch (error) {
      console.error('🔧 DEBUG: Error getting debug info:', error);
      alert('Error getting debug info: ' + error.message);
    }
  });
});

async function updateStatus() {
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const apiStatus = document.getElementById('apiStatus');
  
  try {
    // Check if we're on a supported email site
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const isEmailSite = tab.url.includes('mail.google.com') || 
                       tab.url.includes('outlook.live.com') || 
                       tab.url.includes('outlook.office.com');
    
    if (isEmailSite) {
      statusDot.className = 'status-dot active';
      statusText.textContent = 'Active on this page';
      
      // Test API connection
      try {
        const response = await fetch('http://127.0.0.1:8000/api/summarize-email/', {
          method: 'OPTIONS',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Origin': chrome.runtime.getURL('')
          }
        });
        
        if (response.ok) {
          apiStatus.textContent = 'API connection: ✅ Connected';
          console.log('🔧 DEBUG: API connection successful');
        } else {
          apiStatus.textContent = 'API connection: ❌ Error ' + response.status;
          console.error('🔧 DEBUG: API connection failed:', response.status);
        }
      } catch (error) {
        apiStatus.textContent = 'API connection: ❌ Disconnected';
        console.error('🔧 DEBUG: API connection error:', error);
      }
    } else {
      statusDot.className = 'status-dot inactive';
      statusText.textContent = 'Navigate to Gmail or Outlook';
      apiStatus.textContent = 'Visit supported email provider to use';
    }
  } catch (error) {
    console.error('🔧 DEBUG: Status check error:', error);
    statusDot.className = 'status-dot inactive';
    statusText.textContent = 'Error checking status';
    apiStatus.textContent = 'Unable to determine status';
  }
}

async function loadRecentAnalyses() {
  try {
    console.log('🔧 DEBUG: Loading recent analyses...');
    const storage = await chrome.storage.local.get();
    console.log('🔧 DEBUG: Storage data:', storage);
    
    const analyses = Object.entries(storage)
      .filter(([key]) => key.startsWith('analysis_'))
      .map(([key, value]) => ({ key, ...value }))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 5); // Show last 5 analyses
    
    console.log('🔧 DEBUG: Filtered analyses:', analyses);
    
    const analysesList = document.getElementById('analysesList');
    
    if (analyses.length === 0) {
      console.log('🔧 DEBUG: No analyses found');
      analysesList.innerHTML = '<div class="no-analyses">No email analyses yet</div>';
      return;
    }
    
    analysesList.innerHTML = analyses.map(analysis => {
      const date = new Date(analysis.timestamp).toLocaleString();
      const summary = analysis.result.summary.length > 100 
        ? analysis.result.summary.substring(0, 100) + '...'
        : analysis.result.summary;
      
      return `
        <div class="analysis-item">
          <div class="analysis-subject">${analysis.emailData.subject || 'No Subject'}</div>
          <div class="analysis-summary">${summary}</div>
          <div class="analysis-meta">
            ${analysis.emailData.recipient_email} • ${date} • 
            ${analysis.result.word_count_original}→${analysis.result.word_count_summary} words
          </div>
        </div>
      `;
    }).join('');
    
  } catch (error) {
    console.error('🔧 DEBUG: Error loading analyses:', error);
    document.getElementById('analysesList').innerHTML = 
      '<div class="no-analyses">Error loading analyses</div>';
  }
}

// Refresh data every 10 seconds when popup is open (less frequent)
setInterval(() => {
  loadRecentAnalyses(); // Only reload analyses, not API status
}, 10000); 