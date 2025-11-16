# 🚀 VittaSami Deployment Strategy

## 📋 Table of Contents
1. [Environment Architecture](#environment-architecture)
2. [Supabase Configuration](#supabase-configuration)
3. [Vercel Staging Setup](#vercel-staging-setup)
4. [Digital Ocean Production](#digital-ocean-production)
5. [CI/CD Pipeline](#cicd-pipeline)
6. [Environment Variables](#environment-variables)
7. [Deployment Workflow](#deployment-workflow)
8. [Troubleshooting](#troubleshooting)

---

## 🏗️ Environment Architecture

### Overview

```
┌─────────────────────────────────────────────────────────────┐
│                       VittaSami Environments                 │
├─────────────────┬───────────────┬────────────────────────────┤
│  Development    │   Staging     │      Production            │
├─────────────────┼───────────────┼────────────────────────────┤
│  localhost:3003 │ Vercel        │ Digital Ocean              │
│  Supabase Dev   │ Supabase Dev  │ Supabase Prod              │
│  Branch: develop│ Branch: stage │ Branch: main               │
│  Manual testing │ QA + Preview  │ Live customers             │
└─────────────────┴───────────────┴────────────────────────────┘
```

### Environment Details

| Aspect | Development | Staging | Production |
|--------|------------|---------|------------|
| **Platform** | Local Machine | Vercel | Digital Ocean (Docker) |
| **URL** | `localhost:3003` | `vittasami-staging.vercel.app` | `app.vittasami.lat` |
| **Database** | Supabase Dev | Supabase Dev | Supabase Prod |
| **Branch** | `develop` | `staging` | `main` |
| **Deployment** | `npm run dev` | Auto (GitHub push) | Manual (`deploy.sh`) |
| **Purpose** | Feature development | QA + Testing | Live customers |
| **Data** | Mock/test data | Mock/test data | Real customer data |
| **Payments** | Test mode (Stripe) | Test mode | Live mode |
| **Analytics** | Disabled | Enabled | Enabled |

---

## 🗄️ Supabase Configuration

### Current Setup

**Supabase Development (KEEP AS DEV):**
- URL: `https://mvvxeqhsatkqtsrulcil.supabase.co`
- Purpose: Development + Staging
- Data: Test tenants, demo accounts
- Status: ✅ Currently in use

**Supabase Production (NEW EMPTY DB):**
- URL: `https://[new-project-id].supabase.co`
- Purpose: Production only
- Data: Empty (will be populated with real customers)
- Status: 🆕 Ready to configure

### Migration Strategy

```bash
# Step 1: Run migrations on Production Supabase
cd supabase
supabase db push --project-ref [new-project-id]

# Step 2: Verify schema
supabase db diff --project-ref [new-project-id]

# Step 3: DO NOT seed with demo data (production is clean)
```

### RLS Policies

Ensure all Row Level Security policies are identical across environments:

```sql
-- Run this on Production Supabase to verify RLS
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
```

### Database Access

| Environment | Supabase Project | Service Role Key | Purpose |
|------------|------------------|------------------|---------|
| Dev/Staging | `mvvxeqhsatkqtsrulcil` | `SUPABASE_SERVICE_ROLE_KEY_DEV` | Testing |
| Production | `[new-project-id]` | `SUPABASE_SERVICE_ROLE_KEY_PROD` | Live data |

---

## ☁️ Vercel Staging Setup

### Why Vercel for Staging?

1. **Free tier** (100GB bandwidth/month - perfect for staging)
2. **Automatic deployments** from GitHub
3. **Preview deployments** for every PR (QA can test before merge)
4. **Instant rollback** to previous deployments
5. **Next.js 15 native support** (built by Vercel team)
6. **Environment variables** per environment
7. **Analytics + logs** included

### Step-by-Step Setup

#### 1. Create Vercel Account
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login
```

#### 2. Link Project to Vercel
```bash
# From project root
vercel link

# Follow prompts:
# - Set up and deploy? No
# - Which scope? Your account
# - Link to existing project? No
# - Project name: vittasami
# - Directory: ./
# - Override settings? No
```

#### 3. Create `vercel.json` Configuration
```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "NODE_ENV": "production"
  },
  "build": {
    "env": {
      "NEXT_TELEMETRY_DISABLED": "1"
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    }
  ]
}
```

#### 4. Configure Environment Variables in Vercel

Go to Vercel Dashboard > Project > Settings > Environment Variables:

**For Staging environment:**
```bash
# Supabase (DEV database)
NEXT_PUBLIC_SUPABASE_URL=https://mvvxeqhsatkqtsrulcil.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[dev-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[dev-service-role-key]

# Domain (Staging)
NEXT_PUBLIC_DOMAIN_MAIN=https://vittasami-staging.vercel.app
NEXT_PUBLIC_DOMAIN_APP=https://vittasami-staging.vercel.app

# Stripe (TEST mode)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...

# Email (Development SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=dev@vittasami.com
EMAIL_PASSWORD=[app-password]

# Twilio (Test credentials)
TWILIO_ACCOUNT_SID=AC[test-sid]
TWILIO_AUTH_TOKEN=[test-token]
TWILIO_WHATSAPP_NUMBER=+14155238886

# Environment
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

#### 5. Configure Git Integration

In Vercel Dashboard > Project > Settings > Git:

- **Production Branch:** `main` → Deploy to production (Digital Ocean)
- **Staging Branch:** `staging` → Deploy to staging (Vercel)
- **Preview Branches:** All other branches → Preview deployments

#### 6. Deploy Staging

```bash
# Create staging branch
git checkout -b staging
git push origin staging

# Vercel will auto-deploy
# Check status: https://vercel.com/dashboard
```

---

## 🐳 Digital Ocean Production

### Current Setup (KEEP AS IS)

```bash
# Location: Digital Ocean Droplet
# Deployment: Docker Compose
# Script: deploy.sh
# Branch: main
```

### Update Production Environment Variables

Create `.env.production` with **PRODUCTION SUPABASE**:

```bash
# Domain (Production)
NEXT_PUBLIC_DOMAIN_MAIN=https://vittasami.com
NEXT_PUBLIC_DOMAIN_APP=https://app.vittasami.lat

# Supabase (PRODUCTION database - NEW)
NEXT_PUBLIC_SUPABASE_URL=https://[new-project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[prod-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[prod-service-role-key]

# Stripe (LIVE mode)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_live_...

# Email (Production SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=noreply@vittasami.com
EMAIL_PASSWORD=[production-app-password]

# Twilio (Production credentials)
TWILIO_ACCOUNT_SID=AC[prod-sid]
TWILIO_AUTH_TOKEN=[prod-token]
TWILIO_WHATSAPP_NUMBER=[prod-number]

# Environment
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

### Production Deployment Checklist

```bash
# 1. Test in Staging first
git checkout staging
git pull origin staging
# Wait for Vercel deploy
# Test: https://vittasami-staging.vercel.app

# 2. Merge to main
git checkout main
git merge staging
git push origin main

# 3. SSH into Digital Ocean
ssh root@your-droplet-ip

# 4. Pull latest code
cd /var/www/vittasami
git pull origin main

# 5. Deploy
./deploy.sh

# 6. Verify
curl https://app.vittasami.lat/api/health
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow (Optional - Recommended)

Create `.github/workflows/staging.yml`:

```yaml
name: Staging Deployment

on:
  push:
    branches: [staging]
  pull_request:
    branches: [staging]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run type check
        run: npm run type-check

      - name: Run linter
        run: npm run lint

      - name: Run unit tests
        run: npm run test:unit:run

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL_DEV }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY_DEV }}

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/staging'

    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

Create `.github/workflows/production.yml`:

```yaml
name: Production Deployment

on:
  push:
    branches: [main]
  workflow_dispatch: # Manual trigger

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run all tests
        run: npm run test:all
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL_DEV }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY_DEV }}

      - name: Build production
        run: npm run build
        env:
          NODE_ENV: production

  notify:
    needs: test
    runs-on: ubuntu-latest

    steps:
      - name: Notify deployment ready
        run: |
          echo "✅ Tests passed! Ready to deploy to Digital Ocean"
          echo "📝 SSH into server and run: ./deploy.sh"
```

---

## 🔐 Environment Variables Management

### .env Files Structure

```
.env.local              # Development (gitignored)
.env.staging            # Staging (gitignored, for reference)
.env.production         # Production (gitignored, on DO server)
.env.example            # Template (committed to Git)
.env.production.example # Production template (committed to Git)
```

### Create `.env.staging`

```bash
cp .env.production.example .env.staging
```

Edit with Staging values:

```bash
# Domain (Staging)
NEXT_PUBLIC_DOMAIN_MAIN=https://vittasami-staging.vercel.app
NEXT_PUBLIC_DOMAIN_APP=https://vittasami-staging.vercel.app

# Supabase (DEV)
NEXT_PUBLIC_SUPABASE_URL=https://mvvxeqhsatkqtsrulcil.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[dev-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[dev-service-role-key]

# Payments (TEST mode)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Rest are test/dev credentials...
```

### Environment Variable Checklist

| Variable | Dev | Staging | Production |
|----------|-----|---------|------------|
| `NEXT_PUBLIC_DOMAIN_MAIN` | `localhost:3003` | `vittasami-staging.vercel.app` | `vittasami.com` |
| `NEXT_PUBLIC_DOMAIN_APP` | `localhost:3003` | `vittasami-staging.vercel.app` | `app.vittasami.lat` |
| `NEXT_PUBLIC_SUPABASE_URL` | Dev DB | Dev DB | **Prod DB** |
| `SUPABASE_SERVICE_ROLE_KEY` | Dev key | Dev key | **Prod key** |
| `STRIPE_SECRET_KEY` | `sk_test_...` | `sk_test_...` | **`sk_live_...`** |
| `NODE_ENV` | `development` | `production` | `production` |

---

## 📝 Deployment Workflow

### Feature Development

```bash
# 1. Create feature branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/new-feature

# 2. Develop locally
npm run dev
# Test: http://localhost:3003

# 3. Commit and push
git add .
git commit -m "feat: add new feature"
git push origin feature/new-feature

# 4. Create PR to develop
# GitHub: Pull Request > develop ← feature/new-feature

# 5. Review and merge to develop
```

### Staging Deployment

```bash
# 1. Merge develop to staging
git checkout staging
git pull origin staging
git merge develop
git push origin staging

# 2. Vercel auto-deploys
# Wait ~2 minutes
# Check: https://vittasami-staging.vercel.app

# 3. QA Testing
# - Functional testing
# - Integration testing
# - Performance testing
# - Security testing

# 4. If bugs found:
git checkout develop
# Fix bugs
# Repeat from step 1
```

### Production Deployment

```bash
# 1. Ensure staging is stable
# All tests pass ✅
# QA approved ✅

# 2. Merge staging to main
git checkout main
git pull origin main
git merge staging
git push origin main

# 3. SSH into Digital Ocean
ssh root@your-droplet-ip

# 4. Navigate to project
cd /var/www/vittasami

# 5. Pull latest
git pull origin main

# 6. Backup current deployment (optional but recommended)
docker-compose down
cp -r .next .next.backup-$(date +%Y%m%d-%H%M%S)

# 7. Deploy
./deploy.sh

# 8. Verify deployment
curl https://app.vittasami.lat/api/health
curl https://vittasami.com

# 9. Monitor logs
docker-compose logs -f --tail=100

# 10. Smoke testing
# - Test login
# - Test booking
# - Test payment flow
# - Check error logs
```

### Rollback Procedure

**Vercel (Staging):**
```bash
# Option 1: Via Dashboard
# Vercel Dashboard > Deployments > Previous deployment > Promote to Production

# Option 2: Via CLI
vercel rollback [deployment-url]
```

**Digital Ocean (Production):**
```bash
# SSH into server
ssh root@your-droplet-ip

# Option 1: Git revert
cd /var/www/vittasami
git log --oneline -5
git revert [commit-hash]
./deploy.sh

# Option 2: Restore backup
docker-compose down
rm -rf .next
mv .next.backup-[timestamp] .next
./deploy.sh
```

---

## 🔍 Monitoring & Logging

### Vercel (Staging)

```bash
# View logs in real-time
vercel logs vittasami-staging --follow

# View specific deployment
vercel logs [deployment-url]

# Analytics
# Vercel Dashboard > Analytics
# - Page views
# - Response times
# - Error rates
```

### Digital Ocean (Production)

```bash
# SSH into server
ssh root@your-droplet-ip

# View container logs
docker-compose logs -f vittasami-app

# View Nginx logs
docker-compose logs -f nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Check container health
docker-compose ps
docker stats
```

### Supabase Monitoring

```bash
# Development database
# https://mvvxeqhsatkqtsrulcil.supabase.co/project/[id]/database/connections

# Production database
# https://[new-project-id].supabase.co/project/[id]/database/connections

# Monitor:
# - Active connections
# - Query performance
# - Storage usage
# - API requests
```

---

## 🚨 Troubleshooting

### Vercel Issues

**Issue: Build fails on Vercel**
```bash
# Solution 1: Check build logs
vercel logs [deployment-url]

# Solution 2: Test build locally
npm run build
# If it builds locally, check environment variables in Vercel

# Solution 3: Clear Vercel cache
# Vercel Dashboard > Project > Settings > Build & Development > Clear cache
```

**Issue: Environment variables not working**
```bash
# Solution: Ensure variables are set for correct environment
# Vercel Dashboard > Settings > Environment Variables
# Check: Production, Preview, Development checkboxes
```

### Digital Ocean Issues

**Issue: Deploy fails**
```bash
# Check Docker status
docker-compose ps
docker-compose logs

# Rebuild from scratch
docker-compose down
docker system prune -a
./deploy.sh
```

**Issue: Database connection fails**
```bash
# Verify environment variables
cat .env.production | grep SUPABASE

# Test connection
node -e "require('@supabase/supabase-js').createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)"
```

### Supabase Issues

**Issue: RLS policies blocking queries**
```sql
-- Check policies
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- Temporarily disable RLS for testing (DEV ONLY!)
ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;

-- Re-enable after testing
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
```

---

## 📊 Deployment Metrics

### Success Criteria

| Metric | Target | Measurement |
|--------|--------|-------------|
| Build time | < 5 min | Vercel logs |
| Deploy time | < 10 min | `deploy.sh` output |
| Uptime | > 99.9% | UptimeRobot |
| Response time | < 500ms | Vercel Analytics |
| Error rate | < 0.1% | Sentry |

### Weekly Review

```bash
# Staging deployments
# Count: [X] deployments
# Success rate: [Y]%
# Average build time: [Z] min

# Production deployments
# Count: [X] deployments
# Incidents: [Y]
# Rollbacks: [Z]
```

---

## 🎯 Next Steps

1. **[ ] Set up Vercel account** and link project
2. **[ ] Configure environment variables** in Vercel Dashboard
3. **[ ] Create staging branch** and push
4. **[ ] Test staging deployment** thoroughly
5. **[ ] Update production Supabase** connection
6. **[ ] Document deployment procedures** for team
7. **[ ] Set up monitoring** (UptimeRobot, Sentry)
8. **[ ] Create runbook** for on-call incidents

---

**Last Updated:** 2025-01-15
**Maintained by:** Tech Lead
**Review frequency:** Monthly
