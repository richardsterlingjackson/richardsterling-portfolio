#!/usr/bin/env bash
# Helper script to download and install Eclipse Temurin JDK 21 for Windows (x64).
# This script assumes Git Bash or WSL and administrator privileges for installation to C:/jdk-21.

set -euo pipefail

DEST_DIR="/c/jdk-21"
TAR_FILE="OpenJDK21U-jdk_x64_windows_hotspot_21.0.0_9.zip"
DOWNLOAD_URL="https://github.com/adoptium/temurin21-binaries/releases/latest/download/${TAR_FILE}"

echo "This will download Temurin JDK 21 and extract to ${DEST_DIR}"
read -p "Proceed? [y/N] " -r
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Aborted"
  exit 1
fi

mkdir -p "$DEST_DIR"

curl -L "$DOWNLOAD_URL" -o "/tmp/${TAR_FILE}"
unzip -o "/tmp/${TAR_FILE}" -d /tmp

# Find extracted folder
EXTRACTED_DIR=$(find /tmp -maxdepth 1 -type d -name "jdk-*" | head -n1)
if [ -z "$EXTRACTED_DIR" ]; then
  echo "Failed to find extracted JDK directory"
  exit 1
fi

# Move to destination (may require admin rights on Windows)
mv "$EXTRACTED_DIR"/* "$DEST_DIR/"

echo "Set JAVA_HOME and update PATH for current session:"
cat <<EOF
export JAVA_HOME="/c/jdk-21"
export PATH="\$JAVA_HOME/bin:\$PATH"
EOF

echo "Done. Run 'java -version' to verify."