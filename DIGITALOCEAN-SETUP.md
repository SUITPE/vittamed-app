# 🚀 VittaMed DigitalOcean Deployment Guide

## 📋 Prerequisites

- DigitalOcean server: **2GB RAM, Ubuntu 22.04** ✅
- Domain name (optional but recommended)
- SSH access to your server

## 🛠️ Server Setup (One-time setup)

### 1. Connect to your DigitalOcean server

```bash
ssh root@your-server-ip
```

### 2. Update system and install dependencies

```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose -y

# Install other utilities
apt install curl git htop ufw -y

# Start Docker service
systemctl start docker
systemctl enable docker
```

### 3. Configure firewall

```bash
# Configure UFW
ufw allow ssh
ufw allow 80
ufw allow 443
ufw --force enable
```

### 4. Clone VittaMed repository

```bash
# Clone your repository
git clone https://github.com/SUITPE/vittamed-app.git
cd vittamed-app
```

## 🔐 Environment Configuration

### 1. Create production environment file

```bash
cp .env.example .env.production
nano .env.production
```

### 2. Configure environment variables

```bash
# Required Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional Stripe Configuration (for payments)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Optional WhatsApp Configuration (Twilio)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_WHATSAPP_NUMBER=+1234567890

# Environment
NODE_ENV=production
```

## 🚀 Deploy VittaMed

### Simple deployment (recommended)

```bash
# Make deployment script executable
chmod +x deploy.sh

# Deploy VittaMed
./deploy.sh
```

### Manual deployment (alternative)

```bash
# Build and start services
docker-compose build
docker-compose up -d

# Check status
docker-compose ps
```

## 🌍 Domain Configuration (Optional)

### 1. Point your domain to your server

In your domain registrar, create an A record:
```
Type: A
Name: @ (or vittamed)
Value: your-server-ip
TTL: 300
```

### 2. Update Nginx configuration

```bash
# Edit nginx.conf
nano nginx.conf

# Replace 'your-domain.com' with your actual domain
# Replace both occurrences in the file
```

### 3. Get SSL certificate (Let's Encrypt)

```bash
# Install Certbot
apt install certbot python3-certbot-nginx -y

# Get certificate
certbot --nginx -d your-domain.com -d www.your-domain.com

# Test auto-renewal
certbot renew --dry-run
```

## 📊 Monitoring & Maintenance

### Check application status

```bash
# View running containers
docker-compose ps

# View application logs
docker-compose logs -f vittamed-app

# View nginx logs
docker-compose logs -f nginx

# Check health endpoint
curl http://localhost:3000/api/health
```

### Update VittaMed

```bash
# Pull latest changes
git pull origin main

# Redeploy
./deploy.sh
```

### Backup & Restore

```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups"
mkdir -p $BACKUP_DIR

# Backup Docker volumes
docker run --rm -v vittamed_vittamed-data:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/vittamed_backup_$DATE.tar.gz -C /data .

echo "Backup created: vittamed_backup_$DATE.tar.gz"
EOF

chmod +x backup.sh
```

## 🔧 Performance Optimization

### For 2GB RAM server

```bash
# Add swap space
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# Optimize Docker
echo '{"log-driver": "json-file", "log-opts": {"max-size": "10m", "max-file": "3"}}' > /etc/docker/daemon.json
systemctl restart docker
```

## 🛡️ Security Best Practices

### 1. Disable root login

```bash
# Create new user
adduser vittamed
usermod -aG sudo vittamed
usermod -aG docker vittamed

# Copy SSH keys
mkdir /home/vittamed/.ssh
cp ~/.ssh/authorized_keys /home/vittamed/.ssh/
chown -R vittamed:vittamed /home/vittamed/.ssh
chmod 700 /home/vittamed/.ssh
chmod 600 /home/vittamed/.ssh/authorized_keys

# Disable root login
sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
systemctl restart ssh
```

### 2. Configure automatic updates

```bash
apt install unattended-upgrades -y
dpkg-reconfigure -plow unattended-upgrades
```

## 📈 Cost Optimization

### With your 2GB DigitalOcean server:

- **VittaMed**: ~512MB RAM
- **Nginx**: ~50MB RAM
- **System**: ~200MB RAM
- **Available**: ~1.2GB RAM for growth ✅

**Total cost**: $0/month additional (using existing server) 🎉

## 🆘 Troubleshooting

### Common issues:

```bash
# Application won't start
docker-compose logs vittamed-app

# Port already in use
sudo lsof -i :3000
sudo kill -9 <PID>

# Out of space
df -h
docker system prune -a

# Memory issues
free -h
htop
```

### Emergency restart

```bash
docker-compose down
docker-compose up -d
```

## ✅ Success Checklist

- [ ] Server updated and Docker installed
- [ ] Firewall configured (ports 80, 443, 22)
- [ ] Environment variables configured
- [ ] VittaMed deployed successfully
- [ ] Health check passing (`curl localhost:3000/api/health`)
- [ ] Domain configured (optional)
- [ ] SSL certificate installed (optional)
- [ ] Backup script created
- [ ] Monitoring setup

## 🎉 Congratulations!

VittaMed is now running on your DigitalOcean server!

**Access your application:**
- **Without domain**: http://your-server-ip:3000
- **With domain**: https://your-domain.com

**Admin credentials:**
- Email: admin@clinicasanrafael.com
- Password: password

---

**💡 Pro Tips:**
- Monitor logs regularly: `docker-compose logs -f`
- Set up automated backups
- Use a domain for professional appearance
- Enable SSL for security and SEO