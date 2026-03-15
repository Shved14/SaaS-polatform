#!/bin/bash

# Production Deployment Script for SaaS Platform
# Usage: ./deploy.sh

set -e

echo "🚀 Starting SaaS Platform deployment..."

# Variables
PROJECT_DIR="/var/www/SaaS-polatform"
DOMAIN="${1:-your-domain.com}"  # Accept domain as first argument
PM2_NAME="saas-platform"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   log_error "This script must be run as root"
   exit 1
fi

# Check if project directory exists
if [ ! -d "$PROJECT_DIR" ]; then
    log_error "Project directory $PROJECT_DIR does not exist"
    exit 1
fi

cd $PROJECT_DIR

# Check if domain is provided
if [ "$DOMAIN" = "your-domain.com" ]; then
    log_warn "Using default domain. Please provide your actual domain:"
    echo "Usage: ./deploy.sh your-domain.com"
    echo "Or edit the DOMAIN variable in this script"
fi

# Create logs directory
mkdir -p /var/log/pm2

# 1. Install dependencies
log_info "Installing dependencies..."
npm ci --production

# 2. Generate Prisma client
log_info "Generating Prisma client..."
npx prisma generate

# 3. Set environment variables
log_info "Setting production environment..."
export NODE_ENV=production
export NEXTAUTH_URL=https://$DOMAIN
export COOKIE_DOMAIN=.$DOMAIN

# 4. Run database migrations (if needed)
log_info "Running database migrations..."
npx prisma migrate deploy

# 5. Build application
log_info "Building Next.js application..."
npm run build

# 6. Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    log_info "Installing PM2..."
    npm install -g pm2
fi

# 7. Stop existing PM2 process (if exists)
if pm2 list | grep -q "$PM2_NAME"; then
    log_info "Stopping existing PM2 process..."
    pm2 stop $PM2_NAME
    pm2 delete $PM2_NAME
fi

# 8. Start application with PM2
log_info "Starting application with PM2..."
NODE_ENV=production NEXTAUTH_URL=https://$DOMAIN COOKIE_DOMAIN=.$DOMAIN pm2 start ecosystem.config.js

# 9. Save PM2 configuration
pm2 save
pm2 startup

# 10. Setup Nginx (if not already configured)
if [ ! -f "/etc/nginx/sites-available/$DOMAIN" ]; then
    log_warn "Nginx configuration not found. Please configure Nginx manually:"
    echo "1. Copy nginx.conf.example to /etc/nginx/sites-available/$DOMAIN"
    echo "2. Replace 'your-domain.com' with your actual domain: $DOMAIN"
    echo "3. Create symlink: sudo ln -s /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/"
    echo "4. Test config: sudo nginx -t"
    echo "5. Reload Nginx: sudo systemctl reload nginx"
    echo "6. Setup SSL: sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
fi

# 11. Check application status
log_info "Checking application status..."
sleep 10

if pm2 list | grep -q "$PM2_NAME.*online"; then
    log_info "✅ Application is running successfully!"
    pm2 status
else
    log_error "❌ Application failed to start"
    pm2 logs $PM2_NAME --lines 20
    exit 1
fi

# 12. Test local connectivity
log_info "Testing local connectivity..."
if curl -s http://localhost:3000 > /dev/null; then
    log_info "✅ Application responding on port 3000"
else
    log_error "❌ Application not responding on port 3000"
    pm2 logs $PM2_NAME --lines 10
fi

# 13. Display useful information
echo ""
log_info "🎉 Deployment completed successfully!"
echo ""
echo "📋 Deployment Summary:"
echo "  - Domain: $DOMAIN"
echo "  - Project: $PROJECT_DIR"
echo "  - PM2 App: $PM2_NAME"
echo ""
echo "🔧 Useful commands:"
echo "  - View logs: pm2 logs $PM2_NAME"
echo "  - Restart app: pm2 restart $PM2_NAME"
echo "  - Stop app: pm2 stop $PM2_NAME"
echo "  - View status: pm2 status"
echo ""
echo "🌐 Next steps:"
echo "  1. Configure Nginx (if not done)"
echo "  2. Setup SSL with Certbot: sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo "  3. Update your DNS to point to this server"
echo ""
echo "🚀 Application should be available at: https://$DOMAIN"
