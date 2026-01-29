/**
 * ClauseGuard - Popup UI Controller
 * Handles user interactions and displays analysis results
 * @module popup/popup
 */

import { RISK_GRADES, DIRTY_DOZEN, POLICY_TYPES } from '../utils/constants.js';

// =============================================================================
// Configuration
// =============================================================================

const API_PRESETS = Object.freeze({
  openai: { endpoint: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
  groq: { endpoint: 'https://api.groq.com/openai/v1', model: 'llama-3.1-70b-versatile' },
  gemini: { endpoint: 'https://generativelanguage.googleapis.com/v1beta/openai', model: 'gemini-2.0-flash' }
});

// =============================================================================
// State
// =============================================================================

let currentTabId = null;
let currentDomain = '';

// =============================================================================
// DOM Elements (cached on load)
// =============================================================================

const $ = (id) => document.getElementById(id);
const $$ = (selector) => document.querySelectorAll(selector);

const elements = {
  // Header
  settingsBtn: $('settingsBtn'),
  domainName: $('domainName'),

  // Tabs
  tabs: $$('.tab'),
  tabContents: $$('.tab-content'),

  // Overview
  scoreBadge: $('scoreBadge'),
  scoreLabel: $('scoreLabel'),
  scoreDesc: $('scoreDesc'),
  scanBtn: $('scanBtn'),
  loadingState: $('loadingState'),
  linksSection: $('linksSection'),
  highlightsSection: $('highlightsSection'),
  goodList: $('goodList'),
  badList: $('badList'),
  quotesSection: $('quotesSection'),
  quotesList: $('quotesList'),

  // Dirty Dozen
  dozenGrid: $('dozenGrid'),

  // Settings
  settingsPanel: $('settingsPanel'),
  closeSettings: $('closeSettings'),
  apiEndpoint: $('apiEndpoint'),
  modelName: $('modelName'),
  apiKey: $('apiKey'),
  presetBtns: $$('.preset-btn'),
  saveSettings: $('saveSettings')
};

// =============================================================================
// Initialization
// =============================================================================

document.addEventListener('DOMContentLoaded', init);

async function init() {
  try {
    await initializeTab();
    await loadSettings();
    await checkSettingsStatus();
    initializeDirtyDozen();
    await checkExistingAnalysis();
    await fetchLegalLinks();
    setupEventListeners();
  } catch (error) {
    showError('Failed to initialize extension');
  }
}

async function initializeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTabId = tab.id;

  try {
    const url = new URL(tab.url);
    currentDomain = url.hostname.replace('www.', '');
    elements.domainName.textContent = currentDomain;
  } catch {
    currentDomain = 'Unknown';
    elements.domainName.textContent = 'Unable to detect domain';
  }
}

async function checkSettingsStatus() {
  const { settings } = await chrome.storage.local.get('settings');

  if (!isConfigured(settings)) {
    elements.scoreLabel.textContent = 'Setup Required';
    elements.scoreDesc.textContent = 'Configure your LLM API in settings first.';
    elements.scanBtn.innerHTML = '<span class="scan-icon">⚙️</span><span>Open Settings</span>';
    elements.scanBtn.onclick = openSettings;
  }
}

// =============================================================================
// Settings Management
// =============================================================================

function isConfigured(settings) {
  return Boolean(settings?.endpoint && settings?.model && settings?.apiKey);
}

async function loadSettings() {
  const { settings = {} } = await chrome.storage.local.get('settings');
  elements.apiEndpoint.value = settings.endpoint || '';
  elements.modelName.value = settings.model || '';
  elements.apiKey.value = settings.apiKey || '';
}

async function saveSettingsHandler() {
  const settings = {
    endpoint: elements.apiEndpoint.value.trim(),
    model: elements.modelName.value.trim(),
    apiKey: elements.apiKey.value.trim()
  };

  if (!settings.endpoint || !settings.model) {
    showError('Please enter API endpoint and model name.');
    return;
  }

  await chrome.storage.local.set({ settings });

  // Show success feedback
  const btn = elements.saveSettings;
  btn.textContent = 'Saved!';
  setTimeout(() => {
    btn.textContent = 'Save Settings';
    closeSettings();
    // Reset scan button if settings now configured
    if (isConfigured(settings)) {
      elements.scanBtn.innerHTML = '<span class="scan-icon">🔍</span><span>Scan Legal Policies</span>';
      elements.scanBtn.onclick = startAnalysis;
    }
  }, 1000);
}

function applyPreset(presetName) {
  const preset = API_PRESETS[presetName];
  if (preset) {
    elements.apiEndpoint.value = preset.endpoint;
    elements.modelName.value = preset.model;
  }
}

function openSettings() {
  elements.settingsPanel.classList.remove('hidden');
}

function closeSettings() {
  elements.settingsPanel.classList.add('hidden');
}

// =============================================================================
// Analysis
// =============================================================================

async function startAnalysis() {
  const { settings } = await chrome.storage.local.get('settings');

  if (!isConfigured(settings)) {
    openSettings();
    return;
  }

  setLoadingState(true);

  try {
    const pageResponse = await getPageContent();
    const analysisResponse = await requestAnalysis(pageResponse);

    if (analysisResponse.error) {
      throw new Error(analysisResponse.error);
    }

    displayAnalysis(analysisResponse.analysis);
  } catch (error) {
    handleAnalysisError(error);
  } finally {
    setLoadingState(false);
  }
}

async function getPageContent() {
  try {
    const response = await chrome.tabs.sendMessage(currentTabId, { type: 'EXTRACT_POLICY' });

    if (!response?.text || response.text.length < 100) {
      throw new Error('Could not extract policy text. Make sure you\'re on a Terms of Service or Privacy Policy page.');
    }

    return response;
  } catch {
    throw new Error('Please refresh this page first, then try scanning again.');
  }
}

async function requestAnalysis(pageResponse) {
  return chrome.runtime.sendMessage({
    type: 'ANALYZE_POLICY',
    data: {
      policyText: pageResponse.text,
      policyType: 'Terms of Service / Privacy Policy',
      url: pageResponse.url,
      domain: currentDomain
    }
  });
}

function setLoadingState(loading) {
  elements.scanBtn.disabled = loading;
  elements.scanBtn.innerHTML = loading
    ? '<span class="scan-icon">⏳</span><span>Analyzing...</span>'
    : '<span class="scan-icon">🔍</span><span>Scan Legal Policies</span>';
  elements.loadingState.classList.toggle('hidden', !loading);

  if (loading) {
    elements.highlightsSection.classList.add('hidden');
    elements.quotesSection.classList.add('hidden');
  }
}

function handleAnalysisError(error) {
  showError(`Analysis failed: ${error.message}`);
  elements.scoreBadge.textContent = '!';
  elements.scoreBadge.className = 'score-badge';
  elements.scoreLabel.textContent = 'Analysis Failed';
  elements.scoreDesc.textContent = error.message;
}

// =============================================================================
// Display Functions
// =============================================================================

function displayAnalysis(analysis) {
  const grade = analysis.grade || '?';
  const gradeInfo = RISK_GRADES[grade] || RISK_GRADES['?'];

  elements.scoreBadge.textContent = grade;
  elements.scoreBadge.className = `score-badge grade-${grade.toLowerCase()}`;
  elements.scoreLabel.textContent = gradeInfo.label;
  elements.scoreDesc.textContent = analysis.summary || gradeInfo.description;

  if (analysis.dirtyDozen) {
    updateDirtyDozen(analysis.dirtyDozen);
  }

  displayHighlights(analysis.highlights);
  displayCriticalQuotes(analysis.criticalQuotes);
}

function displayHighlights(highlights) {
  if (!highlights) return;

  elements.highlightsSection.classList.remove('hidden');

  elements.goodList.innerHTML = highlights.good?.length
    ? highlights.good.map(item => `<li>${escapeHtml(item)}</li>`).join('')
    : '<li>No notable good practices found.</li>';

  elements.badList.innerHTML = highlights.bad?.length
    ? highlights.bad.map(item => `<li>${escapeHtml(item)}</li>`).join('')
    : '<li>No major concerns found.</li>';
}

function displayCriticalQuotes(quotes) {
  if (!quotes?.length) return;

  elements.quotesSection.classList.remove('hidden');
  elements.quotesList.innerHTML = quotes.map(quote => `
    <div class="quote-item">
      <div class="quote-text">"${escapeHtml(quote.text)}"</div>
      <div class="quote-concern">${escapeHtml(quote.concern)}</div>
    </div>
  `).join('');
}

async function checkExistingAnalysis() {
  const response = await chrome.runtime.sendMessage({
    type: 'GET_ANALYSIS',
    tabId: currentTabId
  });

  if (response?.analysis) {
    displayAnalysis(response.analysis);
  }
}

async function fetchLegalLinks() {
  try {
    const response = await chrome.tabs.sendMessage(currentTabId, { type: 'GET_LEGAL_LINKS' });
    renderLegalLinks(response);
  } catch {
    elements.linksSection.innerHTML = '<p class="no-links">Refresh the page to enable scanning.</p>';
  }
}

function renderLegalLinks(response) {
  const parts = [];

  // Consent forms
  if (response?.consentForms?.length) {
    parts.push('<div class="consent-alert"><h3>⚠️ Consent Required</h3>');
    response.consentForms.forEach(form => {
      parts.push(`<p class="consent-text">"${escapeHtml(form.consentText)}"</p>`);
      if (form.linkedPolicies?.length) {
        parts.push('<ul class="consent-links">');
        form.linkedPolicies.forEach(link => {
          parts.push(`<li><span class="link-text">${escapeHtml(link.text)}</span><span class="link-type">${link.type}</span></li>`);
        });
        parts.push('</ul>');
      }
    });
    parts.push('</div>');
  }

  // Regular legal links
  if (response?.links?.length) {
    parts.push('<h3>Detected Legal Documents</h3><ul class="links-list">');
    response.links.forEach(link => {
      const text = escapeHtml(link.text) || 'Legal Document';
      const type = POLICY_TYPES[link.type] || link.type;
      parts.push(`<li><span class="link-text">${text}</span><span class="link-type">${type}</span></li>`);
    });
    parts.push('</ul>');
  }

  elements.linksSection.innerHTML = parts.length
    ? parts.join('')
    : '<p class="no-links">No legal documents detected on this page.</p>';
}

// =============================================================================
// Dirty Dozen
// =============================================================================

function initializeDirtyDozen() {
  elements.dozenGrid.innerHTML = DIRTY_DOZEN.map(item => `
    <div class="dozen-item unknown" data-id="${item.id}">
      <div class="dozen-icon">${item.icon}</div>
      <div class="dozen-name">${item.name}</div>
      <div class="dozen-status">Not analyzed</div>
    </div>
  `).join('');
}

function updateDirtyDozen(data) {
  const statusLabels = {
    safe: '✓ Safe',
    warning: '⚠ Concerning',
    danger: '✗ Red Flag',
    unknown: '? Unknown'
  };

  DIRTY_DOZEN.forEach(item => {
    const element = document.querySelector(`.dozen-item[data-id="${item.id}"]`);
    if (!element) return;

    const status = data[item.id] || { status: 'unknown', finding: 'Not analyzed' };
    element.className = `dozen-item ${status.status}`;
    element.querySelector('.dozen-status').textContent = status.finding || statusLabels[status.status];
  });
}

// =============================================================================
// Tabs
// =============================================================================

function switchTab(tabName) {
  elements.tabs.forEach(tab => {
    tab.classList.toggle('active', tab.dataset.tab === tabName);
  });
  elements.tabContents.forEach(content => {
    content.classList.toggle('active', content.id === tabName);
  });
}

// =============================================================================
// Utilities
// =============================================================================

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showError(message) {
  alert(message);
}

// =============================================================================
// Event Listeners
// =============================================================================

function setupEventListeners() {
  // Tabs
  elements.tabs.forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  // Scan
  elements.scanBtn.addEventListener('click', startAnalysis);

  // Settings
  elements.settingsBtn.addEventListener('click', openSettings);
  elements.closeSettings.addEventListener('click', closeSettings);
  elements.saveSettings.addEventListener('click', saveSettingsHandler);

  // Presets
  elements.presetBtns.forEach(btn => {
    btn.addEventListener('click', () => applyPreset(btn.dataset.preset));
  });
}
