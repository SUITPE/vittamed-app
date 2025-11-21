#!/bin/bash

# VittaMed Server SSH Setup for Auto-Deployment
# Run this script on your DigitalOcean server

set -e

echo "🔑 Setting up SSH keys for GitHub Actions auto-deployment..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_warning "Running as root. Consider creating a dedicated user for deployment."
fi

# Create .ssh directory if it doesn't exist
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Generate SSH key for GitHub Actions
print_status "Generating SSH key for GitHub Actions..."
ssh-keygen -t rsa -b 4096 -C "github-actions@vittamed.com" -f ~/.ssh/github_actions -N ""

# Add public key to authorized_keys
print_status "Adding public key to authorized_keys..."
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/github_actions
chmod 644 ~/.ssh/github_actions.pub
chmod 600 ~/.ssh/authorized_keys

print_success "SSH keys generated successfully!"

# Create deployment directory
print_status "Creating deployment directory structure..."
sudo mkdir -p /apps/prod/vittamed-app/logs
sudo chown -R $USER:$USER /apps/prod

# Install Node.js 20 if not present
if ! command -v node &> /dev/null || [[ $(node -v | cut -d'v' -f2 | cut -d'.' -f1) -lt 20 ]]; then
    print_status "Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    print_success "Node.js 20+ is already installed"
fi

# Install PM2 if not present
if ! command -v pm2 &> /dev/null; then
    print_status "Installing PM2..."
    sudo npm install -g pm2
else
    print_success "PM2 is already installed"
fi

# Configure PM2 startup
print_status "Configuring PM2 startup..."
pm2 startup systemd -u $USER --hp /home/$USER > /tmp/pm2_startup.log 2>&1 || print_warning "PM2 startup may already be configured"

print_success "✅ Server setup completed!"

echo ""
echo "📋 NEXT STEPS:"
echo "=============="
echo ""
echo "1. Copy this PRIVATE KEY to GitHub Secrets as 'DO_SSH_KEY':"
echo "   (Copy the entire content including BEGIN/END lines)"
echo ""
echo "   ${YELLOW}📄 PRIVATE KEY CONTENT:${NC}"
echo "   =================================="
cat ~/.ssh/github_actions
echo "   =================================="
echo ""
echo "2. Add these GitHub Secrets in your repository:"
echo "   Settings > Secrets and variables > Actions"
echo ""
echo "   DO_HOST: $(curl -s http://checkip.amazonaws.com || hostname -I | awk '{print $1}')"
echo "   DO_USERNAME: $USER"
echo "   DO_SSH_KEY: [paste the private key above]"
echo "   DO_PORT: 22"
echo ""
echo "3. Environment variables (copy from your .env.production):"
echo "   NEXT_PUBLIC_SUPABASE_URL: https://mvvxeqhsatkqtsrulcil.supabase.co"
echo "   NEXT_PUBLIC_SUPABASE_ANON_KEY: [your anon key]"
echo "   SUPABASE_SERVICE_ROLE_KEY: [your service role key]"
echo ""
echo "4. Test the setup:"
echo "   - Push to main branch"
echo "   - Check GitHub Actions tab"
echo "   - Monitor: pm2 status vittamed-app"
echo ""
print_success "🚀 Ready for auto-deployment!"