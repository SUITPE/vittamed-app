#!/bin/bash

# VittaMed DigitalOcean Deployment Script
# Usage: ./deploy.sh

set -e

echo "🚀 Starting VittaMed deployment to DigitalOcean..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if .env.production exists
if [ ! -f .env.production ]; then
    print_error ".env.production file not found!"
    print_warning "Please create .env.production with your production environment variables"
    exit 1
fi

# Load environment variables
export $(cat .env.production | xargs)

print_status "Building and deploying VittaMed..."

# Stop existing containers
print_status "Stopping existing containers..."
docker-compose down || true

# Remove old images
print_status "Cleaning up old Docker images..."
docker image prune -f

# Build new image
print_status "Building new Docker image..."
docker-compose build --no-cache

# Start services
print_status "Starting services..."
docker-compose up -d

# Wait for health check
print_status "Waiting for application to start..."
sleep 30

# Check if application is running
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    print_success "✅ VittaMed is running successfully!"
    print_success "🌍 Application is available at: http://your-server-ip:3000"
    print_status "📊 Check application status with: docker-compose ps"
    print_status "📝 View logs with: docker-compose logs -f"
else
    print_error "❌ Application health check failed"
    print_warning "Check logs with: docker-compose logs"
    exit 1
fi

# Show running containers
print_status "Running containers:"
docker-compose ps

print_success "🎉 Deployment completed successfully!"
print_status "Remember to:"
print_status "  1. Configure your domain DNS to point to your server IP"
print_status "  2. Set up SSL certificates"
print_status "  3. Update nginx.conf with your domain name"