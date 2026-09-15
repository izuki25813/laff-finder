import Link from "next/link";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const PAGE_SIZE = 20;

function escapeLikeValue(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

function readParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function buildQueryString(current: Record<string, string>, overrides: Record<string, string | null>) {
  const params = new URLSearchParams();

  Object.entries(current).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  Object.entries(overrides).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
  });

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}

export const metadata = {
  title: "Vagas",
  description: "Explore vagas abertas de times no LAFF Finder.",
};

export default async function VagasPublicPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const q = readParam(params.q).trim();
  const role = readParam(params.role);
  const secondaryRole = readParam(params.secondary_role);
  const experience = readParam(params.experience);
  const objective = readParam(params.objective);
  const region = readParam(params.region);
  const state = readParam(params.state);
  const city = readParam(params.city);
  const availability = readParam(params.availability);
  const page = Math.max(1, Number(readParam(params.page) || "1") || 1);

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return (
      <main className="min-h-screen bg-black px-4 py-10 text-white md:px-6">
        <div className="mx-auto max-w-4xl rounded-2xl border border-zinc-800 bg-zinc-950 p-8 text-center text-zinc-300">
          Configuração do Supabase não encontrada.
        </div>
      </main>
    );
  }

  let query = supabase
    .from("team_vacancies")
    .select("*, team:teams(name, tag, logo_url)", { count: "exact" })
    .eq("status", "open")
    .order("created_at", { ascending: false });

  if (q) {
    const safeQ = escapeLikeValue(q);
    query = query.or(`title.ilike.%${safeQ}%,description.ilike.%${safeQ}%,role.ilike.%${safeQ}%,requirements.ilike.%${safeQ}%,city.ilike.%${safeQ}%,state.ilike.%${safeQ}%`);
  }

  if (role) {
    query = query.eq("role", role);
  }

  if (secondaryRole) {
    query = query.eq("secondary_role", secondaryRole);
  }

  if (experience) {
    query = query.eq("experience_level", experience);
  }

  if (objective) {
    query = query.eq("competitive_objective", objective);
  }

  if (region) {
    query = query.eq("region", region);
  }

  if (state) {
    query = query.eq("state", state);
  }

  if (city) {
    query = query.ilike("city", `%${city}%`);
  }

  if (availability) {
    query = query.ilike("availability", `%${availability}%`);
  }

  const start = (page - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE - 1;

  const { data: vacancies, count, error } = await query.range(start, end);
  const totalCount = count ?? vacancies?.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const currentParams: Record<string, string> = {
    q,
    role,
    secondary_role: secondaryRole,
    experience,
    objective,
    region,
    state,
    city,
    availability,
  };

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-yellow-400">LAFF Finder</p>
            <h1 className="mt-2 text-3xl font-black">Vagas abertas</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/" className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-bold text-white transition hover:border-yellow-500 hover:text-yellow-400">
              Home
            </Link>
            <Link href="/jogadores" className="rounded-xl bg-yellow-400 px-4 py-2 text-sm font-black text-black transition hover:bg-yellow-300">
              Ver jogadores
            </Link>
          </div>
        </div>

        <form method="get" className="mb-8 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 md:p-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="block space-y-2 text-sm text-zinc-300 md:col-span-2 xl:col-span-1">
              <span className="font-medium">Busca</span>
              <input
                defaultValue={q}
                name="q"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none transition focus:border-yellow-400"
                placeholder="Título, descrição, cidade, função"
              />
            </label>

            <label className="block space-y-2 text-sm text-zinc-300">
              <span className="font-medium">Função</span>
              <select defaultValue={role} name="role" className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none transition focus:border-yellow-400">
                <option value="">Todas</option>
                <option value="Rusher">Rusher</option>
                <option value="Suporte">Suporte</option>
                <option value="IGL">IGL</option>
                <option value="Granadeiro">Granadeiro</option>
                <option value="Flex">Flex</option>
              </select>
            </label>

            <label className="block space-y-2 text-sm text-zinc-300">
              <span className="font-medium">Função secundária</span>
              <select defaultValue={secondaryRole} name="secondary_role" className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none transition focus:border-yellow-400">
                <option value="">Todas</option>
                <option value="Rusher">Rusher</option>
                <option value="Suporte">Suporte</option>
                <option value="IGL">IGL</option>
                <option value="Granadeiro">Granadeiro</option>
                <option value="Flex">Flex</option>
              </select>
            </label>

            <label className="block space-y-2 text-sm text-zinc-300">
              <span className="font-medium">Experiência</span>
              <select defaultValue={experience} name="experience" className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none transition focus:border-yellow-400">
                <option value="">Todas</option>
                <option value="Iniciante">Iniciante</option>
                <option value="Intermediário">Intermediário</option>
                <option value="Avançado">Avançado</option>
                <option value="Competitivo">Competitivo</option>
              </select>
            </label>

            <label className="block space-y-2 text-sm text-zinc-300">
              <span className="font-medium">Objetivo</span>
              <select defaultValue={objective} name="objective" className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none transition focus:border-yellow-400">
                <option value="">Todos</option>
                <option value="Encontrar time">Encontrar time</option>
                <option value="Jogar campeonatos">Jogar campeonatos</option>
                <option value="Virar profissional">Virar profissional</option>
                <option value="Evoluir competitivamente">Evoluir competitivamente</option>
                <option value="Jogar por diversão">Jogar por diversão</option>
              </select>
            </label>

            <label className="block space-y-2 text-sm text-zinc-300">
              <span className="font-medium">Região</span>
              <input defaultValue={region} name="region" className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none transition focus:border-yellow-400" placeholder="Brasil" />
            </label>

            <label className="block space-y-2 text-sm text-zinc-300">
              <span className="font-medium">Estado</span>
              <input defaultValue={state} name="state" className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none transition focus:border-yellow-400" placeholder="SP" />
            </label>

            <label className="block space-y-2 text-sm text-zinc-300">
              <span className="font-medium">Cidade</span>
              <input defaultValue={city} name="city" className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none transition focus:border-yellow-400" placeholder="São Paulo" />
            </label>

            <label className="block space-y-2 text-sm text-zinc-300">
              <span className="font-medium">Disponibilidade</span>
              <input defaultValue={availability} name="availability" className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none transition focus:border-yellow-400" placeholder="Noites" />
            </label>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button type="submit" className="rounded-xl bg-yellow-400 px-5 py-3 text-sm font-black text-black transition hover:bg-yellow-300">
              Filtrar
            </button>
            <Link href="/vagas" className="rounded-xl border border-zinc-700 bg-zinc-900 px-5 py-3 text-sm font-bold text-white transition hover:border-yellow-500 hover:text-yellow-400">
              Limpar filtros
            </Link>
          </div>
        </form>

        {error ? (
          <div className="mb-6 rounded-xl border border-red-500/50 bg-red-950/30 px-4 py-3 text-sm text-red-200">
            Não foi possível carregar as vagas no momento.
          </div>
        ) : null}

        <div className="mb-5 flex items-center justify-between gap-3 text-sm text-zinc-400">
          <p>{totalCount} resultado{totalCount === 1 ? "" : "s"}</p>
          <p>Página {page} de {totalPages}</p>
        </div>

        {vacancies && vacancies.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {vacancies.map((vacancy) => (
              <article key={vacancy.id} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-black text-white">{vacancy.title}</p>
                    <p className="text-sm text-zinc-400">{vacancy.team?.name ?? "Time"}</p>
                  </div>
                  <span className="rounded-full border border-yellow-500/60 bg-yellow-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-yellow-300">
                    {vacancy.status}
                  </span>
                </div>

                <dl className="space-y-2 text-sm text-zinc-300">
                  <div className="flex justify-between gap-4"><dt className="text-zinc-500">Função</dt><dd>{vacancy.role}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-zinc-500">Nível</dt><dd>{vacancy.experience_level || "—"}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-zinc-500">Objetivo</dt><dd>{vacancy.competitive_objective || "—"}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-zinc-500">Local</dt><dd>{vacancy.city || vacancy.state || vacancy.region || "—"}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-zinc-500">Disponibilidade</dt><dd>{vacancy.availability || "—"}</dd></div>
                </dl>

                <p className="mt-4 text-sm leading-6 text-zinc-300">{vacancy.description || "Descrição não informada."}</p>

                <div className="mt-5 flex items-center justify-between gap-3">
                  <Link href={`/vaga/${vacancy.id}`} className="inline-flex rounded-xl bg-yellow-400 px-4 py-2 text-sm font-black text-black">
                    Ver vaga
                  </Link>
                  <span className="text-xs text-zinc-400">Aberta</span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-8 text-center text-zinc-300">
            Nenhuma vaga encontrada com os filtros atuais.
          </div>
        )}

        {totalPages > 1 ? (
          <div className="mt-8 flex items-center justify-center gap-3">
            {page > 1 ? (
              <Link href={`${buildQueryString(currentParams, { page: String(page - 1) })}`} className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-bold text-white">
                Anterior
              </Link>
            ) : null}
            {page < totalPages ? (
              <Link href={`${buildQueryString(currentParams, { page: String(page + 1) })}`} className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-bold text-white">
                Próxima
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    </main>
  );
}
