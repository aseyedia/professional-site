// ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: 'professional-site',
      script: './app.js',
      instances: 1, // Single instance
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '2G',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000, // Ensure this matches the nginx proxy port for professional-site
      },
    },
  ],
};

