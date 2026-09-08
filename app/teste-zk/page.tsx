"use client";

import Link from "next/link";

export default function TesteZKPage() {
  return (
    <main className="min-h-screen bg-black text-white p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-yellow-400 hover:underline mb-8 inline-block font-bold">
          ← Voltar para o início
        </Link>

        {/* HERO CARD DOURADO */}
        <div className="rounded-2xl border-2 border-yellow-400 bg-gradient-to-br from-yellow-900/30 via-black to-black p-8 md:p-12 mb-8 shadow-2xl shadow-yellow-400/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-yellow-400 text-black text-xs font-black px-4 py-2 rounded-bl-xl uppercase tracking-wider">
            🏆 Exclusivo
          </div>
          
          <div className="flex items-center gap-4 mb-6">
            <span className="text-6xl">🏆</span>
            <h1 className="text-3xl md:text-5xl font-black text-yellow-400 leading-tight">
              FAZER TESTE PRA<br/>ZK ESPORTS - LAFF
            </h1>
          </div>
          
          <p className="text-zinc-200 text-base md:text-lg leading-relaxed mb-8">
            Agende um horário de teste para entrar em uma das <span className="text-white font-black">6 lines elites da ZK</span> (Apenas para os melhores). 
            <br/><br/>
            Receba e participe de treinos elites, campeonatos como <span className="text-yellow-400 font-bold">GWL, All Win, Liga do Rei</span>, 
            e ainda trabalhe e evolua com o acompanhamento do coach <span className="text-white font-bold">izuki.x</span> dentro do ambiente dos 60 ZKs!
          </p>
          
          {/* BOTÃO QUE LEVA PARA A LISTA DE ESPERA COM PAGAMENTO */}
          <Link 
            href="/lista-espera"
            className="block w-full bg-yellow-400 hover:bg-yellow-300 text-black font-black text-center py-5 rounded-xl transition text-xl shadow-lg hover:scale-[1.02] transform duration-200"
          >
            🎯 QUERO FAZER O TESTE AGORA
          </Link>
        </div>

        {/* BENEFÍCIOS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="text-3xl mb-2">⚔️</div>
            <h3 className="font-black text-white mb-2">Treinos Elites</h3>
            <p className="text-zinc-400 text-sm">Participe de treinos de alto nível com as 6 lines da ZK.</p>
          </div>
          
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="text-3xl mb-2"></div>
            <h3 className="font-black text-white mb-2">Campeonatos</h3>
            <p className="text-zinc-400 text-sm">Jogue GWL, All Win, Liga do Rei e outros torneios oficiais.</p>
          </div>
          
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="text-3xl mb-2">👑</div>
            <h3 className="font-black text-white mb-2">Coach Izuuki.x</h3>
            <p className="text-zinc-400 text-sm">Evolua com acompanhamento direto dentro do ambiente dos 60 ZKs.</p>
          </div>
        </div>

        <p className="text-center text-zinc-600 text-xs mt-12 pb-6">
          by Izuuki.x — LAFF Finder
        </p>
      </div>
    </main>
  );
}