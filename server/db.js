import { Pool, neonConfig } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import ws from 'ws';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required. Add it to app/.env.local before running the server.');
}

neonConfig.webSocketConstructor = ws;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 8,
});

export async function withClient(work) {
  const client = await pool.connect();
  try {
    return await work(client);
  } finally {
    client.release();
  }
}

export async function testConnection() {
  return withClient(async (client) => {
    await client.query('SELECT 1');
  });
}
