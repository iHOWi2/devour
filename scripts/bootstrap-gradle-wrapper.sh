#!/usr/bin/env bash
# Generates the Gradle wrapper for the Android project.
#
# Binary artefacts are not committed to this repository, so gradle-wrapper.jar is created
# locally once per clone. CI provisions Gradle directly and does not need the wrapper.
#
# Usage: bash scripts/bootstrap-gradle-wrapper.sh
set -euo pipefail

GRADLE_VERSION="9.4.1"

if ! command -v gradle >/dev/null 2>&1; then
  echo "gradle is not on PATH." >&2
  echo "Install Gradle ${GRADLE_VERSION} (sdkman, brew or your package manager) and run this script again." >&2
  exit 1
fi

cd "$(dirname "$0")/../android"
gradle wrapper --gradle-version "${GRADLE_VERSION}" --distribution-type bin

echo "Gradle wrapper ready: android/gradlew"
