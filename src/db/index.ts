import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

let _instance: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (_instance) return _instance;
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL が設定されていません。.env.local を確認してください。');
  }
  _instance = drizzle(postgres(process.env.DATABASE_URL), { schema });
  return _instance;
}
