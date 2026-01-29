/**
 * ClauseGuard - LLM Integration
 * Generic OpenAI-compatible API client for policy analysis
 * @module utils/llm
 */

import { MAX_TEXT_LENGTH } from './constants.js';
import { ANALYSIS_SYSTEM_PROMPT, getAnalysisUserPrompt } from './prompts.js';
import { storage } from './browser.js';

/** HTTP status code error messages */
const HTTP_ERROR_MESSAGES = {
  400: 'Bad request - check your API endpoint and model name',
  401: 'Invalid API key - please check your API key in settings',
  403: 'Access denied - your API key may not have permission for this model',
  404: 'Not found - check your API endpoint URL',
  429: 'Rate limit exceeded - please wait a moment and try again',
  500: 'Server error - the API service is having issues',
  502: 'Bad gateway - the API service is temporarily unavailable',
  503: 'Service unavailable - the API service is temporarily down'
};

/**
 * Get stored API settings from browser storage
 * @returns {Promise<Object>} User's API configuration
 */
async function getSettings() {
  const result = await storage.get('settings');
  return result.settings || {};
}

/**
 * Validate that all required settings are present
 * @param {Object} settings - API settings object
 * @throws {Error} If settings are incomplete
 */
function validateSettings(settings) {
  if (!settings.endpoint || !settings.model || !settings.apiKey) {
    throw new Error('Please configure your API settings (endpoint, model, and API key).');
  }
}

/**
 * Analyze policy text using configured LLM
 * @param {string} policyText - The policy text to analyze
 * @param {string} policyType - Type of policy (e.g., "Privacy Policy")
 * @returns {Promise<Object>} Analysis results
 */
export async function analyzePolicyWithLLM(policyText, policyType) {
  const settings = await getSettings();
  validateSettings(settings);

  // Handle long documents by chunking
  if (policyText.length > MAX_TEXT_LENGTH) {
    return analyzeInChunks(policyText, policyType, settings);
  }

  const userPrompt = getAnalysisUserPrompt(policyText, policyType);
  const response = await callLLM(settings, ANALYSIS_SYSTEM_PROMPT, userPrompt);
  return parseAnalysisResponse(response);
}

/**
 * Analyze long documents by splitting into chunks
 * @param {string} policyText - Full policy text
 * @param {string} policyType - Type of policy
 * @param {Object} settings - API settings
 * @returns {Promise<Object>} Merged analysis results
 */
async function analyzeInChunks(policyText, policyType, settings) {
  const chunkSize = MAX_TEXT_LENGTH - 5000; // Leave room for prompts
  const chunks = [];
  
  for (let i = 0; i < policyText.length; i += chunkSize) {
    chunks.push(policyText.slice(i, i + chunkSize));
  }

  const chunkResults = await Promise.all(
    chunks.map(async (chunk, i) => {
      const userPrompt = getAnalysisUserPrompt(
        chunk,
        `${policyType} (Part ${i + 1} of ${chunks.length})`
      );
      const response = await callLLM(settings, ANALYSIS_SYSTEM_PROMPT, userPrompt);
      return parseAnalysisResponse(response);
    })
  );

  return mergeChunkResults(chunkResults);
}

/**
 * Merge analysis results from multiple chunks
 * @param {Array<Object>} results - Array of chunk analysis results
 * @returns {Object} Merged analysis
 */
function mergeChunkResults(results) {
  const gradeOrder = ['A', 'B', 'C', 'D', 'F'];
  const statusOrder = ['safe', 'unknown', 'warning', 'danger'];

  // Use worst grade found
  const worstGrade = results.reduce((worst, r) => {
    const currentIdx = gradeOrder.indexOf(r.grade);
    const worstIdx = gradeOrder.indexOf(worst);
    return currentIdx > worstIdx ? r.grade : worst;
  }, 'A');

  // Merge dirty dozen (use worst status for each category)
  const mergedDirtyDozen = {};
  results.forEach(result => {
    Object.entries(result.dirtyDozen || {}).forEach(([key, value]) => {
      const existing = mergedDirtyDozen[key];
      if (!existing || statusOrder.indexOf(value.status) > statusOrder.indexOf(existing.status)) {
        mergedDirtyDozen[key] = value;
      }
    });
  });

  // Deduplicate and limit highlights
  const allGood = [...new Set(results.flatMap(r => r.highlights?.good || []))];
  const allBad = [...new Set(results.flatMap(r => r.highlights?.bad || []))];
  const allQuotes = results.flatMap(r => r.criticalQuotes || []);

  return {
    grade: worstGrade,
    summary: results[0]?.summary || 'Analysis complete.',
    dirtyDozen: mergedDirtyDozen,
    highlights: {
      good: allGood.slice(0, 5),
      bad: allBad.slice(0, 10)
    },
    criticalQuotes: allQuotes.slice(0, 5)
  };
}

/**
 * Call LLM API with OpenAI-compatible format
 * @param {Object} settings - API configuration
 * @param {string} systemPrompt - System instructions
 * @param {string} userPrompt - User message
 * @returns {Promise<string>} LLM response content
 */
async function callLLM(settings, systemPrompt, userPrompt) {
  const { endpoint, model, apiKey } = settings;

  // Normalize endpoint URL
  const apiUrl = endpoint.replace(/\/?$/, '/chat/completions');

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 4096,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error?.message ||
                         errorData.message ||
                         HTTP_ERROR_MESSAGES[response.status] ||
                         `Request failed (${response.status})`;
    throw new Error(errorMessage);
  }

  const data = await response.json();

  // Extract content (supports OpenAI and Gemini formats)
  return data.choices?.[0]?.message?.content ||
         data.candidates?.[0]?.content?.parts?.[0]?.text ||
         '';
}

/**
 * Parse and validate LLM analysis response
 * @param {string|Object} response - Raw LLM response
 * @returns {Object} Validated analysis object
 */
function parseAnalysisResponse(response) {
  try {
    let parsed = typeof response === 'string' ? extractJSON(response) : response;

    // Normalize grade
    const validGrades = ['A', 'B', 'C', 'D', 'F'];
    if (!parsed.grade || !validGrades.includes(parsed.grade.toUpperCase())) {
      parsed.grade = 'C';
    } else {
      parsed.grade = parsed.grade.toUpperCase();
    }

    // Ensure required fields exist
    return {
      grade: parsed.grade,
      summary: parsed.summary?.length > 10 ? parsed.summary : 'Analysis complete. Review the findings below.',
      dirtyDozen: typeof parsed.dirtyDozen === 'object' ? parsed.dirtyDozen : {},
      highlights: {
        good: Array.isArray(parsed.highlights?.good) ? parsed.highlights.good : [],
        bad: Array.isArray(parsed.highlights?.bad) ? parsed.highlights.bad : []
      },
      criticalQuotes: Array.isArray(parsed.criticalQuotes) ? parsed.criticalQuotes : []
    };
  } catch {
    return {
      grade: '?',
      summary: 'Unable to parse the analysis. Check your API settings and try again.',
      dirtyDozen: {},
      highlights: { good: [], bad: [] },
      criticalQuotes: []
    };
  }
}

/**
 * Extract JSON from potentially messy LLM response
 * @param {string} text - Raw response text
 * @returns {Object} Parsed JSON object
 */
function extractJSON(text) {
  let clean = text.trim();

  // Remove markdown code blocks
  if (clean.startsWith('```')) {
    clean = clean.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
  }

  // Find JSON object boundaries
  const start = clean.indexOf('{');
  const end = clean.lastIndexOf('}');

  if (start !== -1 && end !== -1) {
    clean = clean.substring(start, end + 1);
  }

  return JSON.parse(clean);
}
