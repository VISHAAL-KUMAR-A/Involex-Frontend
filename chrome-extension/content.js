// Content script for email monitoring
class EmailAnalyzer {
  constructor() {
    this.isGmail = window.location.hostname === 'mail.google.com';
    this.isOutlook = window.location.hostname.includes('outlook');
    this.lastAnalyzedEmail = null;
    this.matterSelectContainer = null;
    this.matters = [];
    this.clioUserEmail = null;
    this.selectedMatterId = null;
    this.initializeClioData();
    this.init();
  }

  async initializeClioData() {
    try {
      const data = await new Promise(resolve => {
        chrome.storage.local.get(['clioUserEmail', 'clioMatters', 'isClioAuthenticated'], resolve);
      });
      
      if (data.isClioAuthenticated && data.clioUserEmail) {
        this.clioUserEmail = data.clioUserEmail;
        this.matters = data.clioMatters || [];
        console.log('🔧 DEBUG: Initialized Clio data:', {
          email: this.clioUserEmail,
          mattersCount: this.matters.length,
          isAuthenticated: true
        });
        
        // If no matters loaded, try to fetch them
        if (!this.matters.length) {
          await this.loadClioMatters();
        }
      } else {
        this.clioUserEmail = null;
        this.matters = [];
        console.log('🔧 DEBUG: Not authenticated with Clio');
      }
    } catch (error) {
      console.error('Error initializing Clio data:', error);
      this.clioUserEmail = null;
      this.matters = [];
    }
  }

  init() {
    console.log('Involex Email Analyzer initialized');
    
    if (this.isGmail) {
      this.initGmailMonitoring();
    } else if (this.isOutlook) {
      this.initOutlookMonitoring();
    }

    // Refresh Clio data every 5 minutes
    setInterval(() => {
      this.initializeClioData();
    }, 5 * 60 * 1000);
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

  // Load Clio matters
  async loadClioMatters() {
    try {
      // First check if we have matters in storage
      const data = await new Promise(resolve => {
        chrome.storage.local.get(['clioUserEmail', 'clioMatters'], resolve);
      });
      
      if (data.clioMatters && data.clioMatters.length > 0) {
        this.matters = data.clioMatters;
        console.log('🔧 DEBUG: Loaded matters from storage:', this.matters.length);
        return;
      }
      
      if (data.clioUserEmail) {
        // Fetch from API if not in storage
        const response = await fetch(`http://127.0.0.1:8000/api/clio/matters/?email=${encodeURIComponent(data.clioUserEmail)}`);
        if (response.ok) {
          const mattersData = await response.json();
          this.matters = mattersData.matters;
          
          // Store for future use
          await chrome.storage.local.set({
            clioMatters: mattersData.matters
          });
          
          console.log('🔧 DEBUG: Fetched and stored matters:', this.matters.length);
        }
      }
    } catch (error) {
      console.error('Error loading Clio matters:', error);
    }
  }

  // Create matter selection UI
  async createMatterSelect() {
    // Remove existing container if it exists
    if (this.matterSelectContainer) {
      this.matterSelectContainer.remove();
    }

    // Create new container
    this.matterSelectContainer = document.createElement('div');
    this.matterSelectContainer.className = 'involex-matter-select';
    this.matterSelectContainer.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      z-index: 9999;
      display: none;
      min-width: 300px;
    `;
    
    // Ensure we have matters loaded
    if (!this.matters.length) {
      await this.loadClioMatters();
    }
    
    const content = `
      <h3 style="margin: 0 0 15px">Select Clio Matter</h3>
      ${this.matters.length ? `
        <select id="clioMatterSelect" style="width: 100%; padding: 8px; margin-bottom: 15px">
          <option value="">Select a matter...</option>
          ${this.matters.map(matter => 
            `<option value="${matter.id}">${matter.display_number} - ${matter.description}</option>`
          ).join('')}
        </select>
      ` : '<p style="color: red; margin-bottom: 15px">No matters found. Please check your Clio connection.</p>'}
      <div style="display: flex; justify-content: flex-end; gap: 10px;">
        <button id="cancelMatterSelect" style="padding: 8px 16px; border: 1px solid #ccc; background: white; border-radius: 4px">Cancel</button>
        <button id="confirmMatterSelect" style="padding: 8px 16px; background: #4CAF50; color: white; border: none; border-radius: 4px" ${!this.matters.length ? 'disabled' : ''}>Confirm</button>
      </div>
    `;
    
    this.matterSelectContainer.innerHTML = content;
    document.body.appendChild(this.matterSelectContainer);
    
    // Add event listeners
    document.getElementById('cancelMatterSelect').addEventListener('click', () => {
      this.matterSelectContainer.style.display = 'none';
    });
    
    return this.matterSelectContainer;
  }

  // Show matter selection dialog
  async showMatterSelect() {
    return new Promise(async (resolve) => {
      const container = await this.createMatterSelect();
      container.style.display = 'block';
      
      const select = document.getElementById('clioMatterSelect');
      const confirmBtn = document.getElementById('confirmMatterSelect');
      
      const handleConfirm = () => {
        const matterId = select ? select.value : '';
        container.style.display = 'none';
        if (confirmBtn) {
          confirmBtn.removeEventListener('click', handleConfirm);
        }
        resolve(matterId);
      };
      
      const handleCancel = () => {
        container.style.display = 'none';
        const cancelBtn = document.getElementById('cancelMatterSelect');
        if (cancelBtn) {
          cancelBtn.removeEventListener('click', handleCancel);
        }
        if (confirmBtn) {
          confirmBtn.removeEventListener('click', handleConfirm);
        }
        resolve('');
      };
      
      if (confirmBtn) {
        confirmBtn.addEventListener('click', handleConfirm);
      }
      
      const cancelBtn = document.getElementById('cancelMatterSelect');
      if (cancelBtn) {
        cancelBtn.addEventListener('click', handleCancel);
      }
    });
  }

  setupGmailComposeMonitoring(composeWindow) {
    const sendButton = composeWindow.querySelector('[data-tooltip="Send ‪(Ctrl+Enter)‬"], [data-tooltip="Send"], [aria-label*="Send"]');
    
    if (sendButton && !sendButton.hasAttribute('data-involex-monitored')) {
      sendButton.setAttribute('data-involex-monitored', 'true');
      
      const handleSendClick = async (e) => {
        // Prevent the default send action
        e.preventDefault();
        e.stopPropagation();
        
        console.log('🔧 DEBUG: Send button clicked');
        
        // Check extension context first
        if (!chrome.runtime?.id) {
          console.error('❌ Extension context invalid - proceeding with normal send');
          this.proceedWithSend(sendButton, handleSendClick);
          return;
        }
        
        const emailData = this.extractGmailData(composeWindow);
        console.log('🔧 DEBUG: Extracted email data:', {
          hasContent: !!emailData?.email_content,
          contentLength: emailData?.email_content?.length,
          recipient: emailData?.recipient_email,
          sender: emailData?.sender_email,
          subject: emailData?.subject
        });
        
        if (emailData && this.isValidEmail(emailData)) {
          // Use instance variables instead of storage calls
          if (!this.clioUserEmail) {
            console.error('❌ Not authenticated with Clio. Please login first.');
            this.showErrorNotification('Please login to Clio first');
            this.proceedWithSend(sendButton, handleSendClick);
            return;
          }

          // Override sender email
          emailData.sender_email = this.clioUserEmail;
          
          // Always require matter selection for each email
          try {
            const matterId = await this.showMatterSelect();
            if (!matterId) {
              console.error('❌ No matter selected');
              this.showErrorNotification('Please select a matter');
              return;
            }
            emailData.matter_id = matterId;
            this.selectedMatterId = matterId; // Store for reference

            console.log('🔧 DEBUG: Using Clio credentials:', {
              email: this.clioUserEmail,
              matterId: matterId
            });
            
            const emailKey = this.generateEmailKey(emailData);
            if (emailKey !== this.lastAnalyzedEmail) {
              this.lastAnalyzedEmail = emailKey;
              
              // Use Promise for API call
              try {
                await Promise.race([
                  this.sendToAPI(emailData),
                  new Promise((_, reject) => setTimeout(() => reject(new Error('API timeout')), 10000))
                ]);
                console.log('✅ API call successful, proceeding with send');
                this.proceedWithSend(sendButton, handleSendClick);
              } catch (error) {
                console.error('❌ API call failed:', error);
                this.proceedWithSend(sendButton, handleSendClick);
              }
            } else {
              console.log('🔧 DEBUG: Skipping duplicate analysis');
              this.proceedWithSend(sendButton, handleSendClick);
            }
          } catch (error) {
            console.error('❌ Error in matter selection:', error);
            this.showErrorNotification('Error selecting matter: ' + error.message);
            this.proceedWithSend(sendButton, handleSendClick);
          }
        } else {
          console.log('🔧 DEBUG: Invalid email data');
          this.proceedWithSend(sendButton, handleSendClick);
        }
      };
      
      // Add the event listener
      sendButton.addEventListener('click', handleSendClick);
    }
  }

  proceedWithSend(sendButton, eventHandler) {
    try {
      // Clean up event listener
      sendButton.removeEventListener('click', eventHandler);
      
      // Try to find the Gmail send button
      const realSendButton = sendButton.closest('[role="dialog"]').querySelector('[data-tooltip="Send ‪(Ctrl+Enter)‬"], [data-tooltip="Send"]');
      if (realSendButton) {
        realSendButton.click();
      } else {
        // Fallback to form submission
        const form = sendButton.closest('form');
        if (form) {
          form.submit();
        } else {
          // Last resort: dispatch native click event
          const nativeEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
          });
          sendButton.dispatchEvent(nativeEvent);
        }
      }
    } catch (error) {
      console.error('Error sending email:', error);
      // Last resort: dispatch native click event
      const nativeEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      sendButton.dispatchEvent(nativeEvent);
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
        'div[data-name="to"] input',
        // Add more specific Gmail selectors
        'div[role="presentation"] span[email]',
        'div[role="presentation"] span[data-hovercard-id*="@"]',
        'div[aria-label*="To"] span[email]',
        'div[aria-label*="To"] span[data-hovercard-id*="@"]'
      ];
      
      // Try each selector
      for (const selector of toSelectors) {
        const elements = composeWindow.querySelectorAll(selector);
        for (const element of elements) {
          const emailValue = element.value || 
                           element.getAttribute('email') || 
                           element.getAttribute('data-hovercard-id') || 
                           element.textContent;
          if (emailValue && emailValue.includes('@')) {
            recipient = emailValue.trim();
            console.log('🔧 DEBUG: Found recipient using selector:', selector);
            break;
          }
        }
        if (recipient) break;
      }
      
      // If still no recipient found, try to extract from spans with email pattern
      if (!recipient) {
        console.log('🔧 DEBUG: No recipient found with selectors, trying text search');
        const allElements = composeWindow.querySelectorAll('*');
        for (const element of allElements) {
          const text = element.textContent || element.innerText || '';
          const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
          if (emailMatch) {
            recipient = emailMatch[1].trim();
            console.log('🔧 DEBUG: Found recipient in text content');
            break;
          }
        }
      }

      // Extract subject with better error handling
      let subject = '';
      const subjectField = composeWindow.querySelector('input[name="subjectbox"], [placeholder*="Subject"], input[aria-label*="Subject"]');
      if (subjectField) {
        subject = subjectField.value || '';
        console.log('🔧 DEBUG: Found subject:', subject ? 'Yes' : 'No');
      }

      // Extract email body with better handling
      let emailContent = '';
      const bodyField = composeWindow.querySelector('[contenteditable="true"][role="textbox"], [contenteditable="true"] div[dir="ltr"], [role="textbox"][contenteditable="true"]');
      if (bodyField) {
        emailContent = bodyField.innerText || bodyField.textContent || '';
        console.log('🔧 DEBUG: Found email content:', emailContent ? 'Yes' : 'No');
      }

      // Get sender email (current user)
      let senderEmail = '';
      
      // Try Gmail profile menu
      const profileButton = document.querySelector('a[aria-label*="Google Account"]');
      if (profileButton) {
        const accountInfo = profileButton.getAttribute('aria-label');
        const emailMatch = accountInfo?.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
        if (emailMatch) {
          senderEmail = emailMatch[1].trim();
        }
      }
      
      // Fallback to other methods if needed
      if (!senderEmail) {
        const senderSelectors = [
          '[data-hovercard-id*="@"]',
          '[title*="@"]',
          '.gb_A',
          '[aria-label*="Account"]',
          '.gb_uc'
        ];
        
        for (const selector of senderSelectors) {
          const element = document.querySelector(selector);
          if (element) {
            const emailValue = element.getAttribute('data-hovercard-id') || 
                             element.getAttribute('title') || 
                             element.textContent || 
                             element.innerText;
            
            if (emailValue && emailValue.includes('@')) {
              senderEmail = emailValue.trim();
              break;
            }
          }
        }
      }

      console.log('🔧 DEBUG: Extracted recipient:', recipient);
      console.log('🔧 DEBUG: Extracted sender:', senderEmail);
      console.log('🔧 DEBUG: Extracted subject:', subject);
      console.log('🔧 DEBUG: Email content length:', emailContent.length);

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
    
    const hasContent = emailData.email_content && emailData.email_content.length > 10;
    const hasRecipient = emailData.recipient_email && emailRegex.test(emailData.recipient_email);
    const hasSender = emailData.sender_email && emailRegex.test(emailData.sender_email);
    const hasSubject = emailData.subject && emailData.subject.length > 0;
    
    console.log('🔧 DEBUG: Email validation details:', {
      hasContent,
      hasRecipient,
      hasSender,
      hasSubject,
      contentLength: emailData.email_content?.length
    });
    
    return hasContent && hasRecipient && hasSender && hasSubject;
  }

  generateEmailKey(emailData) {
    return `${emailData.recipient_email}-${emailData.subject}-${emailData.email_content.substring(0, 50)}`;
  }

  async sendToAPI(emailData) {
    try {
      console.log('🔧 DEBUG: Preparing to send email data:', {
        content_length: emailData.email_content?.length,
        sender: emailData.sender_email,
        recipient: emailData.recipient_email,
        subject_length: emailData.subject?.length,
        matter_id: emailData.matter_id
      });
      
      // Validate data before sending
      if (!emailData.email_content || emailData.email_content.length < 1) {
        throw new Error('Email content is empty');
      }
      if (!emailData.sender_email) {
        throw new Error('Sender email is missing');
      }
      if (!emailData.recipient_email) {
        throw new Error('Recipient email is missing');
      }
      if (!emailData.subject) {
        throw new Error('Subject is missing');
      }
      if (!emailData.matter_id) {
        throw new Error('Matter ID is missing');
      }
      
      // Use background script for API call to avoid CORS issues
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          action: 'analyzeEmail',
          data: emailData
        }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          
          if (response && response.success) {
            console.log('✅ Email analysis completed:', response.result);
            this.showAnalysisResult(response.result);
            resolve(response.result);
          } else {
            reject(new Error(response?.error || 'API request failed'));
          }
        });
      });
    } catch (error) {
      console.error('❌ DEBUG: Error in sendToAPI:', error);
      this.showErrorNotification('Extension error: ' + error.message);
      throw error;
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
console.log('🔧 DEBUG: Involex extension loaded on:', window.location.hostname);
const emailAnalyzer = new EmailAnalyzer(); 