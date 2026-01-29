# Safari Extension Build Guide

Safari extensions require conversion using Apple's Xcode tools. This guide walks you through the process.

## Prerequisites

1. **macOS** (required)
2. **Xcode** (free from App Store)
3. **Apple Developer Account** (free for testing, $99/year for distribution)

## Build Steps

### 1. Build the Chrome version first

```bash
./scripts/build.sh chrome
```

### 2. Convert to Safari Extension

```bash
xcrun safari-web-extension-converter dist/chrome \
  --project-location dist/safari \
  --app-name "ClauseGuard" \
  --bundle-identifier "com.clauseguard.app"
```

### 3. Open in Xcode

```bash
open dist/safari/ClauseGuard/ClauseGuard.xcodeproj
```

### 4. Configure Signing

1. In Xcode, select the project in the navigator
2. Select the "ClauseGuard" target
3. Go to "Signing & Capabilities"
4. Select your Team (Apple ID)
5. Let Xcode manage signing

### 5. Build and Run

1. Select "ClauseGuard" scheme
2. Click Run (⌘R)
3. Safari will open with the extension installed

### 6. Enable in Safari

1. Open Safari → Settings → Extensions
2. Enable "ClauseGuard"
3. Grant necessary permissions

## Testing

For development testing (without App Store):

1. Build in Xcode with your development certificate
2. The extension will only work on your Mac
3. Unsigned extensions require enabling "Allow Unsigned Extensions" in Safari's Develop menu

## Distribution

### App Store (Recommended)

1. Archive the app in Xcode (Product → Archive)
2. Upload to App Store Connect
3. Submit for review

### Direct Distribution

1. Export as Developer ID signed app
2. Notarize with Apple
3. Distribute the .app file

## Troubleshooting

### "Extension not showing in Safari"
- Ensure the extension is enabled in Safari Settings
- Check that you've granted all required permissions

### "Signing errors in Xcode"
- Make sure you're signed into your Apple ID in Xcode
- Try cleaning the build folder (Product → Clean Build Folder)

### "Web extension APIs not working"
- Safari has some API differences - check browser.js abstraction
- Console errors appear in Safari's Web Inspector

## Resources

- [Apple Safari Web Extensions Guide](https://developer.apple.com/documentation/safariservices/safari_web_extensions)
- [Converting Chrome Extension to Safari](https://developer.apple.com/documentation/safariservices/safari_web_extensions/converting_a_web_extension_for_safari)
