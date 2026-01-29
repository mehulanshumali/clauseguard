#!/bin/bash
# ClauseGuard - Multi-Browser Build Script
# Usage: ./scripts/build.sh [chrome|firefox|all]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Directories
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BUILD_DIR="$ROOT_DIR/dist"
SRC_FILES=(
  "src"
  "icons"
  "LICENSE"
  "README.md"
)

# Print colored message
log() {
  echo -e "${GREEN}[BUILD]${NC} $1"
}

warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
  echo -e "${RED}[ERROR]${NC} $1"
  exit 1
}

# Clean build directory
clean() {
  log "Cleaning build directory..."
  rm -rf "$BUILD_DIR"
  mkdir -p "$BUILD_DIR"
}

# Build for Chrome
build_chrome() {
  log "Building for Chrome..."
  
  local OUTPUT_DIR="$BUILD_DIR/chrome"
  mkdir -p "$OUTPUT_DIR"
  
  # Copy source files
  for file in "${SRC_FILES[@]}"; do
    cp -r "$ROOT_DIR/$file" "$OUTPUT_DIR/"
  done
  
  # Copy Chrome manifest
  cp "$ROOT_DIR/manifest.json" "$OUTPUT_DIR/manifest.json"
  
  # Create zip
  cd "$OUTPUT_DIR"
  zip -r "../clauseguard-chrome.zip" . -x "*.DS_Store"
  cd "$ROOT_DIR"
  
  log "Chrome build complete: dist/clauseguard-chrome.zip"
}

# Build for Firefox
build_firefox() {
  log "Building for Firefox..."
  
  local OUTPUT_DIR="$BUILD_DIR/firefox"
  mkdir -p "$OUTPUT_DIR"
  
  # Copy source files
  for file in "${SRC_FILES[@]}"; do
    cp -r "$ROOT_DIR/$file" "$OUTPUT_DIR/"
  done
  
  # Copy Firefox manifest
  cp "$ROOT_DIR/manifest.firefox.json" "$OUTPUT_DIR/manifest.json"
  
  # Create zip (Firefox uses .xpi but .zip works for testing)
  cd "$OUTPUT_DIR"
  zip -r "../clauseguard-firefox.zip" . -x "*.DS_Store"
  cd "$ROOT_DIR"
  
  log "Firefox build complete: dist/clauseguard-firefox.zip"
}

# Build for Safari (preparation only - requires Xcode)
build_safari() {
  warn "Safari requires Xcode and xcrun safari-web-extension-converter"
  warn "Run this command manually after Chrome build:"
  echo ""
  echo "  xcrun safari-web-extension-converter dist/chrome --project-location dist/safari --app-name ClauseGuard"
  echo ""
}

# Main
main() {
  local target="${1:-all}"
  
  log "ClauseGuard Build System"
  log "========================"
  
  clean
  
  case "$target" in
    chrome)
      build_chrome
      ;;
    firefox)
      build_firefox
      ;;
    safari)
      build_safari
      ;;
    all)
      build_chrome
      build_firefox
      build_safari
      ;;
    *)
      error "Unknown target: $target"
      echo "Usage: $0 [chrome|firefox|safari|all]"
      exit 1
      ;;
  esac
  
  log "Build complete!"
  echo ""
  echo "Output files:"
  ls -la "$BUILD_DIR"/*.zip 2>/dev/null || echo "  (no zip files)"
}

main "$@"
