import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function main() {
  console.log('Creating outputs table...');
  await sql`
    CREATE TABLE IF NOT EXISTS outputs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      notebook_id UUID NOT NULL REFERENCES notebooks(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      source_ids JSONB,
      model TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'generating',
      error_message TEXT,
      script JSONB,
      audio_keys JSONB,
      duration_seconds INTEGER,
      voice_config JSONB,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS outputs_notebook_id_idx ON outputs(notebook_id);`;
  await sql`CREATE INDEX IF NOT EXISTS outputs_user_id_idx ON outputs(user_id);`;
  await sql`CREATE INDEX IF NOT EXISTS outputs_type_idx ON outputs(type);`;
  await sql`CREATE INDEX IF NOT EXISTS outputs_status_idx ON outputs(status);`;
  console.log('Outputs table successfully created or verified!');
}

main().catch((err) => {
  console.error('Migration error:', err);
  process.exit(1);
});

