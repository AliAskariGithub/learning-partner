import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function main() {
  console.log('Ensuring connections table exists...');
  await sql`
    CREATE TABLE IF NOT EXISTS connections (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL,
      provider TEXT NOT NULL,
      method TEXT NOT NULL,
      call_mode TEXT NOT NULL DEFAULT 'server',
      base_url TEXT,
      status TEXT NOT NULL DEFAULT 'connected',
      encrypted_access_token TEXT,
      encrypted_refresh_token TEXT,
      access_token_expires_at TIMESTAMP WITH TIME ZONE,
      granted_scopes JSONB,
      account_label TEXT,
      model_capability_overrides JSONB,
      last_error TEXT,
      last_used_at TIMESTAMP WITH TIME ZONE,
      is_default BOOLEAN NOT NULL DEFAULT false,
      auto_fallback BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
  `;

  await sql`CREATE INDEX IF NOT EXISTS connections_user_id_idx ON connections(user_id);`;
  await sql`CREATE INDEX IF NOT EXISTS connections_provider_idx ON connections(provider);`;
  await sql`CREATE INDEX IF NOT EXISTS connections_status_idx ON connections(status);`;

  console.log('Checking for legacy api_keys to migrate...');
  const legacyKeys = await sql`SELECT * FROM api_keys;`;
  console.log(`Found ${legacyKeys.length} legacy keys.`);

  for (const k of legacyKeys) {
    const provider = k.provider === 'google' ? 'gemini' : k.provider;
    const method = k.custom_base_url ? 'custom_endpoint' : 'api_key';
    
    // Check if already in connections
    const existing = await sql`
      SELECT id FROM connections 
      WHERE user_id = ${k.user_id} 
        AND provider = ${provider} 
        AND (account_label = ${k.label} OR encrypted_access_token = ${k.encrypted_key})
      LIMIT 1;
    `;

    if (existing.length === 0) {
      await sql`
        INSERT INTO connections (
          user_id,
          provider,
          method,
          call_mode,
          base_url,
          status,
          encrypted_access_token,
          account_label,
          last_used_at,
          created_at,
          updated_at
        ) VALUES (
          ${k.user_id},
          ${provider},
          ${method},
          'server',
          ${k.custom_base_url || null},
          ${k.status || 'connected'},
          ${k.encrypted_key},
          ${k.label || 'API Key'},
          ${k.last_used_at || null},
          ${k.created_at || new Date()},
          ${k.created_at || new Date()}
        );
      `;
      console.log(`Migrated key for provider ${provider} (${k.label})`);
    }
  }

  const countResult = await sql`SELECT COUNT(*) FROM connections;`;
  console.log(`Total connections now in DB: ${countResult[0]?.count}`);
}

main().catch((err) => {
  console.error('Migration error:', err);
  process.exit(1);
});

