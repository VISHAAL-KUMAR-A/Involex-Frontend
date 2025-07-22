// Popup script
document.addEventListener('DOMContentLoaded', async () => {
  await updateStatus();
  await loadRecentAnalyses();
  
  document.getElementById('settingsBtn').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
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
      
             // Test API connection (use debug endpoint)
       try {
         const response = await fetch('http://127.0.0.1:8000/api/summarize-email/', {
           method: 'OPTIONS'
         });
         apiStatus.textContent = 'API connection: ✅ Connected';
       } catch (error) {
         apiStatus.textContent = 'API connection: ❌ Disconnected';
       }
    } else {
      statusDot.className = 'status-dot inactive';
      statusText.textContent = 'Navigate to Gmail or Outlook';
      apiStatus.textContent = 'Visit supported email provider to use';
    }
  } catch (error) {
    statusDot.className = 'status-dot inactive';
    statusText.textContent = 'Error checking status';
    apiStatus.textContent = 'Unable to determine status';
  }
}

async function loadRecentAnalyses() {
  try {
    const storage = await chrome.storage.local.get();
    const analyses = Object.entries(storage)
      .filter(([key]) => key.startsWith('analysis_'))
      .map(([key, value]) => ({ key, ...value }))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 5); // Show last 5 analyses
    
    const analysesList = document.getElementById('analysesList');
    
    if (analyses.length === 0) {
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
    console.error('Error loading analyses:', error);
    document.getElementById('analysesList').innerHTML = 
      '<div class="no-analyses">Error loading analyses</div>';
  }
}

// Refresh data every 10 seconds when popup is open (less frequent)
setInterval(() => {
  loadRecentAnalyses(); // Only reload analyses, not API status
}, 10000); 