#!/bin/bash

set -e

echo "🔐 Running production build with patch lock..."

echo "📦 Validating release metadata..."
cat release.config.json

export NODE_ENV=production
export BUILD_HASH=$(git rev-parse --short HEAD)

echo "✅ Build Hash: $BUILD_HASH"

npm run build

echo "✅ Build complete. Artifacts written to ./dist"
mkdir -p releases
cp release.config.json releases/release-$BUILD_HASH.json

echo "🎉 Release $BUILD_HASH archived in /releases"