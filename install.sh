#!/bin/bash
set -e

# Obsidian CLI Installer
# Usage: curl -fsSL https://raw.githubusercontent.com/nickcramaro/obsidian-cli/main/install.sh | bash

REPO="nickcramaro/obsidian-cli"
INSTALL_DIR="${INSTALL_DIR:-/usr/local/bin}"
BINARY_NAME="obsidian"

# Detect OS
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
case "$OS" in
  darwin) OS="darwin" ;;
  linux) OS="linux" ;;
  *)
    echo "Error: Unsupported operating system: $OS"
    exit 1
    ;;
esac

# Detect architecture
ARCH=$(uname -m)
case "$ARCH" in
  x86_64) ARCH="x64" ;;
  aarch64|arm64) ARCH="arm64" ;;
  *)
    echo "Error: Unsupported architecture: $ARCH"
    exit 1
    ;;
esac

# Construct binary name
BINARY="obsidian-${OS}-${ARCH}"

echo "Detected: ${OS}-${ARCH}"
echo "Installing obsidian-cli..."

# Get latest release URL
DOWNLOAD_URL="https://github.com/${REPO}/releases/latest/download/${BINARY}"

# Create temp directory
TMP_DIR=$(mktemp -d)
trap "rm -rf $TMP_DIR" EXIT

# Download binary
echo "Downloading from ${DOWNLOAD_URL}..."
if ! curl -fsSL "$DOWNLOAD_URL" -o "${TMP_DIR}/${BINARY_NAME}"; then
  echo "Error: Failed to download binary"
  echo "Make sure a release exists with the binary: ${BINARY}"
  exit 1
fi

# Make executable
chmod +x "${TMP_DIR}/${BINARY_NAME}"

# Install
if [ -w "$INSTALL_DIR" ]; then
  mv "${TMP_DIR}/${BINARY_NAME}" "${INSTALL_DIR}/${BINARY_NAME}"
else
  echo "Installing to ${INSTALL_DIR} requires sudo..."
  sudo mv "${TMP_DIR}/${BINARY_NAME}" "${INSTALL_DIR}/${BINARY_NAME}"
fi

echo ""
echo "Successfully installed obsidian-cli to ${INSTALL_DIR}/${BINARY_NAME}"
echo ""
echo "Next steps:"
echo "  1. Get your API key from: Obsidian Settings → Local REST API"
echo "  2. Set it: export OBSIDIAN_API_KEY=\"your-key\""
echo "  3. Test it: obsidian status"
