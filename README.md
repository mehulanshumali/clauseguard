# ClauseGuard 🛡️

**Your Personal Legal Shield for the Internet**

A Chrome extension that uses AI to analyze Terms of Service and Privacy Policies, protecting users from predatory clauses and data harvesting practices.

## Features

### 🔍 **Proactive Detection**
- Automatically detects legal links on any webpage
- Identifies Privacy Policies, Terms of Service, EULAs, and Cookie Policies
- Detects cookie consent banners and sign-up consent forms

### 📊 **Risk Assessment**
- **A-F Grade System**: Instant visual safety rating
- **The "Dirty Dozen"**: Checks 12 critical risk categories:
  - 💰 Data Sale
  - 🤖 AI Training Usage
  - ⚖️ Forced Arbitration
  - 📝 Content Ownership
  - 📍 Location Tracking
  - 👁️ Cross-Site Tracking
  - 🗄️ Data Retention
  - 🔗 Third-Party Sharing
  - 🔕 Silent Policy Updates
  - 🚫 Account Termination
  - 🔐 Biometric Data Collection
  - 👶 Children's Data Protection

### ✅ **Highlights**
- Good practices clearly highlighted
- Concerning clauses called out with specific quotes
- Critical clauses extracted for easy review

## Installation

### Quick Start

1. **Download/Clone the repository**
   ```bash
   git clone https://github.com/mehulanshumali/clauseguard.git
   cd clauseguard
   ```

2. **Load in Chrome**
   - Open `chrome://extensions/`
   - Enable **Developer mode** (top right toggle)
   - Click **Load unpacked**
   - Select the project folder

3. **Configure API Settings**
   - Click the ClauseGuard icon in your toolbar
   - Click the ⚙️ settings icon
   - Choose a preset (OpenAI, Groq, or Gemini) or enter custom endpoint
   - Enter your API key
   - Click **Save Settings**

### Getting an API Key

| Provider | Model | Get Key |
|----------|-------|---------|
| **OpenAI** | `gpt-4o-mini` | [platform.openai.com](https://platform.openai.com/api-keys) |
| **Groq** | `llama-3.1-70b-versatile` | [console.groq.com](https://console.groq.com/keys) |
| **Google Gemini** | `gemini-2.0-flash` | [aistudio.google.com](https://aistudio.google.com/apikey) |

## Usage

1. Navigate to any website with Terms of Service or Privacy Policy
2. Click the **ClauseGuard** icon in your toolbar
3. The extension shows detected legal documents and consent forms
4. Click **Scan Legal Policies** to analyze the current page
5. Review the risk grade, Dirty Dozen findings, and highlights
6. Switch to **Dirty Dozen** tab for detailed category breakdown

## Project Structure

```
clauseguard/
├── manifest.json           # Extension configuration (Manifest V3)
├── icons/                  # Extension icons
├── src/
│   ├── background/
│   │   └── background.js   # Service worker - API calls, badge updates
│   ├── content/
│   │   └── scraper.js      # Content script - page scanning
│   ├── popup/
│   │   ├── popup.html      # Extension popup UI
│   │   ├── popup.css       # Modern dark theme styles
│   │   └── popup.js        # UI controller
│   └── utils/
│       ├── constants.js    # Risk grades, Dirty Dozen categories
│       ├── llm.js          # Generic OpenAI-compatible API client
│       └── prompts.js      # AI analysis prompts
└── README.md
```

## Technical Details

### Tech Stack
- **Chrome Manifest V3** extension
- **Vanilla JavaScript** (ES modules)
- **OpenAI-compatible API** (works with any provider)
- **Chrome Storage API** for local settings
- **CSS Variables** for theming

### Key Features
- **Generic LLM Support**: Works with any OpenAI-compatible endpoint
- **Chunked Analysis**: Handles long documents by splitting into chunks
- **Consent Detection**: Identifies sign-up consent forms and checkboxes
- **SPA Support**: Re-scans on dynamic content changes

## Privacy & Security

🔒 **Zero-Knowledge Architecture**
- Your browsing history is **never** logged
- Only the specific policy text you scan is analyzed
- API keys stored locally in Chrome storage, never shared
- No user IDs, analytics, or tracking
- All API calls go directly to your configured provider

## Configuration Options

### Supported Providers

Any OpenAI-compatible API endpoint works, including:
- OpenAI (GPT-4o, GPT-4o-mini)
- Groq (Llama, Mixtral)
- Google Gemini (via OpenAI-compatible endpoint)
- Anthropic (via proxy)
- Local models (Ollama, LM Studio)

### For Local Models (Ollama)

```
Endpoint: http://localhost:11434/v1
Model: llama3.2 (or your preferred model)
API Key: ollama (any non-empty value)
```

## Roadmap

- [ ] Firefox/Safari extension support
- [ ] Historical policy change tracking
- [ ] Policy comparison between sites
- [ ] Browser sync for settings
- [ ] Batch analysis of multiple policies

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) for details.

---

**Disclaimer**: ClauseGuard provides informational summaries and should not be considered legal advice. Always consult a legal professional for important decisions.
