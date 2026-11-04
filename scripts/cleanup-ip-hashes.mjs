#!/usr/bin/env node
/**
 * IP Hash Retention Cleanup Script
 * 
 * Anonymizes/wipes IP hashes from contact_messages and feedback_reports
 * older than siteConfig.retention.ipHashSpamLogsDays (default: 30 days).
 */

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const RETENTION_DAYS = 30;

async function runCleanup() {
  if (!process.env.DATABASE_URL) {
    console.warn('[cleanup-ip-hashes] No DATABASE_URL provided. Skipping database cleanup.');
    process.exit(0);
  }

  const sql = neon(process.env.DATABASE_URL);
  const cutoffDate = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();

  console.log(`[cleanup-ip-hashes] Scrubbing IP hashes created before ${cutoffDate}...`);

  try {
    const contactResult = await sql`
      UPDATE contact_messages 
      SET ip_hash = '[scrubbed-after-retention]' 
      WHERE created_at < ${cutoffDate} AND ip_hash != '[scrubbed-after-retention]'
    `;

    const feedbackResult = await sql`
      UPDATE feedback_reports 
      SET ip_hash = '[scrubbed-after-retention]' 
      WHERE created_at < ${cutoffDate} AND ip_hash != '[scrubbed-after-retention]'
    `;

    console.log(`[cleanup-ip-hashes] Successfully scrubbed expired IP hashes.`);
    process.exit(0);
  } catch (err) {
    console.error('[cleanup-ip-hashes] Error executing cleanup:', err.message);
    process.exit(1);
  }
}

runCleanup();

