import { build } from 'esbuild';
import { mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
mkdirSync('.test-build', { recursive: true });
await build({
  entryPoints: ['server/api.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: '.test-build/api.mjs',
});
const r = spawnSync(process.execPath, ['--test', 'tests/api.test.mjs'], {
  stdio: 'inherit',
});
process.exit(r.status ?? 1);
