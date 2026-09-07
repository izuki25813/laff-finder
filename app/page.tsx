"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function Home() {
  const [showGate, setShowGate] = useState(false);
  const [clicouNoBotao, setClicouNoBotao] = useState(false);

  useEffect(() => {
    const jaSeInscreveu = localStorage.getItem("laff-finder-inscrito");
    if (!jaSeInscreveu) {
      setShowGate(true);
    }
  }, []);

  const handleInscrever = () => {
    window.open("https://www.youtube.com/@izuki.x?sub_confirmation=1", "_blank");
    setClicouNoBotao(true);
  };

  const handleEntrar = () => {
    localStorage.setItem("laff-finder-inscrito", "true");
    setShowGate(false);
  };

  return (
    <main className="min-h-screen bg-black text-white">
      
      {/* ===== TELA DE INSCRIÇÃO (GATE) ===== */}
      {showGate && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center">
            <div className="mb-8">
              <div className="inline-block bg-yellow-400 text-black font-black text-2xl px-6 py-3 rounded-xl mb-4">
                IZUKI.X
              </div>
              <h2 className="text-3xl font-black mb-2">Bem-vindo ao LAFF FINDER</h2>
              <p className="text-zinc-400">
                Para acessar o banco de jogadores e montar seu time, 
                <br />
                <span className="text-yellow-400 font-bold">inscreva-se no canal!</span>
              </p>
            </div>

            <button
              onClick={handleInscrever}
              className="block w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-xl mb-4 transition text-lg"
            >
              🔔 INSCREVA-SE NO CANAL
            </button>

            {clicouNoBotao && (
              <button
                onClick={handleEntrar}
                className="block w-full bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-3 rounded-xl transition animate-pulse"
              >
                ✅ Já me inscrevi, entrar no site
              </button>
            )}

            {!clicouNoBotao && (
              <p className="text-zinc-600 text-xs mt-6">Clique no botão vermelho acima para continuar</p>
            )}
          </div>
        </div>
      )}

      {/* ===== CONTEÚDO PRINCIPAL (HOME) ===== */}
      {!showGate && (
        <div className="flex flex-col min-h-screen">
          <section className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-yellow-400">
              by izuki.x
            </p>

            <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6">
              LAFF FINDER
            </h1>

            <p className="max-w-2xl text-lg text-zinc-400 md:text-xl leading-relaxed mb-12">
              Encontre sua próxima line. Encontre jogadores. Monte seu time.
              <br className="hidden md:block" />
              Participe de Xtreinos. Acesso a Coach e Dicas pra evoluir.
            </p>

            {/* GRID COM 6 BOTÕES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-5xl">
              
              {/* 1. Procurar */}
              <Link href="/procurar" className="rounded-xl border border-zinc-700 bg-zinc-900 px-6 py-5 font-bold transition hover:bg-zinc-800 hover:border-yellow-400 flex flex-col items-center gap-2">
                <span className="text-3xl">🔎</span>
                <span>Procurar jogadores</span>
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-black">Banco de Dados</span>
              </Link>

              {/* 2. Cadastrar */}
              <Link href="/cadastro" className="rounded-xl bg-yellow-400 px-6 py-5 font-bold text-black transition hover:bg-yellow-300 flex flex-col items-center gap-2 shadow-lg shadow-yellow-400/10">
                <span className="text-3xl"></span>
                <span>Cadastrar jogador</span>
                <span className="text-[10px] uppercase tracking-wider text-yellow-700 font-black">Seu currículo de F/A</span>
              </Link>

              {/* 3. Dicas (YouTube) */}
              <a href="https://www.youtube.com/show/VLPLhdCSlmFZK7BwELAbSrwJf_DXKbKjxexs?sbp=QAE%253D" target="_blank" rel="noopener noreferrer" className="rounded-xl border border-red-900/50 bg-red-950/30 px-6 py-5 font-bold text-white transition hover:bg-red-900/50 hover:border-red-500 flex flex-col items-center gap-2">
                <span className="text-3xl">▶️</span>
                <span>Dicas de Free Fire</span>
                <span className="text-[10px] uppercase tracking-wider text-red-400 font-black">Vire Membro</span>
              </a>

              {/* 4. Mentoria */}
              <Link href="/mentoria" className="rounded-xl border border-yellow-600/50 bg-gradient-to-br from-yellow-900/20 to-black px-6 py-5 font-bold text-white transition hover:border-yellow-400 flex flex-col items-center gap-2">
                <span className="text-3xl"></span>
                <span>Mentoria ou Pro Level</span>
                <span className="text-[10px] uppercase tracking-wider text-yellow-400 font-black">Evolua no Free Fire</span>
              </Link>

              {/* 5. X TREINO ELITE */}
              <a href="https://chat.whatsapp.com/LVXStDbqrL13edfYEINmHg" target="_blank" rel="noopener noreferrer" className="rounded-xl border border-green-900/50 bg-green-950/30 px-6 py-5 font-bold text-white transition hover:bg-green-900/50 hover:border-green-500 flex flex-col items-center gap-2">
                <span className="text-3xl"></span>
                <span>X TREINO ELITE</span>
                <span className="text-[10px] uppercase tracking-wider text-green-400 font-black">Grátis • YouTube • Sala Aérea</span>
              </a>

              {/* 6. Campeonatos */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-6 py-5 font-bold text-zinc-500 flex flex-col items-center gap-2 cursor-not-allowed opacity-60">
                <span className="text-3xl"></span>
                <span>Campeonatos</span>
                <span className="text-[10px] uppercase tracking-wider text-zinc-600 font-black">Em Breve</span>
              </div>

            </div>
          </section>

          {/* ===== RODAPÉ COM APOIO ===== */}
          <footer className="border-t border-zinc-800 bg-zinc-950 py-8 px-6">
            <div className="max-w-4xl mx-auto text-center">
              <div className="mb-4">
                <span className="text-3xl mb-2 block">💛</span>
                <h3 className="text-xl font-black text-white mb-2">
                  Ajude o LAFF Finder a crescer!
                </h3>
                <p className="text-zinc-400 text-sm max-w-lg mx-auto mb-6">
                  Esse projeto é 100% gratuito e feito pela comunidade, para a comunidade. 
                  Sua doação ajuda a manter o site no ar, melhorar as funcionalidades e trazer ainda mais conteúdo pra galera do Free Fire!
                </p>
              </div>
              
              <a 
                href="https://apoia.se/finder" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-600 to-yellow-400 hover:from-yellow-500 hover:to-yellow-300 text-black font-black py-3 px-8 rounded-xl transition shadow-lg shadow-yellow-900/50"
              >
                <span className="text-xl">🚀</span>
                <span>Apoiar o Projeto</span>
              </a>
              
              <p className="text-zinc-600 text-xs mt-6">
                Qualquer valor ajuda! Obrigado por fazer parte dessa jornada. 🔥
              </p>
            </div>
          </footer>
        </div>
      )}

    </main>
  );
}