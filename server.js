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

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
