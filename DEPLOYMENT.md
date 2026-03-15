# 🚀 SaaS Platform Production Deployment Guide

## 📋 Prerequisites

- Ubuntu/Debian VPS with root access
- PostgreSQL database installed and running
- Nginx installed
- Node.js 18+ installed
- Domain name pointing to your server

## 🔧 Environment Setup

### 1. Clone the project
```bash
cd /var/www
git clone <your-repo-url> SaaS-polatform
cd SaaS-polatform
```

### 2. Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 3. Install PostgreSQL
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo -u postgres createuser --interactive
sudo -u postgres createdb saas_platform
```

### 4. Install Nginx
```bash
sudo apt update
sudo apt install nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

## 📝 Environment Configuration

### 1. Create .env file
```bash
cp .env.example .env
nano .env
```

### 2. Update .env with your values:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/saas_platform"
NEXTAUTH_URL="https://your-domain.com"
AUTH_SECRET="your_32_character_secret_here"
NODE_ENV="production"
COOKIE_DOMAIN=".your-domain.com"

# OAuth providers (optional)
AUTH_GOOGLE_ID="your_google_client_id"
AUTH_GOOGLE_SECRET="your_google_client_secret"

# Email (optional)
RESEND_API_KEY="your_resend_api_key"
RESEND_FROM="TaskFlow <noreply@your-domain.com>"
```

## 🗄️ Database Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Generate Prisma client
```bash
npx prisma generate
```

### 3. Run migrations
```bash
npx prisma migrate deploy
```

### 4. (Optional) Seed database
```bash
npx prisma db seed
```

## 🏗️ Build & Deploy

### Option 1: Automated Deployment
```bash
chmod +x deploy.sh
./deploy.sh
```

### Option 2: Manual Deployment
```bash
# Install production dependencies
npm ci --production

# Build the application
npm run build

# Install PM2
npm install -g pm2

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 🌐 Nginx Configuration

### 1. Create Nginx config
```bash
sudo nano /etc/nginx/sites-available/your-domain.com
```

### 2. Copy the nginx.conf.example content and update:
- Replace `your-domain.com` with your actual domain
- Update SSL paths after Certbot

### 3. Enable site
```bash
sudo ln -s /etc/nginx/sites-available/your-domain.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🔒 SSL Setup with Certbot

### 1. Install Certbot
```bash
sudo apt install certbot python3-certbot-nginx
```

### 2. Generate SSL certificate
```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

### 3. Setup auto-renewal
```bash
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 📊 Monitoring & Logs

### View PM2 status
```bash
pm2 status
pm2 logs saas-platform
pm2 monit
```

### View logs
```bash
# PM2 logs
pm2 logs saas-platform --lines 100

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## 🔄 Updates & Maintenance

### Update application
```bash
cd /var/www/SaaS-polatform
git pull
npm ci --production
npm run build
pm2 restart saas-platform
```

### Database migrations
```bash
npx prisma migrate deploy
npx prisma generate
pm2 restart saas-platform
```

## 🛠️ Troubleshooting

### Common Issues

1. **Port 3000 already in use**
   ```bash
   sudo lsof -i :3000
   sudo kill -9 <PID>
   ```

2. **Database connection failed**
   ```bash
   # Check PostgreSQL status
   sudo systemctl status postgresql
   
   # Test connection
   psql -h localhost -U username -d saas_platform
   ```

3. **Nginx 502 Bad Gateway**
   ```bash
   # Check if Next.js is running
   pm2 status
   
   # Check Nginx config
   sudo nginx -t
   ```

4. **SSL certificate issues**
   ```bash
   # Check certificate status
   sudo certbot certificates
   
   # Renew manually
   sudo certbot renew
   ```

### Performance Optimization

1. **Enable gzip compression** (already in Nginx config)
2. **Configure caching** for static assets
3. **Use CDN** for better performance
4. **Monitor memory usage** with PM2

## 🔐 Security Checklist

- [ ] Change default passwords
- [ ] Configure firewall (ufw)
- [ ] Set up fail2ban
- [ ] Regular backups
- [ ] Monitor logs
- [ ] Keep dependencies updated

## 📱 Environment Variables for Production

Make sure these are set in your production `.env`:

```env
NODE_ENV=production
NEXTAUTH_URL=https://your-domain.com
COOKIE_DOMAIN=.your-domain.com
DATABASE_URL=postgresql://user:pass@localhost:5432/db
AUTH_SECRET=32_character_minimum_secret
```

## 🎯 Final Steps

1. Test the application locally: `http://localhost:3000`
2. Test through Nginx: `http://your-domain.com`
3. Test HTTPS: `https://your-domain.com`
4. Test authentication flows
5. Test all features work correctly

Your SaaS platform is now live! 🎉
