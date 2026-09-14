"use client";

import Link from "next/link";

export default function OportunidadesPage() {
  const oportunidades = [
    {
      id: 1,
      nome: "ZK Esports",
      descricao: "Entre para uma das 6 lines elites da ZK. Treinos, campeonatos (GWL, All Win, Liga do Rei) e acompanhamento do coach Izuuki.x.",
      status: "disponivel",
      link: "/lista-espera",
      icone: "🏆",
      cor: "border-yellow-400 bg-gradient-to-br from-yellow-900/30 to-black hover:shadow-yellow-400/20",
      badge: "ABERTO",
      badgeCor: "bg-yellow-400 text-black"
    },
    {
      id: 2,
      nome: "Outras Organizações",
      descricao: "Testes e oportunidades em outras orgs parceiras da LAFF. Fique de olho nas novidades.",
      status: "em-breve",
      link: null,
      icone: "🤝",
      cor: "border-zinc-700 bg-zinc-900/50 opacity-60 cursor-not-allowed",
      badge: "EM BREVE",
      badgeCor: "bg-zinc-700 text-zinc-400"
    },
    {
      id: 3,
      nome: "Peneiras",
      descricao: "Peneiras abertas para todos os níveis. Mostre seu talento e seja notado por scouts e capitães.",
      status: "em-breve",
      link: null,
      icone: "🎯",
      cor: "border-zinc-700 bg-zinc-900/50 opacity-60 cursor-not-allowed",
      badge: "EM BREVE",
      badgeCor: "bg-zinc-700 text-zinc-400"
    },
    {
      id: 4,
      nome: "Testes",
      descricao: "Banco de testes abertos de diversas teams. Encontre o time ideal para o seu nível e função.",
      status: "em-breve",
      link: null,
      icone: "⚔️",
      cor: "border-zinc-700 bg-zinc-900/50 opacity-60 cursor-not-allowed",
      badge: "EM BREVE",
      badgeCor: "bg-zinc-700 text-zinc-400"
    },
    {
      id: 5,
      nome: "Campeonatos",
      descricao: "Inscrições abertas para campeonatos oficiais e comunitários. Premiações e visibilidade para sua line.",
      status: "em-breve",
      link: null,
      icone: "🏅",
      cor: "border-zinc-700 bg-zinc-900/50 opacity-60 cursor-not-allowed",
      badge: "EM BREVE",
      badgeCor: "bg-zinc-700 text-zinc-400"
    }
  ];

  return (
    <main className="min-h-screen bg-black text-white p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-yellow-400 hover:underline mb-8 inline-block font-bold">
          ← Voltar para o início
        </Link>

        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-black mb-2 text-white">🎯 Oportunidades</h1>
          <p className="text-zinc-400 text-lg">
            O hub definitivo para jogadores que querem evoluir. Testes, peneiras, campeonatos e vagas em orgs.
          </p>
        </div>

        <div className="space-y-4">
          {oportunidades.map((op) => (
            op.status === "disponivel" ? (
              <Link
                key={op.id}
                href={op.link!}
                className={`block rounded-2xl border-2 p-6 md:p-8 transition-all duration-200 hover:scale-[1.01] ${op.cor}`}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-4 flex-1 min-w-[200px]">
                    <span className="text-5xl">{op.icone}</span>
                    <div>
                      <h2 className="text-2xl md:text-3xl font-black text-white mb-1">{op.nome}</h2>
                      <p className="text-zinc-300 text-sm md:text-base leading-relaxed">{op.descricao}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider ${op.badgeCor}`}>
                    {op.badge}
                  </span>
                </div>
              </Link>
            ) : (
              <div
                key={op.id}
                className={`block rounded-2xl border-2 p-6 md:p-8 ${op.cor}`}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-4 flex-1 min-w-[200px]">
                    <span className="text-5xl grayscale">{op.icone}</span>
                    <div>
                      <h2 className="text-2xl md:text-3xl font-black text-white mb-1">{op.nome}</h2>
                      <p className="text-zinc-400 text-sm md:text-base leading-relaxed">{op.descricao}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider ${op.badgeCor}`}>
                    {op.badge}
                  </span>
                </div>
              </div>
            )
          ))}
        </div>

        <p className="text-center text-zinc-600 text-xs mt-12 pb-6">
          by Izuuki.x — LAFF Finder
        </p>
      </div>
    </main>
  );
}