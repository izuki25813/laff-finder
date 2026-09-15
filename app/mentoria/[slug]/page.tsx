import Link from "next/link";
import { notFound } from "next/navigation";

import { getMentorshipProductBySlug } from "@/lib/mentorship";

export const metadata = {
  title: "Detalhes do produto | LAFF Finder",
  description: "Detalhes da mentoria e do diagnóstico do LAFF Finder.",
};

export default async function MentorshipProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getMentorshipProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const isDiagnostic = product.productType === "diagnostic";

  const fallbackHref = `/login?callbackUrl=/mentoria/${product.slug}`;
  const signupHref = `/cadastro?callbackUrl=/mentoria/${product.slug}`;

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-5xl px-6 py-8 md:px-10 md:py-10">
        <Link href="/mentoria" className="mb-8 inline-block font-bold text-yellow-400 hover:underline">
          ← Voltar para mentoria
        </Link>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 md:p-8">
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <span className="inline-flex rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-yellow-300">
              {isDiagnostic ? "Diagnóstico" : product.modality === "individual" ? "Mentoria individual" : "Mentoria coletiva"}
            </span>
            {product.featured && (
              <span className="inline-flex rounded-full bg-yellow-400 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-black">
                Destaque
              </span>
            )}
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
            <div>
              <h1 className="text-3xl font-black text-white md:text-5xl">{product.name}</h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-400 md:text-lg">
                {product.description}
              </p>

              <div className="mt-6 rounded-2xl border border-zinc-800 bg-black p-5">
                <p className="text-sm text-zinc-400">Para quem é indicado</p>
                <p className="mt-2 text-base font-medium text-zinc-200">{product.target}</p>
              </div>

              <ul className="mt-6 space-y-3 text-sm text-zinc-200 md:text-base">
                {product.features.map((feature) => (
                  <li key={feature} className="flex gap-3">
                    <span className="mt-1 text-yellow-400">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <aside className="rounded-2xl border border-yellow-500/30 bg-gradient-to-b from-yellow-500/5 to-zinc-950 p-6">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-yellow-300">Investimento</p>
              <div className="mt-4 text-4xl font-black text-white">
                {product.price !== null ? `R$ ${product.price}` : product.priceLabel}
              </div>
              {product.sessionsIncluded ? (
                <p className="mt-3 text-sm text-zinc-400">
                  {product.sessionsIncluded} sessões incluídas • {product.durationDays ?? 0} dias de acompanhamento
                </p>
              ) : (
                <p className="mt-3 text-sm text-zinc-400">Produto de entrada para diagnóstico inicial</p>
              )}

              <div className="mt-6 space-y-3">
                {isDiagnostic ? (
                  <>
                    <Link
                      href={fallbackHref}
                      className="block rounded-xl bg-yellow-400 px-4 py-3 text-center font-black text-black transition hover:bg-yellow-300"
                    >
                      Iniciar diagnóstico
                    </Link>
                    <p className="text-xs text-zinc-500">
                      Pagamento futuro será integrado nesta etapa após a estrutura comercial do produto.
                    </p>
                  </>
                ) : (
                  <>
                    <Link
                      href={fallbackHref}
                      className="block rounded-xl bg-yellow-400 px-4 py-3 text-center font-black text-black transition hover:bg-yellow-300"
                    >
                      Entrar para contratar
                    </Link>
                    <Link
                      href={signupHref}
                      className="block rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-center font-bold text-white transition hover:border-yellow-400 hover:text-yellow-300"
                    >
                      Criar conta
                    </Link>
                    <p className="text-xs text-zinc-500">
                      Fluxo de contratação preparado para pagamento e agenda futuras.
                    </p>
                  </>
                )}
              </div>
            </aside>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <h2 className="text-2xl font-black text-white">Diferença entre diagnóstico e mentoria</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-zinc-800 bg-black p-5">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-yellow-300">Diagnóstico</p>
              <p className="mt-3 text-zinc-300">
                Produto de entrada que revela erros principais, pontos fortes, estratégia e exercícios direcionados para a evolução inicial.
              </p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-black p-5">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-yellow-300">Mentoria</p>
              <p className="mt-3 text-zinc-300">
                Acompanhamento contínuo para construção do player, melhor desempenho e evolução em um plano mais completo e personalizado.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
