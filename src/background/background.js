/**
 * ClauseGuard - Background Service Worker
 * Handles message routing, LLM API calls, and badge updates
 * @module background/background
 */

import { analyzePolicyWithLLM } from '../utils/llm.js';
import { RISK_GRADES } from '../utils/constants.js';

// =============================================================================
// State
// =============================================================================

/** Cache for analysis results per tab */
const analysisCache = new Map();

// =============================================================================
// Badge Management
// =============================================================================

/**
 * Update extension badge with risk grade
 * @param {number} tabId - Tab ID
 * @param {string} grade - Risk grade (A-F or ?)
 */
async function updateBadge(tabId, grade) {
  const config = RISK_GRADES[grade] || RISK_GRADES['?'];

  await Promise.all([
    chrome.action.setBadgeText({ tabId, text: grade }),
    chrome.action.setBadgeBackgroundColor({ tabId, color: config.color }),
    chrome.action.setTitle({ tabId, title: `ClauseGuard - ${config.label}` })
  ]);
}

/**
 * Clear badge for a tab
 * @param {number} tabId - Tab ID
 */
async function clearBadge(tabId) {
  await chrome.action.setBadgeText({ tabId, text: '' });
}

/**
 * Show indicator badge (e.g., links found or error)
 * @param {number} tabId - Tab ID
 * @param {string} text - Badge text
 * @param {string} color - Badge color
 */
async function showIndicator(tabId, text, color) {
  await Promise.all([
    chrome.action.setBadgeText({ tabId, text }),
    chrome.action.setBadgeBackgroundColor({ tabId, color })
  ]);
}

// =============================================================================
// Message Handlers
// =============================================================================

/**
 * Handle legal links detection from content script
 * @param {number} tabId - Tab ID
 * @param {Object} data - Detection data
 */
function handleLegalLinksFound(tabId, data) {
  if (!tabId) return;

  analysisCache.set(tabId, {
    status: 'detected',
    domain: data.domain,
    links: data.links,
    analysis: null,
    timestamp: Date.now()
  });

  showIndicator(tabId, '!', '#6366f1');
}

/**
 * Analyze policy text with LLM
 * @param {Object} data - Analysis request data
 * @param {number} tabId - Tab ID
 * @returns {Promise<Object>} Analysis result
 */
async function handleAnalyzePolicy(data, tabId) {
  const { policyText, policyType, url, domain } = data;

  // Update cache to analyzing state
  const existing = analysisCache.get(tabId) || {};
  analysisCache.set(tabId, {
    ...existing,
    status: 'analyzing',
    policyType,
    url,
    domain
  });

  try {
    const analysis = await analyzePolicyWithLLM(policyText, policyType);

    // Store successful result
    analysisCache.set(tabId, {
      ...analysisCache.get(tabId),
      status: 'complete',
      analysis,
      timestamp: Date.now()
    });

    await updateBadge(tabId, analysis.grade);
    return { success: true, analysis };

  } catch (error) {
    // Store error state
    analysisCache.set(tabId, {
      ...analysisCache.get(tabId),
      status: 'error',
      error: error.message
    });

    await showIndicator(tabId, '!', '#ef4444');
    throw error;
  }
}

// =============================================================================
// Message Router
// =============================================================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const tabId = sender.tab?.id;

  switch (message.type) {
    case 'LEGAL_LINKS_FOUND':
      handleLegalLinksFound(tabId, message.data);
      break;

    case 'ANALYZE_POLICY':
      handleAnalyzePolicy(message.data, tabId)
        .then(sendResponse)
        .catch(err => sendResponse({ error: err.message }));
      return true; // Keep channel open for async

    case 'GET_ANALYSIS':
      sendResponse(analysisCache.get(message.tabId || tabId) || null);
      break;

    case 'CLEAR_CACHE':
      analysisCache.delete(tabId);
      clearBadge(tabId);
      sendResponse({ success: true });
      break;

    default:
      // Ignore unknown message types silently
      break;
  }
});

// =============================================================================
// Lifecycle Events
// =============================================================================

// Clean up when tabs close
chrome.tabs.onRemoved.addListener((tabId) => {
  analysisCache.delete(tabId);
});

// Initialize on install
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.storage.local.set({
      settings: { endpoint: '', model: '', apiKey: '' },
      analyzedSites: {}
    });
  }
});
