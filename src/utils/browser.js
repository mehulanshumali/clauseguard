/**
 * ClauseGuard - Browser API Abstraction Layer
 * Provides unified API for Chrome, Firefox, and Safari
 * @module utils/browser
 */

/**
 * Detect current browser environment
 * @returns {'chrome' | 'firefox' | 'safari' | 'unknown'}
 */
export function detectBrowser() {
  if (typeof chrome !== 'undefined' && chrome.runtime?.id) {
    if (typeof browser !== 'undefined') {
      return 'firefox';
    }
    if (navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome')) {
      return 'safari';
    }
    return 'chrome';
  }
  if (typeof browser !== 'undefined' && browser.runtime?.id) {
    return 'firefox';
  }
  return 'unknown';
}

/**
 * Get the browser API object (chrome or browser)
 * Firefox uses 'browser' with Promises, Chrome uses 'chrome' with callbacks
 * This returns a unified Promise-based API
 */
const api = (() => {
  // Firefox and Safari use the 'browser' namespace with Promises
  if (typeof browser !== 'undefined' && browser.runtime) {
    return browser;
  }
  // Chrome uses 'chrome' namespace - already supports Promises in MV3
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    return chrome;
  }
  // Fallback for testing environments
  return null;
})();

// =============================================================================
// Storage API
// =============================================================================

export const storage = {
  /**
   * Get items from local storage
   * @param {string | string[] | object} keys - Keys to retrieve
   * @returns {Promise<object>}
   */
  async get(keys) {
    if (!api?.storage?.local) {
      console.warn('Storage API not available');
      return {};
    }
    return api.storage.local.get(keys);
  },

  /**
   * Set items in local storage
   * @param {object} items - Key-value pairs to store
   * @returns {Promise<void>}
   */
  async set(items) {
    if (!api?.storage?.local) {
      console.warn('Storage API not available');
      return;
    }
    return api.storage.local.set(items);
  },

  /**
   * Remove items from local storage
   * @param {string | string[]} keys - Keys to remove
   * @returns {Promise<void>}
   */
  async remove(keys) {
    if (!api?.storage?.local) {
      console.warn('Storage API not available');
      return;
    }
    return api.storage.local.remove(keys);
  },

  /**
   * Clear all local storage
   * @returns {Promise<void>}
   */
  async clear() {
    if (!api?.storage?.local) {
      console.warn('Storage API not available');
      return;
    }
    return api.storage.local.clear();
  }
};

// =============================================================================
// Tabs API
// =============================================================================

export const tabs = {
  /**
   * Query tabs
   * @param {object} queryInfo - Query parameters
   * @returns {Promise<Array>}
   */
  async query(queryInfo) {
    if (!api?.tabs?.query) {
      console.warn('Tabs API not available');
      return [];
    }
    return api.tabs.query(queryInfo);
  },

  /**
   * Send message to a tab
   * @param {number} tabId - Tab ID
   * @param {object} message - Message to send
   * @returns {Promise<any>}
   */
  async sendMessage(tabId, message) {
    if (!api?.tabs?.sendMessage) {
      throw new Error('Tabs API not available');
    }
    return api.tabs.sendMessage(tabId, message);
  },

  /**
   * Get current active tab
   * @returns {Promise<object|null>}
   */
  async getCurrent() {
    const results = await this.query({ active: true, currentWindow: true });
    return results[0] || null;
  }
};

// =============================================================================
// Runtime API
// =============================================================================

export const runtime = {
  /**
   * Send message to background script
   * @param {object} message - Message to send
   * @returns {Promise<any>}
   */
  async sendMessage(message) {
    if (!api?.runtime?.sendMessage) {
      throw new Error('Runtime API not available');
    }
    return api.runtime.sendMessage(message);
  },

  /**
   * Add message listener
   * @param {function} callback - Message handler
   */
  onMessage: {
    addListener(callback) {
      if (api?.runtime?.onMessage) {
        api.runtime.onMessage.addListener(callback);
      }
    },
    removeListener(callback) {
      if (api?.runtime?.onMessage) {
        api.runtime.onMessage.removeListener(callback);
      }
    }
  },

  /**
   * Add install listener
   * @param {function} callback - Install handler
   */
  onInstalled: {
    addListener(callback) {
      if (api?.runtime?.onInstalled) {
        api.runtime.onInstalled.addListener(callback);
      }
    }
  },

  /**
   * Get extension URL
   * @param {string} path - Path within extension
   * @returns {string}
   */
  getURL(path) {
    if (api?.runtime?.getURL) {
      return api.runtime.getURL(path);
    }
    return path;
  }
};

// =============================================================================
// Action API (Browser Action / Page Action)
// =============================================================================

export const action = {
  /**
   * Set badge text
   * @param {object} details - Badge details
   * @returns {Promise<void>}
   */
  async setBadgeText(details) {
    // MV3 uses 'action', MV2 uses 'browserAction'
    const actionApi = api?.action || api?.browserAction;
    if (actionApi?.setBadgeText) {
      return actionApi.setBadgeText(details);
    }
  },

  /**
   * Set badge background color
   * @param {object} details - Color details
   * @returns {Promise<void>}
   */
  async setBadgeBackgroundColor(details) {
    const actionApi = api?.action || api?.browserAction;
    if (actionApi?.setBadgeBackgroundColor) {
      return actionApi.setBadgeBackgroundColor(details);
    }
  },

  /**
   * Set title (tooltip)
   * @param {object} details - Title details
   * @returns {Promise<void>}
   */
  async setTitle(details) {
    const actionApi = api?.action || api?.browserAction;
    if (actionApi?.setTitle) {
      return actionApi.setTitle(details);
    }
  }
};

// =============================================================================
// Export unified API
// =============================================================================

export default {
  detectBrowser,
  storage,
  tabs,
  runtime,
  action,
  // Expose raw API for advanced use cases
  raw: api
};
