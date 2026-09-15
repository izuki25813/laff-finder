import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = {};
for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const idx = trimmed.indexOf('=');
  if (idx >= 0) env[trimmed.slice(0, idx)] = trimmed.slice(idx + 1).trim();
}

const url = (env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
const anon = (env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
const client = createClient(url, anon, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const result = { hasUrl: Boolean(url), hasAnonKey: Boolean(anon), urlLooksValid: /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url), restPathIncluded: url.includes('/rest/v1') };

try {
  const { data, error } = await client.from('profiles').select('id').limit(1);
  console.log(JSON.stringify({
    ...result,
    ok: !error,
    rowCount: Array.isArray(data) ? data.length : 0,
    error: error ? { code: error.code || null, message: String(error.message || ''), status: error.status || null } : null,
  }));
} catch (error) {
  console.log(JSON.stringify({
    ...result,
    ok: false,
    error: { message: String(error && error.message ? error.message : error) },
  }));
}
