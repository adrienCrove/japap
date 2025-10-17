module.exports = {
  apps: [
    {
      // Configuration principale de l'application
      name: 'japap-backend',
      script: './src/index.js',

      // Variables d'environnement (par défaut: development)
      env: {
        NODE_ENV: 'development',
        PORT: 4000
      },

      // Variables pour la production
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000
      },

      // Mode cluster pour utiliser tous les CPU disponibles
      // En production, utilise tous les CPUs. En dev, une seule instance
      instances: process.env.NODE_ENV === 'production' ? 'max' : 1,
      exec_mode: process.env.NODE_ENV === 'production' ? 'cluster' : 'fork',

      // Watch mode (uniquement en développement)
      watch: process.env.NODE_ENV !== 'production',
      watch_delay: 1000,
      ignore_watch: [
        'node_modules',
        'logs',
        'public/uploads',
        '.git',
        '*.log',
        '.env*'
      ],

      // Gestion des logs
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      merge_logs: true,

      // Gestion de la mémoire
      max_memory_restart: '500M',

      // Politique de redémarrage
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000,

      // Gestion des erreurs
      exp_backoff_restart_delay: 100,

      // Kill timeout (temps d'attente avant force kill)
      kill_timeout: 5000,

      // Attendre que l'application soit prête
      wait_ready: true,
      listen_timeout: 10000,

      // Autres options
      cwd: './',
      interpreter: 'node',
      node_args: '--max-old-space-size=512'
    }
  ],

  // Configuration de déploiement
  deploy: {
    production: {
      user: 'SSH_USERNAME',
      host: 'SSH_HOSTMACHINE',
      ref: 'origin/main',
      repo: 'GIT_REPOSITORY',
      path: '/var/www/japap-backend',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npx prisma generate && npx prisma migrate deploy && pm2 reload ecosystem.config.js --env production && pm2 save',
      'pre-setup': '',
      'ssh_options': 'StrictHostKeyChecking=no'
    },

    staging: {
      user: 'SSH_USERNAME',
      host: 'SSH_HOSTMACHINE',
      ref: 'origin/develop',
      repo: 'GIT_REPOSITORY',
      path: '/var/www/japap-backend-staging',
      'post-deploy': 'npm install && npx prisma generate && npx prisma migrate deploy && pm2 reload ecosystem.config.js --env staging && pm2 save',
      env: {
        NODE_ENV: 'staging'
      }
    }
  }
};
