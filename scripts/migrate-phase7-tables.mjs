import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is missing in .env.local');
  process.exit(1);
}

const sql = neon(connectionString);

async function run() {
  console.log('Migrating Phase 7 tables to Neon Postgres...');

  // 1. contact_messages
  console.log('Creating contact_messages table...');
  await sql.query(`
    CREATE TABLE IF NOT EXISTS "contact_messages" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "user_id" text,
      "name" text NOT NULL,
      "email" text NOT NULL,
      "topic" text NOT NULL,
      "message" text NOT NULL,
      "status" text DEFAULT 'new' NOT NULL,
      "ip_hash" text NOT NULL,
      "user_agent" text,
      "email_status" text DEFAULT 'skipped' NOT NULL,
      "admin_note" text,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    );
  `);
  await sql.query(`CREATE INDEX IF NOT EXISTS "contact_messages_user_id_idx" ON "contact_messages" ("user_id");`);
  await sql.query(`CREATE INDEX IF NOT EXISTS "contact_messages_status_idx" ON "contact_messages" ("status");`);
  await sql.query(`CREATE INDEX IF NOT EXISTS "contact_messages_created_at_idx" ON "contact_messages" ("created_at");`);
  console.log('✔ contact_messages table and indexes created.');

  // 2. feedback_reports
  console.log('Creating feedback_reports table...');
  await sql.query(`
    CREATE TABLE IF NOT EXISTS "feedback_reports" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "user_id" text,
      "type" text NOT NULL,
      "title" text NOT NULL,
      "description" text NOT NULL,
      "steps_to_reproduce" text,
      "expected_result" text,
      "actual_result" text,
      "severity" text DEFAULT 'medium' NOT NULL,
      "screenshot_url" text,
      "context_url" text,
      "browser_info" text,
      "os_info" text,
      "app_version" text,
      "status" text DEFAULT 'new' NOT NULL,
      "email_status" text DEFAULT 'skipped' NOT NULL,
      "admin_note" text,
      "ip_hash" text NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    );
  `);
  await sql.query(`CREATE INDEX IF NOT EXISTS "feedback_reports_user_id_idx" ON "feedback_reports" ("user_id");`);
  await sql.query(`CREATE INDEX IF NOT EXISTS "feedback_reports_type_idx" ON "feedback_reports" ("type");`);
  await sql.query(`CREATE INDEX IF NOT EXISTS "feedback_reports_status_idx" ON "feedback_reports" ("status");`);
  await sql.query(`CREATE INDEX IF NOT EXISTS "feedback_reports_created_at_idx" ON "feedback_reports" ("created_at");`);
  console.log('✔ feedback_reports table and indexes created.');

  // Verify tables
  const rows = await sql.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;`);
  console.log('All public tables now present in database:');
  console.log(rows.map((r) => r.table_name));
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
