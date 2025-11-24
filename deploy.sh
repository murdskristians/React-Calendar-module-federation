#!/bin/bash

# Deploy default-module to Firebase
# Usage: ./deploy.sh [test|prod]

set -e  # Exit on error

ENV=$1

if [ -z "$ENV" ]; then
  echo "❌ Error: No environment specified."
  echo "Usage: ./deploy.sh [test|prod]"
  exit 1
fi

if [ "$ENV" == "test" ]; then
  echo "🚀 Preparing to deploy to TEST environment..."
  FIREBASE_ALIAS="test"
  BUILD_CMD="npm run build:test"
elif [ "$ENV" == "prod" ]; then
  echo "🚀 Preparing to deploy to PRODUCTION environment..."
  FIREBASE_ALIAS="prod"
  BUILD_CMD="npm run build:prod"
else
  echo "❌ Error: Invalid environment '$ENV'. Use 'test' or 'prod'."
  exit 1
fi

echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed"
    echo "Install it with: npm install -g firebase-tools"
    exit 1
fi

# Switch Firebase project
echo "🔄 Switching to Firebase alias '$FIREBASE_ALIAS'..."
firebase use $FIREBASE_ALIAS
echo ""

# Build application
echo "🏗️  Building application ($BUILD_CMD)..."
$BUILD_CMD
echo ""

# Deploy to Firebase
echo "🚀 Deploying to Firebase Hosting..."
firebase deploy --only hosting:default-module

echo ""
echo "🎉 Deployment to $ENV complete!"
