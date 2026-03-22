module.exports = {
  apps: [
    {
      name: 'chicken-raffle-backend',
      cwd: './backend',
      script: 'server.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3555
      },
      max_restarts: 10,
      restart_delay: 5000,
      max_memory_restart: '500M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss'
    },
    {
      name: 'chicken-raffle-frontend',
      cwd: './frontend',
      script: 'serve.js',
      env: {
        NODE_ENV: 'production',
        PM2_SERVE_PORT: 8555
      },
      max_restarts: 10,
      restart_delay: 5000,
      watch: false
    }
  ]
};
