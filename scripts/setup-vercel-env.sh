#!/bin/bash

# VittaSami - Vercel Environment Variables Setup
# This script configures all environment variables for staging

set -e

echo "🔐 Configuring Vercel Environment Variables for Staging"
echo "======================================================="
echo ""

PROJECT_ID="prj_qtj25xNU85mtR7D0JMUVbmXyp3HP"
ENV_FILE=".env.staging"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env.staging exists
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: $ENV_FILE not found!"
    exit 1
fi

echo -e "${BLUE}[INFO]${NC} Reading variables from $ENV_FILE"
echo ""

# Function to add environment variable to Vercel
add_env_var() {
    local key=$1
    local value=$2

    # Skip empty values or comments
    if [ -z "$value" ] || [[ $key == \#* ]]; then
        return
    fi

    echo -e "${YELLOW}[SETTING]${NC} $key"

    # Add to Preview environment (staging)
    echo "$value" | vercel env add "$key" preview --force > /dev/null 2>&1

    # Add to Development environment
    echo "$value" | vercel env add "$key" development --force > /dev/null 2>&1

    echo -e "${GREEN}[✓]${NC} $key configured for Preview and Development"
}

# Read .env.staging and add each variable
while IFS='=' read -r key value; do
    # Skip comments and empty lines
    if [[ $key == \#* ]] || [ -z "$key" ]; then
        continue
    fi

    # Remove leading/trailing whitespace
    key=$(echo "$key" | xargs)
    value=$(echo "$value" | xargs)

    # Remove quotes if present
    value="${value%\"}"
    value="${value#\"}"

    # Add environment variable
    add_env_var "$key" "$value"

done < "$ENV_FILE"

echo ""
echo -e "${GREEN}✅ All environment variables configured!${NC}"
echo ""
echo "📋 Next steps:"
echo "  1. Verify: https://vercel.com/vittameds-projects/vittasami/settings/environment-variables"
echo "  2. Deploy: git push origin staging"
echo "  3. Monitor: vercel logs vittasami-staging --follow"
echo ""
