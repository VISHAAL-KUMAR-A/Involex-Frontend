// Content script for email monitoring
class EmailAnalyzer {
  constructor() {
    this.isGmail = window.location.hostname === 'mail.google.com';
    this.isOutlook = window.location.hostname.includes('outlook');
    this.lastAnalyzedEmail = '';
    this.init();
  }

  init() {
    console.log('Involex Email Analyzer initialized');
    
    if (this.isGmail) {
      this.initGmailMonitoring();
    } else if (this.isOutlook) {
      this.initOutlookMonitoring();
    }
  }

  initGmailMonitoring() {
    // Monitor for Gmail compose windows
    this.observeGmailChanges();
    
    // Monitor send button clicks
    this.monitorGmailSendButton();
  }

  initOutlookMonitoring() {
    // Monitor for Outlook compose windows
    this.observeOutlookChanges();
    
    // Monitor send button clicks
    this.monitorOutlookSendButton();
  }

  observeGmailChanges() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length > 0) {
          // Check for new compose windows
          const composeWindows = document.querySelectorAll('[role="dialog"]');
          composeWindows.forEach(window => {
            this.setupGmailComposeMonitoring(window);
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  observeOutlookChanges() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length > 0) {
          // Check for new compose windows
          const composeWindows = document.querySelectorAll('[data-app-section="MailCompose"]');
          composeWindows.forEach(window => {
            this.setupOutlookComposeMonitoring(window);
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  setupGmailComposeMonitoring(composeWindow) {
    const sendButton = composeWindow.querySelector('[data-tooltip="Send ‪(Ctrl+Enter)‬"], [data-tooltip="Send"], [aria-label*="Send"]');
    
    if (sendButton && !sendButton.hasAttribute('data-involex-monitored')) {
      sendButton.setAttribute('data-involex-monitored', 'true');
      
      sendButton.addEventListener('click', (e) => {
        setTimeout(() => {
          this.analyzeGmailEmail(composeWindow);
        }, 100);
      });
    }
  }

  setupOutlookComposeMonitoring(composeWindow) {
    const sendButton = composeWindow.querySelector('[data-automation-id="send-button"], [aria-label*="Send"]');
    
    if (sendButton && !sendButton.hasAttribute('data-involex-monitored')) {
      sendButton.setAttribute('data-involex-monitored', 'true');
      
      sendButton.addEventListener('click', (e) => {
        setTimeout(() => {
          this.analyzeOutlookEmail(composeWindow);
        }, 100);
      });
    }
  }

  monitorGmailSendButton() {
    document.addEventListener('click', (e) => {
      const target = e.target;
      
      // Check if clicked element is a send button
      if (target.matches('[data-tooltip*="Send"], [aria-label*="Send"]') || 
          target.closest('[data-tooltip*="Send"], [aria-label*="Send"]')) {
        
        const composeWindow = target.closest('[role="dialog"]');
        if (composeWindow) {
          setTimeout(() => {
            this.analyzeGmailEmail(composeWindow);
          }, 500);
        }
      }
    });
  }

  monitorOutlookSendButton() {
    document.addEventListener('click', (e) => {
      const target = e.target;
      
      if (target.matches('[data-automation-id="send-button"]') || 
          target.closest('[data-automation-id="send-button"]')) {
        
        const composeWindow = target.closest('[data-app-section="MailCompose"]');
        if (composeWindow) {
          setTimeout(() => {
            this.analyzeOutlookEmail(composeWindow);
          }, 500);
        }
      }
    });
  }

  async analyzeGmailEmail(composeWindow) {
    try {
      const emailData = this.extractGmailData(composeWindow);
      
      if (emailData && this.isValidEmail(emailData)) {
        const emailKey = this.generateEmailKey(emailData);
        
        if (emailKey !== this.lastAnalyzedEmail) {
          this.lastAnalyzedEmail = emailKey;
          await this.sendToAPI(emailData);
        }
      }
    } catch (error) {
      console.error('Error analyzing Gmail email:', error);
    }
  }

  async analyzeOutlookEmail(composeWindow) {
    try {
      const emailData = this.extractOutlookData(composeWindow);
      
      if (emailData && this.isValidEmail(emailData)) {
        const emailKey = this.generateEmailKey(emailData);
        
        if (emailKey !== this.lastAnalyzedEmail) {
          this.lastAnalyzedEmail = emailKey;
          await this.sendToAPI(emailData);
        }
      }
    } catch (error) {
      console.error('Error analyzing Outlook email:', error);
    }
  }

  extractGmailData(composeWindow) {
    try {
      // Extract recipient(s) - improved logic
      let recipient = '';
      
      // Try multiple selectors for recipient email
      const toSelectors = [
        'input[type="email"]',
        '[data-hovercard-id*="@"]',
        'input[name="to"]',
        'span[email]',
        'div[email]',
        '[aria-label*="To"] input',
        'div[data-name="to"] input'
      ];
      
      for (const selector of toSelectors) {
        const elements = composeWindow.querySelectorAll(selector);
        for (const element of elements) {
          const emailValue = element.value || element.getAttribute('email') || element.getAttribute('data-hovercard-id') || element.textContent;
          if (emailValue && emailValue.includes('@')) {
            recipient = emailValue;
            break;
          }
        }
        if (recipient) break;
      }
      
      // If still no recipient found, try to extract from spans with email pattern
      if (!recipient) {
        const allSpans = composeWindow.querySelectorAll('span, div');
        for (const span of allSpans) {
          const text = span.textContent || span.innerText || '';
          const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
          if (emailMatch) {
            recipient = emailMatch[1];
            break;
          }
        }
      }

      // Extract subject
      const subjectField = composeWindow.querySelector('input[name="subjectbox"], [placeholder*="Subject"], input[aria-label*="Subject"]');
      const subject = subjectField ? subjectField.value : '';

      // Extract email body
      const bodyField = composeWindow.querySelector('[contenteditable="true"][role="textbox"], [contenteditable="true"] div[dir="ltr"], [role="textbox"][contenteditable="true"]');
      const emailContent = bodyField ? bodyField.textContent || bodyField.innerText : '';

      // Get sender email (current user) - improved logic
      let senderEmail = '';
      
      // Try to get from account info
      const senderSelectors = [
        '[data-hovercard-id*="@"]',
        '[title*="@"]',
        '.gb_A',
        '[aria-label*="Account"]',
        '.gb_uc' // Gmail user container
      ];
      
      for (const selector of senderSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          const emailValue = element.getAttribute('data-hovercard-id') || 
                           element.getAttribute('title') || 
                           element.textContent || 
                           element.innerText;
          
          if (emailValue && emailValue.includes('@')) {
            senderEmail = emailValue;
            break;
          }
        }
      }
      
      // If no sender found, try URL parameter (Gmail sometimes has it)
      if (!senderEmail) {
        const urlMatch = window.location.href.match(/authuser=(\d+)/);
        if (urlMatch) {
          // Try to get from Gmail account switcher
          const accountElements = document.querySelectorAll('[data-email*="@"]');
          if (accountElements.length > 0) {
            senderEmail = accountElements[0].getAttribute('data-email');
          }
        }
      }

      console.log('🔧 DEBUG: Extracted recipient:', recipient);
      console.log('🔧 DEBUG: Extracted sender:', senderEmail);

      return {
        email_content: emailContent.trim(),
        sender_email: senderEmail.trim(),
        recipient_email: recipient.trim(),
        subject: subject.trim()
      };
    } catch (error) {
      console.error('Error extracting Gmail data:', error);
      return null;
    }
  }

  extractOutlookData(composeWindow) {
    try {
      // Extract recipient(s)
      const toField = composeWindow.querySelector('[data-automation-id="to-field"] input, [placeholder*="To"] input');
      const recipient = toField ? toField.value : '';

      // Extract subject
      const subjectField = composeWindow.querySelector('[data-automation-id="subject-field"] input, input[placeholder*="Subject"]');
      const subject = subjectField ? subjectField.value : '';

      // Extract email body
      const bodyField = composeWindow.querySelector('[data-automation-id="editor"] [contenteditable="true"], .rps_1fb8 [contenteditable="true"]');
      const emailContent = bodyField ? bodyField.textContent || bodyField.innerText : '';

      // Get sender email
      const senderElement = document.querySelector('[data-automation-id="primaryAccountDisplayName"]') ||
                           document.querySelector('.me-email') ||
                           document.querySelector('[title*="@"]');
      
      let senderEmail = '';
      if (senderElement) {
        senderEmail = senderElement.textContent || senderElement.getAttribute('title') || '';
      }

      return {
        email_content: emailContent.trim(),
        sender_email: senderEmail.trim(),
        recipient_email: recipient.trim(),
        subject: subject.trim()
      };
    } catch (error) {
      console.error('Error extracting Outlook data:', error);
      return null;
    }
  }

  isValidEmail(emailData) {
    // Email validation regex
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    const isValid = emailData.email_content && 
           emailData.email_content.length > 10 && 
           emailData.recipient_email &&
           emailRegex.test(emailData.recipient_email) && // Validate recipient email format
           emailData.subject;
    
    console.log('🔧 DEBUG: Email validation result:', isValid);
    console.log('🔧 DEBUG: Recipient email valid:', emailRegex.test(emailData.recipient_email));
    
    return isValid;
  }

  generateEmailKey(emailData) {
    return `${emailData.recipient_email}-${emailData.subject}-${emailData.email_content.substring(0, 50)}`;
  }

  async sendToAPI(emailData) {
    try {
      console.log('🔧 DEBUG: Extracted email data:', emailData);
      console.log('🔧 DEBUG: Email content length:', emailData.email_content.length);
      console.log('🔧 DEBUG: Sender email:', emailData.sender_email);
      console.log('🔧 DEBUG: Recipient email:', emailData.recipient_email);
      console.log('🔧 DEBUG: Subject:', emailData.subject);
      
      // Check if extension context is valid
      if (!chrome.runtime?.id) {
        console.error('❌ Extension context invalidated - please reload extension');
        this.showErrorNotification('Extension needs to be reloaded. Please refresh the page.');
        return;
      }
      
      // Send to background script with error handling
      chrome.runtime.sendMessage({
        action: 'analyzeEmail',
        data: emailData
      }, (response) => {
        // Check for chrome.runtime.lastError
        if (chrome.runtime.lastError) {
          console.error('❌ Chrome runtime error:', chrome.runtime.lastError);
          this.showErrorNotification('Extension error: ' + chrome.runtime.lastError.message);
          return;
        }
        
        console.log('🔧 DEBUG: Background script response:', response);
        
        if (response && response.success) {
          console.log('✅ Email analysis completed:', response.result);
          this.showAnalysisResult(response.result);
        } else {
          console.error('❌ Email analysis failed:', response?.error);
          this.showErrorNotification(response?.error || 'API request failed');
        }
      });
    } catch (error) {
      console.error('🔧 DEBUG: Error in sendToAPI:', error);
      this.showErrorNotification('Extension error: ' + error.message);
    }
  }

  showAnalysisResult(result) {
    // Create a notification or popup to show the analysis result
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 15px;
      border-radius: 5px;
      z-index: 10000;
      max-width: 300px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      font-family: Arial, sans-serif;
      font-size: 14px;
    `;
    
    notification.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 8px;">📧 Email Analyzed!</div>
      <div><strong>Summary:</strong> ${result.summary}</div>
      <div style="margin-top: 8px; font-size: 12px;">
        <strong>Words:</strong> ${result.word_count_original} → ${result.word_count_summary}<br>
        <strong>Time:</strong> ${result.processing_time}s
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Remove notification after 8 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 8000);
  }

  showErrorNotification(error) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ef4444;
      color: white;
      padding: 15px;
      border-radius: 5px;
      z-index: 10000;
      max-width: 300px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      font-family: Arial, sans-serif;
      font-size: 14px;
    `;
    
    notification.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 8px;">❌ Analysis Failed</div>
      <div>Error: ${error}</div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 8000);
  }
}

// Initialize the email analyzer
document.addEventListener('DOMContentLoaded', () => {
  try {
    console.log('🔧 DEBUG: Involex extension loaded on:', window.location.hostname);
    const emailAnalyzer = new EmailAnalyzer();
  } catch (error) {
    console.error('❌ Failed to initialize EmailAnalyzer:', error);
  }
}); 