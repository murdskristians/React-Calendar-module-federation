#!/bin/bash

# Deploy calendar-module to Firebase
# Usage: ./deploy.sh [test|prod]

set -e  # Exit on error

MODULE_NAME="calendar-module"
TEST_SITE="module-$MODULE_NAME"
PROD_SITE="hotcode-module-$MODULE_NAME"

ensure_site_exists() {
  local site_name="$1"
  echo "🔍 Ensuring Hosting site '$site_name' exists..."

  if firebase hosting:sites:list --json | node -e "const fs=require('fs'); const data=JSON.parse(fs.readFileSync(0,'utf8')); const sites=(data.result||[]).map(s=>s.name?.split('/').pop()); process.exit(sites.includes(process.argv[1])?0:1);" "$site_name"; then
    echo "✅ Hosting site '$site_name' found."
  else
    echo "ℹ️  Creating hosting site '$site_name'..."
    firebase hosting:sites:create "$site_name"
  fi
  echo ""
}

ENV=$1

if [ -z "$ENV" ]; then
  echo "❌ Error: No environment specified."
  echo "Usage: ./deploy.sh [test|prod]"
  exit 1
fi

if [ "$ENV" == "test" ]; then
  echo "🚀 Preparing to deploy to TEST environment..."
  FIREBASE_ALIAS="test"
  HOSTING_SITE="$TEST_SITE"
  BUILD_CMD="npm run build:test"
elif [ "$ENV" == "prod" ]; then
  echo "🚀 Preparing to deploy to PRODUCTION environment..."
  FIREBASE_ALIAS="prod"
  HOSTING_SITE="$PROD_SITE"
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

# Switch Firebase project first (required for all following commands)
echo "🔄 Switching to Firebase alias '$FIREBASE_ALIAS'..."
firebase use $FIREBASE_ALIAS
echo ""

# Ensure Hosting site exists for the selected environment
# ensure_site_exists "$HOSTING_SITE"

# Build application
echo "🏗️  Building application ($BUILD_CMD)..."
$BUILD_CMD
echo ""

# Deploy to Firebase
echo "🚀 Deploying to Firebase Hosting..."
firebase deploy --only hosting:calendar-module

echo ""
echo "🎉 Deployment to $ENV complete!"
