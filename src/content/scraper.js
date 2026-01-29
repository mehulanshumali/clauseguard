/**
 * ClauseGuard - Content Script
 * Detects legal links, consent forms, and extracts policy text
 * @module content/scraper
 */

(function() {
  'use strict';

  // ===========================================================================
  // Configuration
  // ===========================================================================

  /** Patterns to identify legal document links */
  const LEGAL_PATTERNS = [
    /privacy/i,
    /terms/i,
    /conditions/i,
    /\btos\b/i,
    /eula/i,
    /legal/i,
    /policy/i,
    /gdpr/i,
    /ccpa/i,
    /data.*protection/i,
    /cookie/i,
    /user.*agreement/i
  ];

  /** Patterns to classify policy types */
  const TYPE_PATTERNS = {
    privacy: /privacy|data.*protection|gdpr|ccpa/i,
    terms: /terms|conditions|tos|agreement/i,
    eula: /eula|license/i,
    cookie: /cookie/i,
    acceptable: /acceptable.*use/i
  };

  /** Patterns to detect consent language */
  const CONSENT_PATTERNS = [
    /by (signing up|registering|creating|continuing|clicking)/i,
    /you agree to/i,
    /i (agree|accept|consent)/i,
    /accepting (the|our)/i,
    /agree to (the|our)/i
  ];

  /** Selectors for cookie/consent banners */
  const BANNER_SELECTORS = [
    '[class*="cookie"]',
    '[class*="consent"]',
    '[class*="gdpr"]',
    '[id*="cookie"]',
    '[id*="consent"]',
    '[class*="privacy-banner"]',
    '[class*="notice-banner"]',
    '[role="dialog"][aria-label*="cookie"]',
    '[role="dialog"][aria-label*="consent"]'
  ];

  /** Selectors for main content areas */
  const CONTENT_SELECTORS = [
    'article',
    'main',
    '[role="main"]',
    '.content',
    '.policy',
    '.terms',
    '.privacy',
    '#content',
    '#main-content',
    '.container'
  ];

  /** Selectors for form areas that may contain consent */
  const FORM_SELECTORS = [
    'form',
    '[class*="signup"]',
    '[class*="sign-up"]',
    '[class*="register"]',
    '[class*="login"]',
    '[class*="auth"]',
    '[role="dialog"]',
    '[class*="modal"]'
  ];

  // ===========================================================================
  // Utility Functions
  // ===========================================================================

  /**
   * Get current domain without www prefix
   * @returns {string} Domain name
   */
  function getCurrentDomain() {
    return window.location.hostname.replace('www.', '');
  }

  /**
   * Check if element matches legal patterns
   * @param {HTMLElement} element - Link element
   * @returns {boolean} Is legal link
   */
  function isLegalLink(element) {
    const href = element.href || '';
    const text = element.textContent || '';
    const ariaLabel = element.getAttribute('aria-label') || '';
    const combined = `${href} ${text} ${ariaLabel}`;

    return LEGAL_PATTERNS.some(pattern => pattern.test(combined));
  }

  /**
   * Determine policy type from URL and text
   * @param {string} url - Link URL
   * @param {string} text - Link text
   * @returns {string} Policy type
   */
  function getPolicyType(url, text) {
    const combined = `${url} ${text}`.toLowerCase();

    for (const [type, pattern] of Object.entries(TYPE_PATTERNS)) {
      if (pattern.test(combined)) return type;
    }
    return 'unknown';
  }

  /**
   * Send message to background script (safely)
   * @param {string} type - Message type
   * @param {Object} data - Message data
   */
  function sendToBackground(type, data) {
    try {
      chrome.runtime.sendMessage({ type, data });
    } catch {
      // Extension context invalidated - ignore silently
    }
  }

  // ===========================================================================
  // Scanning Functions
  // ===========================================================================

  /**
   * Scan page for legal document links
   * @returns {Array<Object>} Array of legal link objects
   */
  function scanForLegalLinks() {
    const links = document.querySelectorAll('a[href]');
    const legalLinks = [];
    const seenUrls = new Set();

    links.forEach(link => {
      if (!isLegalLink(link)) return;

      const url = link.href;
      if (seenUrls.has(url)) return;
      seenUrls.add(url);

      legalLinks.push({
        url,
        text: link.textContent.trim(),
        type: getPolicyType(url, link.textContent),
        fullUrl: new URL(url, window.location.origin).href
      });
    });

    return legalLinks;
  }

  /**
   * Detect cookie/consent banners on page
   * @returns {Object} Banner detection result
   */
  function detectCookieBanner() {
    for (const selector of BANNER_SELECTORS) {
      try {
        const banner = document.querySelector(selector);
        if (banner?.offsetParent !== null) {
          return {
            found: true,
            text: banner.textContent.substring(0, 500)
          };
        }
      } catch {
        // Invalid selector - skip
      }
    }
    return { found: false };
  }

  /**
   * Detect consent text in sign-up forms
   * @returns {Array<Object>} Array of consent form objects
   */
  function detectConsentText() {
    const results = [];

    // Check form elements
    const formElements = document.querySelectorAll(FORM_SELECTORS.join(', '));

    formElements.forEach(form => {
      const text = form.textContent || '';
      if (!CONSENT_PATTERNS.some(p => p.test(text))) return;

      // Find legal links within form
      const linkedPolicies = [];
      form.querySelectorAll('a[href]').forEach(link => {
        if (isLegalLink(link)) {
          linkedPolicies.push({
            url: link.href,
            text: link.textContent.trim(),
            type: getPolicyType(link.href, link.textContent)
          });
        }
      });

      // Extract consent sentence
      const sentences = text.split(/[.!?]/);
      const consentSentence = sentences.find(s =>
        CONSENT_PATTERNS.some(p => p.test(s))
      );

      results.push({
        context: 'signup_form',
        consentText: consentSentence?.trim().substring(0, 200) || 'Consent required',
        linkedPolicies
      });
    });

    // Check consent checkboxes
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      const label = checkbox.closest('label') ||
                    document.querySelector(`label[for="${checkbox.id}"]`) ||
                    checkbox.parentElement;

      if (!label) return;

      const labelText = label.textContent || '';
      if (!CONSENT_PATTERNS.some(p => p.test(labelText))) return;

      const linkedPolicies = [];
      label.querySelectorAll('a[href]').forEach(link => {
        if (isLegalLink(link)) {
          linkedPolicies.push({
            url: link.href,
            text: link.textContent.trim(),
            type: getPolicyType(link.href, link.textContent)
          });
        }
      });

      results.push({
        context: 'consent_checkbox',
        consentText: labelText.trim().substring(0, 200),
        linkedPolicies,
        isRequired: checkbox.required
      });
    });

    return results;
  }

  /**
   * Extract main text content from policy page
   * @returns {string} Cleaned policy text
   */
  function extractPolicyText() {
    let contentElement = null;

    // Find main content area
    for (const selector of CONTENT_SELECTORS) {
      try {
        const el = document.querySelector(selector);
        if (el?.textContent.length > 1000) {
          contentElement = el;
          break;
        }
      } catch {
        // Invalid selector - skip
      }
    }

    // Fallback to body
    if (!contentElement) {
      contentElement = document.body;
    }

    // Clone and clean
    const clone = contentElement.cloneNode(true);
    clone.querySelectorAll('script, style, nav, footer, header, aside, [role="navigation"]')
      .forEach(el => el.remove());

    return (clone.textContent || '').replace(/\s+/g, ' ').trim();
  }

  /**
   * Check if current page is a policy page
   * @returns {boolean} Is policy page
   */
  function isCurrentPagePolicy() {
    const url = window.location.href;
    const title = document.title;
    return LEGAL_PATTERNS.some(p => p.test(url) || p.test(title));
  }

  // ===========================================================================
  // Initialization
  // ===========================================================================

  /**
   * Initialize content script
   */
  function init() {
    // Skip non-HTTP pages
    if (!window.location.protocol.startsWith('http')) return;

    const domain = getCurrentDomain();
    const legalLinks = scanForLegalLinks();
    const cookieBanner = detectCookieBanner();

    // Notify background if links found
    if (legalLinks.length > 0) {
      sendToBackground('LEGAL_LINKS_FOUND', {
        domain,
        links: legalLinks,
        cookieBanner: cookieBanner.found,
        pageUrl: window.location.href
      });
    }

    // Auto-detect policy pages
    if (isCurrentPagePolicy()) {
      sendToBackground('POLICY_PAGE_DETECTED', {
        domain,
        url: window.location.href,
        type: getPolicyType(window.location.href, document.title),
        text: extractPolicyText(),
        title: document.title
      });
    }
  }

  // ===========================================================================
  // Message Handler
  // ===========================================================================

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
      case 'GET_LEGAL_LINKS':
        sendResponse({
          links: scanForLegalLinks(),
          domain: getCurrentDomain(),
          consentForms: detectConsentText()
        });
        break;

      case 'EXTRACT_POLICY':
        sendResponse({
          text: extractPolicyText(),
          url: window.location.href,
          title: document.title
        });
        break;

      case 'GET_PAGE_INFO':
        sendResponse({
          domain: getCurrentDomain(),
          url: window.location.href,
          title: document.title,
          isPolicy: isCurrentPagePolicy(),
          legalLinks: scanForLegalLinks(),
          cookieBanner: detectCookieBanner()
        });
        break;

      default:
        sendResponse({ error: 'Unknown message type' });
    }
    return true;
  });

  // ===========================================================================
  // Run
  // ===========================================================================

  // Initialize when ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Re-scan for SPAs (debounced)
  let lastScan = Date.now();
  const observer = new MutationObserver(() => {
    const now = Date.now();
    if (now - lastScan > 2000) {
      lastScan = now;
      init();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

})();
