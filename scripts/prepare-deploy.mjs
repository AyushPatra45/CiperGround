import { readFileSync, writeFileSync } from 'node:fs';
const databaseId = process.env.CF_D1_DATABASE_ID;
const workerName = process.env.CF_WORKER_NAME || 'cipherground';
if (!databaseId || !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(databaseId) || databaseId === '00000000-0000-4000-8000-000000000000') {
  throw new Error('Set CF_D1_DATABASE_ID to the real D1 database ID returned by Wrangler.');
}
if (!/^[a-z0-9][a-z0-9-]{0,62}$/.test(workerName)) throw new Error('Use a lowercase Worker name of at most 63 characters.');
const config = JSON.parse(readFileSync('dist/server/wrangler.json', 'utf8'));
config.name = workerName;
config.d1_databases = [{ binding: 'DB', database_name: process.env.CF_D1_DATABASE_NAME || 'cipherground', database_id: databaseId, migrations_dir: '../../drizzle' }];
config.observability = { enabled: true };
writeFileSync('dist/server/wrangler.deploy.json', JSON.stringify(config, null, 2) + '\n');
console.log('Prepared dist/server/wrangler.deploy.json. Review it, apply migrations, configure secrets, then deploy.');
