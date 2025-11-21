#!/bin/bash

# VittaMed Production Package Creator
# This script creates a deployment package for PM2 deployment

set -e

echo "🚀 Creating VittaMed production package..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Create production package directory
PACKAGE_DIR="vittamed-production-package"
rm -rf $PACKAGE_DIR
mkdir -p $PACKAGE_DIR

print_status "Creating production package structure..."

# Copy built application
cp -r .next $PACKAGE_DIR/
cp -r public $PACKAGE_DIR/
cp package.json $PACKAGE_DIR/
cp next.config.mjs $PACKAGE_DIR/

# Copy environment file
cp .env.production $PACKAGE_DIR/.env.local

# Create a minimal package.json for production
cat > $PACKAGE_DIR/package.json << 'EOF'
{
  "name": "vittamed-app",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "start": "next start",
    "pm2:start": "pm2 start ecosystem.config.js",
    "pm2:stop": "pm2 stop vittamed-app",
    "pm2:restart": "pm2 restart vittamed-app",
    "pm2:status": "pm2 status vittamed-app"
  },
  "dependencies": {
    "@next/third-parties": "^15.5.3",
    "@stripe/stripe-js": "^4.0.0",
    "@supabase/ssr": "^0.5.2",
    "@supabase/supabase-js": "^2.39.7",
    "framer-motion": "^11.0.28",
    "lucide-react": "^0.263.1",
    "next": "15.5.3",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "stripe": "^17.0.0"
  }
}
EOF

# Create PM2 ecosystem file
cat > $PACKAGE_DIR/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'vittamed-app',
    script: 'node_modules/.bin/next',
    args: 'start',
    cwd: '/apps/prod/vittamed-app',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOSTNAME: '0.0.0.0'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOSTNAME: '0.0.0.0'
    },
    error_file: '/apps/prod/vittamed-app/logs/err.log',
    out_file: '/apps/prod/vittamed-app/logs/out.log',
    log_file: '/apps/prod/vittamed-app/logs/combined.log',
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm Z'
  }]
}
EOF

# Create deployment instructions
cat > $PACKAGE_DIR/DEPLOY-INSTRUCTIONS.md << 'EOF'
# VittaMed Production Deployment Instructions

## 1. Server Preparation

```bash
# Create production directory
sudo mkdir -p /apps/prod/vittamed-app
sudo mkdir -p /apps/prod/vittamed-app/logs
sudo chown -R $USER:$USER /apps/prod/vittamed-app
```

## 2. Upload Files

Upload the contents of this package to `/apps/prod/vittamed-app/`:

```bash
# From your local machine, upload the package
scp -r vittamed-production-package/* user@your-server:/apps/prod/vittamed-app/
```

## 3. Install Dependencies

```bash
cd /apps/prod/vittamed-app
npm install --production
```

## 4. Start with PM2

```bash
# Start the application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

## 5. Verify Deployment

```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs vittamed-app

# Test the application
curl http://localhost:3000/api/health
```

## 6. Management Commands

```bash
# Restart app
pm2 restart vittamed-app

# Stop app
pm2 stop vittamed-app

# View logs
pm2 logs vittamed-app --lines 100

# Monitor
pm2 monit
```

## 7. Nginx Configuration (Optional)

If you want to use Nginx as a reverse proxy:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```
EOF

# Create startup script
cat > $PACKAGE_DIR/start.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting VittaMed production server..."
cd /apps/prod/vittamed-app
npm run pm2:start
echo "✅ VittaMed started successfully!"
echo "📊 Check status: npm run pm2:status"
echo "📝 View logs: pm2 logs vittamed-app"
EOF

chmod +x $PACKAGE_DIR/start.sh

# Create archive
print_status "Creating deployment archive..."
tar -czf vittamed-production-$(date +%Y%m%d_%H%M%S).tar.gz $PACKAGE_DIR

print_success "✅ Production package created successfully!"
print_success "📦 Package location: ./$PACKAGE_DIR/"
print_success "📦 Archive created: vittamed-production-$(date +%Y%m%d_%H%M%S).tar.gz"
print_status ""
print_status "Next steps:"
print_status "1. Upload the package to your server's /apps/prod/vittamed-app directory"
print_status "2. Run: cd /apps/prod/vittamed-app && npm install --production"
print_status "3. Run: pm2 start ecosystem.config.js"
print_status "4. Test: curl http://localhost:3000/api/health"