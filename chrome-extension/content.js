// Content script for email monitoring
class EmailAnalyzer {
  constructor() {
    this.isGmail = window.location.hostname === 'mail.google.com';
    this.isOutlook = window.location.hostname.includes('outlook');
    this.lastAnalyzedEmail = '';
    this.showLoadNotification();
    this.init();
  }

  showLoadNotification() {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #3b82f6;
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
      <div style="font-weight: bold; margin-bottom: 8px;">🔌 Involex Extension Loaded</div>
      <div>Email analysis is ready!</div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
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
      
      sendButton.addEventListener('click', async (e) => {
        // Don't prevent the default action
        // Instead, wait a moment to let Gmail process the email
        setTimeout(async () => {
          try {
            await this.analyzeGmailEmail(composeWindow);
          } catch (error) {
            console.error('Failed to analyze email:', error);
          }
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
    document.addEventListener('click', async (e) => {
      const target = e.target;
      
      // Check if clicked element is a send button
      if (target.matches('[data-tooltip*="Send"], [aria-label*="Send"]') || 
          target.closest('[data-tooltip*="Send"], [aria-label*="Send"]')) {
        
        const composeWindow = target.closest('[role="dialog"]');
        if (composeWindow) {
          // Don't prevent default, let Gmail handle the send
          setTimeout(async () => {
            try {
              await this.analyzeGmailEmail(composeWindow);
            } catch (error) {
              console.error('Failed to analyze email:', error);
            }
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
      
      if (!emailData) {
        console.log('No email data extracted, skipping analysis');
        return;
      }

      console.log('Extracted email data:', emailData);
      
      if (this.isValidEmail(emailData)) {
        const emailKey = this.generateEmailKey(emailData);
        
        if (emailKey !== this.lastAnalyzedEmail) {
          this.lastAnalyzedEmail = emailKey;
          await this.sendToAPI(emailData);
        } else {
          console.log('Email already analyzed, skipping duplicate');
        }
      } else {
        console.log('Invalid email data:', emailData);
      }
    } catch (error) {
      console.error('Error analyzing Gmail email:', error);
      // Don't show error notification for every failed attempt
      // Only show for specific error cases in sendToAPI
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
      
      // Try multiple selectors for recipient email with better targeting
      const toSelectors = [
        // Direct input fields
        'input[name="to"]',
        'input[type="email"]',
        // Gmail specific selectors
        'div[data-hovercard-id*="@"]',
        'span[email]',
        'div[email]',
        // Aria labeled fields
        '[aria-label*="To"] input',
        '[aria-label*="Recipients"] input',
        // Data attribute based selectors
        '[data-recipient-type="to"] input',
        'div[data-name="to"] input',
        // Generic email fields
        '[contenteditable="true"][aria-label*="To"]',
        // Chip elements (Gmail's recipient bubbles)
        'div[role="chip"] span[email]',
        'div[role="chip"] [data-hovercard-id*="@"]'
      ];
      
      // First try within the compose window
      for (const selector of toSelectors) {
        const elements = composeWindow.querySelectorAll(selector);
        for (const element of elements) {
          const emailValue = element.value || 
                           element.getAttribute('email') || 
                           element.getAttribute('data-hovercard-id') || 
                           element.textContent;
          
          if (emailValue && emailValue.includes('@')) {
            const match = emailValue.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
            if (match) {
              recipient = match[1];
              break;
            }
          }
        }
        if (recipient) break;
      }
      
      // If still no recipient found, try to extract from spans with email pattern
      if (!recipient) {
        const allElements = composeWindow.querySelectorAll('*');
        for (const element of allElements) {
          const text = element.textContent || element.innerText || '';
          const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
          if (emailMatch) {
            recipient = emailMatch[1];
            break;
          }
        }
      }

      // Extract subject with improved selectors
      const subjectSelectors = [
        'input[name="subjectbox"]',
        'input[placeholder*="Subject"]',
        'input[aria-label*="Subject"]',
        '[role="textbox"][aria-label*="Subject"]',
        'input.aoT'
      ];
      
      let subject = '';
      for (const selector of subjectSelectors) {
        const element = composeWindow.querySelector(selector);
        if (element) {
          subject = element.value || element.textContent || '';
          if (subject) break;
        }
      }

      // Extract email body with improved selectors
      const bodySelectors = [
        '[contenteditable="true"][role="textbox"]',
        '[contenteditable="true"] div[dir="ltr"]',
        '[role="textbox"][contenteditable="true"]',
        'div.Am.Al.editable'
      ];
      
      let emailContent = '';
      for (const selector of bodySelectors) {
        const element = composeWindow.querySelector(selector);
        if (element) {
          emailContent = element.textContent || element.innerText || '';
          if (emailContent) break;
        }
      }

      // Get sender email (current user) - improved logic
      let senderEmail = '';
      
      // Try to get from account info with improved selectors
      const senderSelectors = [
        '[data-hovercard-id*="@"]',
        '[title*="@"]',
        '.gb_A',
        '[aria-label*="Account"]',
        '.gb_uc',
        '[data-tooltip*="@"]',
        '.gmail-attr [email]'
      ];
      
      for (const selector of senderSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          const emailValue = element.getAttribute('data-hovercard-id') || 
                           element.getAttribute('title') || 
                           element.getAttribute('data-tooltip') ||
                           element.getAttribute('email') ||
                           element.textContent || 
                           element.innerText;
          
          if (emailValue && emailValue.includes('@')) {
            const match = emailValue.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
            if (match) {
              senderEmail = match[1];
              break;
            }
          }
        }
      }

      console.log('🔧 DEBUG: Extracted email data:', {
        recipient_found: Boolean(recipient),
        recipient: recipient,
        subject_found: Boolean(subject),
        content_length: emailContent?.length || 0,
        sender_found: Boolean(senderEmail),
        sender: senderEmail
      });

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
    try {
      // Email validation regex
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      
      // Check if all required fields exist
      if (!emailData || typeof emailData !== 'object') {
        console.error('❌ DEBUG: Invalid email data object:', emailData);
        return false;
      }

      // Validate each field
      const hasContent = Boolean(emailData.email_content && emailData.email_content.length > 10);
      const hasRecipient = Boolean(emailData.recipient_email && emailData.recipient_email.trim());
      const hasValidRecipient = hasRecipient && emailRegex.test(emailData.recipient_email.trim());
      const hasSubject = Boolean(emailData.subject && emailData.subject.trim());
      
      // Log validation details
      console.log('🔧 DEBUG: Email validation details:', {
        hasContent,
        hasRecipient,
        hasValidRecipient,
        hasSubject,
        contentLength: emailData.email_content?.length || 0,
        recipient: emailData.recipient_email || 'none',
        subject: emailData.subject || 'none'
      });
      
      return hasContent && hasValidRecipient && hasSubject;
    } catch (error) {
      console.error('❌ DEBUG: Error in email validation:', error);
      return false;
    }
  }

  generateEmailKey(emailData) {
    return `${emailData.recipient_email}-${emailData.subject}-${emailData.email_content.substring(0, 50)}`;
  }

  async sendToAPI(emailData) {
    try {
      // Validate email data before sending
      if (!this.isValidEmail(emailData)) {
        console.error('❌ DEBUG: Invalid email data, not sending to API:', emailData);
        this.showErrorNotification('Invalid email data. Please ensure all fields are filled out correctly.');
        return;
      }

      console.log('🔧 DEBUG: Sending email data:', {
        content_length: emailData.email_content?.length,
        sender: emailData.sender_email,
        recipient: emailData.recipient_email,
        subject: emailData.subject
      });
      
      // Check if extension context is valid
      if (!chrome.runtime?.id) {
        console.error('❌ Extension context invalidated - reloading extension');
        // Try to recover by reloading the page after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 1000);
        return;
      }
      
      // Send to background script with error handling and timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Message timeout')), 5000);
      });

      const messagePromise = new Promise((resolve) => {
        chrome.runtime.sendMessage({
          action: 'analyzeEmail',
          data: emailData
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('❌ Chrome runtime error:', chrome.runtime.lastError);
            this.showErrorNotification('Extension error: ' + chrome.runtime.lastError.message);
            resolve(null);
            return;
          }
          resolve(response);
        });
      });

      // Race between timeout and message
      const response = await Promise.race([messagePromise, timeoutPromise])
        .catch(error => {
          console.error('❌ Message sending failed:', error);
          this.showErrorNotification('Failed to send message to extension: ' + error.message);
          return null;
        });

      if (!response) return;
      
      console.log('🔧 DEBUG: Background script response:', response);
      
      if (response.success) {
        console.log('✅ Email analysis completed:', response.result);
        this.showAnalysisResult(response.result);
      } else {
        console.error('❌ Email analysis failed:', response?.error);
        this.showErrorNotification(
          typeof response?.error === 'object' 
            ? `${response.error.message}\n${response.error.details || ''}`
            : (response?.error || 'API request failed')
        );
      }
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