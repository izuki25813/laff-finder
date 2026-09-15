import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

// Limitação importante do diagnóstico com anon key:
// a chave anônima não pode confirmar metadados protegidos nem objetos que exigem
// privilégio de leitura do schema do banco. Erros como "permission denied for table profiles"
// ou "Could not find the table ... in the schema cache" não são evidência de tabela inexistente.
// A confirmação estrutural real foi feita diretamente no SQL Editor do Supabase.

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
const serviceRole = (env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

const report = {
  env: {
    supabaseUrl: url ? 'PRESENTE' : 'AUSENTE',
    anonKey: anon ? 'PRESENTE' : 'AUSENTE',
    serviceRoleKey: serviceRole ? 'PRESENTE' : 'AUSENTE',
    urlFormat: /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url) ? 'VALIDO' : 'INVALIDO',
  },
  readOnlyChecks: {
    profilesTable: 'NA',
    columns: 'NA',
    userRoleEnum: 'NA',
    rlsEnabled: 'NA',
    policies: 'NA',
    functions: 'NA',
    triggers: 'NA',
    foreignKey: 'NA',
    security: 'NA',
    consistency: 'NA',
  },
  notes: [],
};

const mask = (v) => (!v ? 'N/A' : `${v.slice(0, 8)}...${v.slice(-4)}`);

if (!url || !anon) {
  report.notes.push('Credenciais públicas ausentes. Não é possível validar o banco real sem NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  console.log(JSON.stringify({ ...report, redacted: { supabaseUrl: mask(url), anonKey: mask(anon), serviceRoleKey: mask(serviceRole) } }, null, 2));
  process.exit(0);
}

const client = createClient(url, anon, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

let tableProbe = null;
let columnsProbe = null;
let enumProbe = null;
let tableMeta = null;

try {
  const { data, error } = await client.from('profiles').select('id, email, full_name, nickname, avatar_url, role, created_at, updated_at').limit(1);
  tableProbe = !error;
  columnsProbe = data ? 'OK' : 'SEM_DADOS';
  if (error) {
    report.notes.push(`Consulta de profiles falhou: ${error.message}`);
  }
} catch (error) {
  tableProbe = false;
  columnsProbe = 'ERRO';
  report.notes.push(`Falha ao consultar profiles: ${String(error && error.message ? error.message : error)}`);
}

try {
  const { data: enumData, error: enumError } = await client.from('pg_type').select('typname').eq('typname', 'user_role').limit(1);
  enumProbe = !enumError && Array.isArray(enumData) && enumData.length > 0;
  if (enumError) {
    report.notes.push(`Consulta do enum user_role falhou: ${enumError.message}`);
  }
} catch (error) {
  enumProbe = false;
  report.notes.push(`Falha ao consultar enum user_role: ${String(error && error.message ? error.message : error)}`);
}

try {
  const { data: metaData, error: metaError } = await client.from('pg_class').select('relname, relrowsecurity').eq('relname', 'profiles').limit(1);
  if (!metaError && Array.isArray(metaData)) {
    tableMeta = metaData[0] || null;
    report.readOnlyChecks.rlsEnabled = tableMeta && tableMeta.relrowsecurity ? 'ATIVADO' : 'DESATIVADO';
  } else {
    report.readOnlyChecks.rlsEnabled = 'DESCONHECIDO';
    report.notes.push(`Não foi possível confirmar RLS de profiles: ${metaError ? metaError.message : 'sem dados'}`);
  }
} catch (error) {
  report.readOnlyChecks.rlsEnabled = 'DESCONHECIDO';
  report.notes.push(`Falha ao consultar relrowsecurity: ${String(error && error.message ? error.message : error)}`);
}

report.readOnlyChecks.profilesTable = tableProbe ? 'PRESENTE' : 'AUSENTE';
report.readOnlyChecks.columns = columnsProbe;
report.readOnlyChecks.userRoleEnum = enumProbe ? 'PRESENTE' : 'AUSENTE';
report.readOnlyChecks.policies = 'NA';
report.readOnlyChecks.functions = 'NA';
report.readOnlyChecks.triggers = 'NA';
report.readOnlyChecks.foreignKey = 'NA';
report.readOnlyChecks.security = 'NA';
report.readOnlyChecks.consistency = 'NA';

if (!serviceRole) {
  report.notes.push('SUPABASE_SERVICE_ROLE_KEY ausente no ambiente local. A anon key não pode confirmar metadados protegidos. A validação estrutural real foi feita diretamente no SQL Editor do Supabase; "permission denied" não deve ser interpretado como tabela inexistente.');
}

console.log(JSON.stringify({
  ...report,
  redacted: {
    supabaseUrl: mask(url),
    anonKey: mask(anon),
    serviceRoleKey: mask(serviceRole),
  },
}, null, 2));
