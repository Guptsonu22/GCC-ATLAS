process.env.NODE_ENV = 'test';
process.env.DB_PATH = ':memory:';
import { createApp } from './src/index';
import request from 'supertest';
import { closeDatabase } from './src/db/database';
async function main() {
  const app = await createApp();
  const res = await request(app).get('/api/companies?page_size=100');
  console.log('all total=', res.body.total);
  console.log('names:', (res.body.data as { name: string }[] | undefined)?.slice(0, 12).map((r) => r.name).join(' | '));
  await closeDatabase();
}
void main();
