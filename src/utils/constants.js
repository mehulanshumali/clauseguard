/**
 * ClauseGuard - Constants and Configuration
 * Centralized configuration for the extension
 * @module utils/constants
 */

/**
 * Risk grade definitions with visual styling
 */
export const RISK_GRADES = Object.freeze({
  'A': {
    label: 'Excellent - User-friendly terms',
    color: '#22c55e',
    description: 'This policy respects your privacy and rights.'
  },
  'B': {
    label: 'Good - Minor concerns',
    color: '#84cc16',
    description: 'Generally good, with a few areas to be aware of.'
  },
  'C': {
    label: 'Fair - Some issues',
    color: '#eab308',
    description: 'Contains some concerning clauses worth reviewing.'
  },
  'D': {
    label: 'Poor - Significant concerns',
    color: '#f97316',
    description: 'Multiple problematic clauses that affect your rights.'
  },
  'F': {
    label: 'Fail - Major red flags',
    color: '#ef4444',
    description: 'Serious privacy and rights concerns. Proceed with caution.'
  },
  '?': {
    label: 'Unknown - Not yet analyzed',
    color: '#6b7280',
    description: 'Click to analyze this site\'s policies.'
  }
});

/**
 * The "Dirty Dozen" - 12 critical privacy/rights risk categories
 */
export const DIRTY_DOZEN = Object.freeze([
  {
    id: 'data_sale',
    name: 'Data Sale',
    icon: '💰',
    description: 'Sells your personal data to third parties'
  },
  {
    id: 'ai_training',
    name: 'AI Training',
    icon: '🤖',
    description: 'Uses your content to train AI models'
  },
  {
    id: 'forced_arbitration',
    name: 'Forced Arbitration',
    icon: '⚖️',
    description: 'Waives your right to sue or join class actions'
  },
  {
    id: 'content_ownership',
    name: 'Content Ownership',
    icon: '📝',
    description: 'Claims rights over your uploaded content'
  },
  {
    id: 'location_tracking',
    name: 'Location Tracking',
    icon: '📍',
    description: 'Tracks and stores your location data'
  },
  {
    id: 'cross_site_tracking',
    name: 'Cross-Site Tracking',
    icon: '👁️',
    description: 'Tracks your activity across other websites'
  },
  {
    id: 'data_retention',
    name: 'Data Retention',
    icon: '🗄️',
    description: 'Keeps your data indefinitely or for long periods'
  },
  {
    id: 'third_party_sharing',
    name: 'Third-Party Sharing',
    icon: '🔗',
    description: 'Shares data with unnamed third parties'
  },
  {
    id: 'policy_changes',
    name: 'Silent Updates',
    icon: '🔕',
    description: 'Can change terms without notifying you'
  },
  {
    id: 'account_termination',
    name: 'Account Termination',
    icon: '🚫',
    description: 'Can terminate your account without cause'
  },
  {
    id: 'biometric_collection',
    name: 'Biometric Data',
    icon: '🔐',
    description: 'Collects fingerprints, face data, or voice prints'
  },
  {
    id: 'children_data',
    name: 'Children\'s Data',
    icon: '👶',
    description: 'Weak protections for minors\' data'
  }
]);

/**
 * Policy type display names
 */
export const POLICY_TYPES = Object.freeze({
  privacy: 'Privacy Policy',
  terms: 'Terms of Service',
  eula: 'End User License Agreement',
  cookie: 'Cookie Policy',
  data: 'Data Protection Policy',
  acceptable: 'Acceptable Use Policy',
  unknown: 'Legal Document'
});

/**
 * Maximum text length before chunking (characters)
 */
export const MAX_TEXT_LENGTH = 50000;

/**
 * Chrome storage keys
 */
export const STORAGE_KEYS = Object.freeze({
  SETTINGS: 'settings',
  ANALYZED_SITES: 'analyzedSites'
});
