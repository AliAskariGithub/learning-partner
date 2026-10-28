import { config } from 'dotenv';
config({ path: '.env.local' });

import { defineConfig } from 'drizzle-kit';

const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL_UNPOOLED or DATABASE_URL must be set in .env.local');
}

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: connectionString,
  },
});
