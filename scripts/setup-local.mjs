import { existsSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
if (existsSync('.dev.vars')) {
  console.log('.dev.vars already exists; existing secrets were preserved.');
  process.exit(0);
}
const token = () => randomBytes(32).toString('hex');
writeFileSync(
  '.dev.vars',
  `FLAG_KEY=${token()}\nRUNNER_URL=\nRUNNER_TOKEN=${token()}\nADMIN_BOOTSTRAP_TOKEN=${token()}\n`,
  { mode: 0o600, flag: 'wx' },
);
console.log(
  'Created private local secrets in .dev.vars. Use its ADMIN_BOOTSTRAP_TOKEN in Author studio, then remove that value after claiming administrator access.',
);
