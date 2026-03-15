module.exports = {
  apps: [
    {
      name: 'saas-platform',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/SaaS-polatform',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/var/log/pm2/saas-platform-error.log',
      out_file: '/var/log/pm2/saas-platform-out.log',
      log_file: '/var/log/pm2/saas-platform-combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      restart_delay: 4000
    }
  ]
};
