/**
 * PM2 — Configuration de production
 * Global Shop · Tching's Fils Multiservices
 *
 * Commandes utiles :
 *   pm2 start ecosystem.config.cjs   → démarrer
 *   pm2 stop global-shop             → arrêter
 *   pm2 restart global-shop          → redémarrer
 *   pm2 logs global-shop             → voir les logs
 *   pm2 monit                        → monitoring temps réel
 */

module.exports = {
  apps: [
    {
      name: "global-shop",

      // next start démarre le serveur de production (après npm run build)
      script: "node_modules/.bin/next",
      args:   "start",

      cwd:  __dirname,
      port: 3000,

      // Redémarrage automatique si le process plante
      autorestart:     true,
      max_restarts:    10,
      restart_delay:   3000,  // 3s entre chaque tentative

      // Mémoire max avant redémarrage forcé (512 Mo suffisent largement)
      max_memory_restart: "512M",

      // Variables d'environnement de production
      env_production: {
        NODE_ENV: "production",
        PORT:     "3000",
      },

      // Logs
      out_file:   "logs/pm2-out.log",
      error_file: "logs/pm2-error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      merge_logs: true,
    },
  ],
};
