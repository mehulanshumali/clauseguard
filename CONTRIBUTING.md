# Contributing to ClauseGuard

Thank you for your interest in contributing to ClauseGuard! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](../../issues)
2. If not, create a new issue with:
   - Clear, descriptive title
   - Steps to reproduce
   - Expected vs actual behavior
   - Browser version and OS
   - Screenshots if applicable

### Suggesting Features

1. Check existing issues for similar suggestions
2. Create a new issue with the `enhancement` label
3. Describe the feature and its use case
4. Explain why it would benefit users

### Pull Requests

1. **Fork** the repository
2. **Clone** your fork locally
3. **Create a branch** for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Make your changes** following our coding standards
5. **Test** your changes thoroughly
6. **Commit** with clear, descriptive messages:
   ```bash
   git commit -m "Add: brief description of change"
   ```
7. **Push** to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
8. **Open a Pull Request** against the `main` branch

## Coding Standards

### JavaScript

- Use ES6+ features (async/await, arrow functions, destructuring)
- Use `const` by default, `let` when reassignment is needed
- Add JSDoc comments for functions
- No `var`, no `eval()`

### CSS

- Use CSS variables for theming
- Follow BEM-like naming conventions
- Mobile-first approach

### Chrome Extension

- Follow Manifest V3 best practices
- Use service workers for background scripts
- Store data in `chrome.storage.local`

### File Organization

```
src/
├── background/    # Service worker
├── content/       # Content scripts
├── popup/         # Extension popup UI
└── utils/         # Shared utilities
```

## Development Setup

1. Clone the repository
2. Load the extension in Chrome:
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the project folder

## Testing Your Changes

1. Test on multiple websites
2. Test with different LLM providers
3. Check for console errors
4. Verify UI responsiveness

## Commit Message Format

Use clear, descriptive commit messages:

- `Add: new feature description`
- `Fix: bug description`
- `Update: what was changed`
- `Remove: what was removed`
- `Refactor: what was refactored`
- `Docs: documentation changes`

## Questions?

Feel free to open an issue for any questions about contributing.

---

Thank you for helping make ClauseGuard better! 🛡️
