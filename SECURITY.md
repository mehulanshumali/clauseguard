# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability in ClauseGuard, please report it responsibly.

### How to Report

1. **Do NOT** open a public issue for security vulnerabilities
2. Email your findings to the maintainers (add your email here)
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### What to Expect

- Acknowledgment within 48 hours
- Regular updates on progress
- Credit in the fix announcement (unless you prefer anonymity)

## Security Best Practices

ClauseGuard follows these security principles:

### Data Privacy
- **Zero-knowledge architecture**: No browsing history logged
- **Local storage only**: API keys stored in `chrome.storage.local`
- **No tracking**: No analytics or user identification

### Extension Security
- **No `eval()`**: Never executes dynamic code
- **CSP compliant**: Follows Content Security Policy
- **Minimal permissions**: Only requests necessary permissions

### API Security
- **Direct API calls**: Your API key goes directly to your chosen provider
- **No proxies**: No intermediary servers
- **HTTPS only**: All API calls use secure connections

## Scope

The following are in scope for security reports:
- Chrome extension code vulnerabilities
- Data leakage issues
- Authentication/authorization bypasses
- Cross-site scripting (XSS)
- Injection vulnerabilities

## Out of Scope

- Third-party LLM provider security
- Social engineering attacks
- Denial of service attacks
