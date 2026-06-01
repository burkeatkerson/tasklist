// Discovers the correct Supabase IPv4 session-pooler host for this project by
// trying each region's pooler with the project credentials. Prints the working
// host on success. One-off helper; not part of the app.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import pg from 'pg';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
for (const line of readFileSync(join(root, '.env'), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
}

const REF = 'rajkyctcbbowuxdchdve';
const PASSWORD = process.env.SUPABASE_DB_PASSWORD;
const REGIONS = [
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'ca-central-1', 'sa-east-1',
  'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-central-1', 'eu-central-2', 'eu-north-1',
  'ap-south-1', 'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'ap-northeast-2',
];
const PREFIXES = ['aws-0', 'aws-1'];

async function tryHost(host) {
  const client = new pg.Client({
    host,
    port: 5432,
    user: `postgres.${REF}`,
    password: PASSWORD,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 7000,
  });
  try {
    await client.connect();
    await client.query('select 1');
    await client.end();
    return true;
  } catch (e) {
    await client.end().catch(() => {});
    return e.message;
  }
}

const candidates = [];
for (const pre of PREFIXES)
  for (const r of REGIONS) candidates.push(`${pre}-${r}.pooler.supabase.com`);

const results = await Promise.all(
  candidates.map(async (h) => [h, await tryHost(h)]),
);
const hit = results.find(([, r]) => r === true);
if (hit) {
  console.log('FOUND_POOLER_HOST=' + hit[0]);
} else {
  console.log('No pooler matched. Sample errors:');
  for (const [h, r] of results.slice(0, 6)) console.log(' ', h, '->', r);
}
