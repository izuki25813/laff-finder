import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

// Importante: scripts de diagnóstico com anon key têm limitações reais.
// Em Supabase, a anon key pode falhar ao consultar objetos protegidos ou metadados do schema
// mesmo quando o objeto existe. Portanto, "permission denied" e "schema cache" não indicam
// ausência estrutural; a confirmação final deve vir do SQL Editor do Supabase.

const envPath = path.resolve('.env.local');
const envFile = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
const env = {};
for (const line of envFile.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const idx = trimmed.indexOf('=');
  if (idx >= 0) env[trimmed.slice(0, idx)] = trimmed.slice(idx + 1).trim();
}

const url = (env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
const anon = (env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();

const report = {
  env: {
    supabaseUrl: url ? 'PRESENTE' : 'AUSENTE',
    anonKey: anon ? 'PRESENTE' : 'AUSENTE',
    urlFormat: /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url) ? 'VALIDO' : 'INVALIDO',
  },
  connection: null,
  schema: null,
  auth: null,
};

function maskValue(value) {
  if (!value) return 'N/A';
  return `${value.slice(0, 8)}...${value.slice(-4)}`;
}

const client = createClient(url, anon, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

try {
  const { data: tablesData, error: tablesError } = await client.from('profiles').select('id').limit(1);
  report.connection = {
    reachable: !tablesError,
    tableAccess: tablesError ? 'FALHOU' : 'OK',
    error: tablesError ? { code: tablesError.code || null, message: String(tablesError.message || '') } : null,
    rowCount: Array.isArray(tablesData) ? tablesData.length : 0,
  };
} catch (error) {
  report.connection = {
    reachable: false,
    tableAccess: 'FALHOU',
    error: { message: String(error && error.message ? error.message : error) },
  };
}

try {
  const [tableProbe, functionProbe, triggerProbe] = await Promise.all([
    client.from('pg_class').select('relname').eq('relname', 'profiles').limit(1),
    client.from('pg_proc').select('proname').eq('proname', 'is_admin').limit(1),
    client.from('pg_trigger').select('tgname').eq('tgname', 'on_auth_user_created').limit(1),
  ]);

  report.schema = {
    profilesTable: tableProbe.error ? 'AUSENTE' : 'PRESENTE',
    isAdminFunction: functionProbe.error ? 'AUSENTE' : 'PRESENTE',
    handleNewUserFunction: 'DESCONHECIDO',
    trigger: triggerProbe.error ? 'AUSENTE' : 'PRESENTE',
    rls: 'DESCONHECIDO',
    metadata: {
      tableProbe: tableProbe.data || null,
      functionProbe: functionProbe.data || null,
      triggerProbe: triggerProbe.data || null,
    },
    rpcError: null,
    rpcResult: null,
  };
} catch (error) {
  report.schema = {
    profilesTable: 'DESCONHECIDO',
    isAdminFunction: 'DESCONHECIDO',
    handleNewUserFunction: 'DESCONHECIDO',
    trigger: 'DESCONHECIDO',
    rls: 'DESCONHECIDO',
    rpcError: { message: String(error && error.message ? error.message : error) },
    rpcResult: null,
  };
}

console.log(JSON.stringify({
  ...report,
  redacted: {
    supabaseUrl: maskValue(url),
    anonKey: maskValue(anon),
  },
}, null, 2));
