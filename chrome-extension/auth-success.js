// External script for auth-success.html to comply with CSP
document.addEventListener('DOMContentLoaded', function() {
    console.log('Auth success page loaded');
    
    // Check URL parameters to determine success/failure
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const success = urlParams.get('success');
    const email = urlParams.get('email');
    const code = urlParams.get('code');
    
    if (success === 'true' && email) {
        // Direct success from URL parameters
        showSuccess(decodeURIComponent(email));
    } else if (error) {
        // Direct error from URL parameters
        showError(decodeURIComponent(error));
    } else if (code) {
        // We have a code, show loading while processing
        showLoading();
    } else {
        showError('No authentication information received');
    }
    
    function showSuccess(email) {
        document.getElementById('loading-content').style.display = 'none';
        document.getElementById('error-content').style.display = 'none';
        document.getElementById('success-content').style.display = 'block';
        
        if (email) {
            document.getElementById('user-email').textContent = `Logged in as: ${email}`;
        }
        
        // Auto-close after 3 seconds
        setTimeout(() => {
            window.close();
        }, 3000);
    }
    
    function showError(message) {
        document.getElementById('loading-content').style.display = 'none';
        document.getElementById('success-content').style.display = 'none';
        document.getElementById('error-content').style.display = 'block';
        
        document.getElementById('error-message').textContent = message || 'Authentication failed';
    }
    
    function showLoading() {
        document.getElementById('success-content').style.display = 'none';
        document.getElementById('error-content').style.display = 'none';
        document.getElementById('loading-content').style.display = 'block';
    }
    
    // Listen for messages from background script
    if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            console.log('Auth page received message:', message);
            if (message.action === 'authResult') {
                if (message.success) {
                    showSuccess(message.email);
                } else {
                    showError(message.error);
                }
            }
        });
    }
    
    // Add close button functionality
    const closeBtn = document.getElementById('close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            window.close();
        });
    }
    
    // Make functions global so they can be called from background script
    window.showSuccess = showSuccess;
    window.showError = showError;
    window.showLoading = showLoading;
});