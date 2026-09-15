import Link from "next/link";

import { MENTORSHIP_PRODUCTS } from "@/lib/mentorship";

const productGroups = [
  {
    label: "Diagnóstico",
    description: "Produto de entrada para entender o que está travando sua evolução.",
  },
  {
    label: "Mentoria individual",
    description: "Acompanhamento personalizado para o desenvolvimento do jogador.",
  },
  {
    label: "Mentoria coletiva",
    description: "Estrutura para squads que querem evoluir como time.",
  },
];

export const metadata = {
  title: "Mentoria | LAFF Finder",
  description: "Diagnóstico e planos de mentoria para evolução competitiva no Free Fire.",
};

export default function MentoriaPage() {
  const diagnostic = MENTORSHIP_PRODUCTS.find((product) => product.productType === "diagnostic");
  const individualPlans = MENTORSHIP_PRODUCTS.filter(
    (product) => product.productType === "mentoring" && product.modality === "individual",
  );
  const collectivePlans = MENTORSHIP_PRODUCTS.filter(
    (product) => product.productType === "mentoring" && product.modality === "collective",
  );

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-6 py-8 md:px-10 md:py-10">
        <Link href="/" className="mb-8 inline-block font-bold text-yellow-400 hover:underline">
          ← Voltar para o início
        </Link>

        <header className="mb-12 rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-950 via-zinc-900 to-black p-8 shadow-2xl shadow-yellow-500/5 md:p-10">
          <div className="mb-4 inline-flex items-center rounded-full border border-yellow-500/40 bg-yellow-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.25em] text-yellow-300">
            mentoria LAFF finder
          </div>
          <h1 className="max-w-3xl text-4xl font-black tracking-tight text-white md:text-6xl">
            Construção do player para chegar ao nível competitivo.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-zinc-400">
            A mentoria da LAFF Finder é pensada para quem quer evoluir com clareza, consistência e foco em desempenho real no Free Fire.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/mentoria/diagnostico"
              className="inline-flex items-center justify-center rounded-xl bg-yellow-400 px-6 py-3 font-black text-black transition hover:bg-yellow-300"
            >
              Ver diagnóstico
            </Link>
            <Link
              href="/login?next=/mentoria"
              className="inline-flex items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 px-6 py-3 font-bold text-white transition hover:border-yellow-400 hover:text-yellow-300"
            >
              Entrar para contratar
            </Link>
          </div>
        </header>

        <section className="mb-14 grid gap-4 md:grid-cols-3">
          {productGroups.map((group) => (
            <div key={group.label} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-yellow-400">{group.label}</p>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">{group.description}</p>
            </div>
          ))}
        </section>

        {diagnostic && (
          <section className="mb-14 rounded-3xl border border-yellow-500/30 bg-gradient-to-b from-yellow-500/10 to-zinc-950 p-6 md:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-yellow-300">Produto de entrada</p>
                <h2 className="mt-3 text-3xl font-black text-white">{diagnostic.name}</h2>
              </div>
              <div className="text-left md:text-right">
                <p className="text-3xl font-black text-yellow-300">{diagnostic.priceLabel}</p>
                <p className="text-sm text-zinc-400">Pagamento futuro a ser integrado</p>
              </div>
            </div>

            <p className="mt-4 max-w-3xl text-zinc-300">{diagnostic.description}</p>

            <ul className="mt-6 grid gap-3 md:grid-cols-2">
              {diagnostic.features.map((feature) => (
                <li key={feature} className="flex gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-sm text-zinc-200">
                  <span className="text-yellow-400">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/mentoria/diagnostico"
                className="inline-flex items-center justify-center rounded-xl bg-yellow-400 px-5 py-3 font-black text-black transition hover:bg-yellow-300"
              >
                Solicitar diagnóstico
              </Link>
              <Link
                href="/login?next=/mentoria/diagnostico"
                className="inline-flex items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 px-5 py-3 font-bold text-white transition hover:border-yellow-400 hover:text-yellow-300"
              >
                Entrar para continuar
              </Link>
            </div>
          </section>
        )}

        <section className="mb-14">
          <div className="mb-6 text-center">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-yellow-400">Mentoria individual</p>
            <h2 className="mt-3 text-3xl font-black text-white">3 níveis para evolução</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {individualPlans.map((plan) => (
              <article key={plan.id} className="flex flex-col rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-yellow-300">Nível {plan.tier}</p>
                <h3 className="mt-3 text-2xl font-black text-white">{plan.name.replace(" — Nível ", " — ")}</h3>
                <p className="mt-3 text-sm text-zinc-400">{plan.shortDescription}</p>
                <p className="mt-5 text-3xl font-black text-yellow-300">{plan.priceLabel}</p>

                <ul className="mt-5 space-y-3 text-sm text-zinc-200">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <span className="text-yellow-400">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={`/mentoria/${plan.slug}`}
                  className="mt-6 inline-flex items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 font-bold text-white transition hover:border-yellow-400 hover:text-yellow-300"
                >
                  Ver detalhes
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="mb-14">
          <div className="mb-6 text-center">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-yellow-400">Mentoria coletiva</p>
            <h2 className="mt-3 text-3xl font-black text-white">Estrutura para squad</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {collectivePlans.map((plan) => (
              <article key={plan.id} className="flex flex-col rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-yellow-300">Nível {plan.tier}</p>
                <h3 className="mt-3 text-2xl font-black text-white">{plan.name.replace(" — Nível ", " — ")}</h3>
                <p className="mt-3 text-sm text-zinc-400">{plan.shortDescription}</p>
                <p className="mt-5 text-3xl font-black text-yellow-300">{plan.priceLabel}</p>

                <ul className="mt-5 space-y-3 text-sm text-zinc-200">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <span className="text-yellow-400">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={`/mentoria/${plan.slug}`}
                  className="mt-6 inline-flex items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 font-bold text-white transition hover:border-yellow-400 hover:text-yellow-300"
                >
                  Ver detalhes
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-8">
          <h2 className="text-3xl font-black text-white">Diferenciação de produto</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-zinc-800 bg-black p-5">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-yellow-300">Diagnóstico</p>
              <p className="mt-3 text-zinc-300">
                Análise inicial com pontos fortes, erros principais, tomada de decisão, posicionamento e exercícios personalizados.
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-black p-5">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-yellow-300">Mentoria</p>
              <p className="mt-3 text-zinc-300">
                Acompanhamento de evolução para construção do player e melhora real do nível competitivo, com foco em consistência e desempenho.
              </p>
            </div>
          </div>
        </section>

        <p className="pb-4 pt-12 text-center text-xs text-zinc-600">by Izuuki.x — Transformando jogadores em profissionais.</p>
      </div>
    </main>
  );
}
