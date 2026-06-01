// Applies db/schema.sql and db/seed.sql to the Supabase Postgres database.
// Reads connection details from .env (never bundled into the frontend).
//
//   node scripts/migrate.mjs            # schema + seed
//   node scripts/migrate.mjs --no-seed  # schema only
//
// If the default direct host isn't reachable from your network (Supabase direct
// connections are IPv6-only on some plans), set SUPABASE_DB_HOST to the IPv4
// session pooler host from your dashboard, e.g.
//   SUPABASE_DB_HOST=aws-0-<region>.pooler.supabase.com
//   SUPABASE_DB_PORT=5432
//   SUPABASE_DB_USER=postgres.rajkyctcbbowuxdchdve

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function loadEnv() {
  try {
    const raw = readFileSync(join(root, '.env'), 'utf8');
    for (const line of raw.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      let val = m[2];
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!(m[1] in process.env)) process.env[m[1]] = val;
    }
  } catch {
    // no .env — rely on real environment
  }
}

loadEnv();

const connection = process.env.SUPABASE_DB_URL
  ? { connectionString: process.env.SUPABASE_DB_URL }
  : {
      host: process.env.SUPABASE_DB_HOST,
      port: Number(process.env.SUPABASE_DB_PORT || 5432),
      user: process.env.SUPABASE_DB_USER || 'postgres',
      password: process.env.SUPABASE_DB_PASSWORD,
      database: process.env.SUPABASE_DB_NAME || 'postgres',
    };

if (!connection.connectionString && (!connection.host || !connection.password)) {
  console.error(
    'Missing DB connection. Set SUPABASE_DB_URL, or SUPABASE_DB_HOST + SUPABASE_DB_PASSWORD in .env.',
  );
  process.exit(1);
}

const client = new pg.Client({
  ...connection,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
});

const runSeed = !process.argv.includes('--no-seed');
const fileFlag = process.argv.indexOf('--file');
const onlyFile = fileFlag !== -1 ? process.argv[fileFlag + 1] : null;

async function run() {
  await client.connect();

  // Run a single ad-hoc SQL file (e.g. an incremental migration) and stop.
  if (onlyFile) {
    const sql = readFileSync(join(root, onlyFile), 'utf8');
    console.log(`Connected. Applying ${onlyFile}…`);
    await client.query(sql);
    console.log(`✓ ${onlyFile} applied`);
    return;
  }

  const schema = readFileSync(join(root, 'db', 'schema.sql'), 'utf8');
  console.log('Connected. Applying schema…');
  await client.query(schema);
  console.log('✓ schema applied');

  if (runSeed) {
    const seed = readFileSync(join(root, 'db', 'seed.sql'), 'utf8');
    await client.query(seed);
    const { rows } = await client.query(
      'select (select count(*) from public.projects) as projects, (select count(*) from public.tasks) as tasks',
    );
    console.log(`✓ seed applied — ${rows[0].projects} projects, ${rows[0].tasks} tasks`);
  }
}

run()
  .then(() => client.end())
  .then(() => {
    console.log('Done.');
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('\nMigration failed:', err.message);
    if (err.code === 'ENOTFOUND' || err.code === 'ETIMEDOUT') {
      console.error(
        '\nThe direct DB host was unreachable. Use the IPv4 session pooler host from\n' +
          'Supabase → Project Settings → Database → Connection pooling, and update\n' +
          'SUPABASE_DB_HOST / SUPABASE_DB_USER in .env. Or paste db/schema.sql and\n' +
          'db/seed.sql into the Supabase SQL Editor.',
      );
    }
    await client.end().catch(() => {});
    process.exit(1);
  });
