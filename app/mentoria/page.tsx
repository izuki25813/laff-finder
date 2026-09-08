"use client";

import Link from "next/link";

export default function MentoriaPage() {
  // ⚠️ SUBSTITUA O LINK ABAIXO PELO SEU WHATSAPP OU LINK DE AGENDAMENTO (ex: Calendly)
  // Exemplo WhatsApp: "https://wa.me/5511999999999?text=Ola%20Izuki,%20quero%20agendar%20meu%20teste%20para%20a%20ZK%20Esports!"
  const LINK_TESTE_ZK = "https://wa.me/55SEUNUMEROAQUI?text=Ola%20Izuki,%20quero%20agendar%20meu%20teste%20para%20a%20ZK%20Esports!";

  return (
    <main className="min-h-screen bg-black text-white p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-yellow-400 hover:underline mb-8 inline-block font-bold">
          ← Voltar para o início
        </Link>

        <h1 className="text-4xl md:text-5xl font-black mb-2 text-white">👑 Mentoria e Pro Level</h1>
        <p className="text-zinc-400 mb-10 text-lg">
          Evolua sua gameplay, entenda o macro do jogo e alcance o nível profissional com o acompanhamento direto do Izuuki.x.
        </p>

        {/* 🏆 DESTAQUE: TESTE ZK ESPORTS */}
        <div className="rounded-2xl border-2 border-yellow-400 bg-gradient-to-br from-yellow-900/20 to-black p-6 md:p-8 mb-10 shadow-lg shadow-yellow-400/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-yellow-400 text-black text-xs font-black px-3 py-1 rounded-bl-xl">
            EXCLUSIVO
          </div>
          
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">🏆</span>
            <h2 className="text-2xl md:text-3xl font-black text-yellow-400">
              FAZER TESTE PRA ZK ESPORTS - LAFF
            </h2>
          </div>
          
          <p className="text-zinc-300 text-sm md:text-base leading-relaxed mb-6">
            Agende um horário de teste para entrar em uma das <span className="text-white font-bold">6 lines elites da ZK</span> (Apenas para os melhores). 
            Receba e participe de treinos elites, campeonatos como <span className="text-yellow-400 font-bold">GWL, All Win, Liga do Rei</span>, 
            e ainda trabalhe e evolua com o acompanhamento do coach <span className="text-white font-bold">izuki.x</span> dentro do ambiente dos 60 ZKs!
          </p>
          
          <a 
            href={LINK_TESTE_ZK}
            target="_blank" 
            rel="noopener noreferrer"
            className="block w-full bg-yellow-400 hover:bg-yellow-300 text-black font-black text-center py-4 rounded-xl transition text-lg shadow-lg hover:scale-[1.02] transform duration-200"
          >
            🎯 QUERO FAZER O TESTE AGORA
          </a>
        </div>

        {/* OUTRAS OPÇÕES DE MENTORIA (Mantendo o padrão profissional) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 hover:border-yellow-400/50 transition">
            <h3 className="text-xl font-black text-white mb-3">🎯 Mentoria Individual</h3>
            <p className="text-zinc-400 text-sm mb-4">
              Análise detalhada das suas VODs, correção de posicionamento, gestão de utilitários e desenvolvimento de game sense.
            </p>
            <a href={LINK_TESTE_ZK} className="text-yellow-400 font-bold text-sm hover:underline">
              Saiba mais →
            </a>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 hover:border-yellow-400/50 transition">
            <h3 className="text-xl font-black text-white mb-3">👥 Mentoria de Time (Line)</h3>
            <p className="text-zinc-400 text-sm mb-4">
              Treinamento tático para sua line completa. Rotas de entrada, call de granada, sinergia de equipe e preparação para campeonatos.
            </p>
            <a href={LINK_TESTE_ZK} className="text-yellow-400 font-bold text-sm hover:underline">
              Saiba mais →
            </a>
          </div>

        </div>

        <p className="text-center text-zinc-600 text-xs mt-12 pb-6">
          by Izuuki.x — LAFF Finder
        </p>
      </div>
    </main>
  );
}