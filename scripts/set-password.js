// Définit le mot de passe de l'administration.
// Usage : npm run set-password            (saisie masquée)
//         npm run set-password -- "motdepasse"

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { loadConfig } from '../src/config.js';
import { Auth } from '../src/auth.js';

const envFile = path.join(import.meta.dirname, '..', '.env');
if (fs.existsSync(envFile)) process.loadEnvFile(envFile);

function ask(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (text) => {
      if (text.includes(question)) process.stdout.write(text);
      else process.stdout.write('*'.repeat(text.length));
    };
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write('\n');
      resolve(answer);
    });
  });
}

const config = loadConfig();
if (config.adminPassword) {
  console.error('ADMIN_PASSWORD est défini : modifiez directement cette variable (fichier .env ou hébergeur).');
  process.exit(1);
}

let password = process.argv[2];
if (!password) {
  password = await ask('Nouveau mot de passe : ');
  const confirm = await ask('Confirmez le mot de passe : ');
  if (password !== confirm) {
    console.error('Les deux mots de passe ne correspondent pas.');
    process.exit(1);
  }
}
if (password.length < 10) {
  console.error('Choisissez un mot de passe d’au moins 10 caractères.');
  process.exit(1);
}

const auth = new Auth({ dataDir: config.dataDir, log: { warn() {}, info() {} } });
await auth.init();
await auth.setPassword(password);
console.log('Mot de passe enregistré. Les sessions ouvertes ont été déconnectées.');
