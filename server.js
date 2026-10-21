import fs from 'node:fs';
import path from 'node:path';
import { loadConfig } from './src/config.js';
import { createApp } from './src/app.js';

const envFile = path.join(import.meta.dirname, '.env');
if (fs.existsSync(envFile)) process.loadEnvFile(envFile);

const config = loadConfig();
const app = await createApp(config);

const server = app.listen(config.port, config.host, () => {
  const url = config.baseUrl || `http://localhost:${config.port}`;
  console.log(`Site disponible sur ${url} (administration : ${url}/admin)`);
});

// À l'arrêt : les statistiques du moment sont enregistrées avant de quitter.
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close();
    app.ctx.stats
      .flush()
      .catch((err) => console.error('Statistiques non enregistrées :', err.message))
      .finally(() => process.exit(0));
  });
}
