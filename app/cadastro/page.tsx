"use client";

import Link from "next/link";
import { useState } from "react";

export default function CadastroPage() {
  const [status, setStatus] = useState("idle");
  
  // ✅ LINK DO GRUPO DA TROPA DO ZK ATUALIZADO
  const LINK_GRUPO_ZK = "https://chat.whatsapp.com/HwVlP9Ju0JKLLFRdKA10BG"; 
  
  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyz-rSJihhg5mQ7gYyAfCNFEkCb5QYyOZFD__Hw0bj0FBWofka5OyOJkh85GvCFyFFhiQ/exec";

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setStatus("submitting");

    const form = e.target;
    const formData = new FormData(form);
    const data: any = Object.fromEntries(formData);

    data.Data = new Date().toLocaleString("pt-BR");
    data.PerfilCompleto = (data.Bio && data.Gameplay) ? "Sim ⭐" : "Não";

    try {
      await fetch(SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify(data),
      });
      setStatus("success");
    } catch (error) {
      console.error("Erro:", error);
      setStatus("error");
    }
  };

  // ===== TELA DE SUCESSO COM CHAMADA PARA O GRUPO =====
  if (status === "success") {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="text-center max-w-md w-full">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-3xl font-black text-yellow-400 mb-4">Cadastro Realizado!</h2>
          <p className="text-zinc-400 mb-8">
            Seus dados foram enviados com sucesso para o banco do Izuuki.x.
            <br /><br />
            Agora, não fique de fora! Entre para a comunidade e fique por dentro dos treinos e novidades da LAFF enquanto aguarda!
          </p>

          {/* BOTÃO DO WHATSAPP */}
          <a
            href={LINK_GRUPO_ZK}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-green-600 hover:bg-green-500 text-white font-black py-4 rounded-xl mb-4 transition text-lg flex items-center justify-center gap-2 shadow-lg shadow-green-900/50"
          >
            <span className="text-2xl">💬</span> Entrar na Tropa do ZK
          </a>

          <Link 
            href="/" 
            className="block w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold py-3 rounded-xl transition text-sm"
          >
            Voltar ao início
          </Link>
          
          <p className="text-zinc-600 text-xs mt-8">by Izuuki.x — LAFF Finder</p>
        </div>
      </main>
    );
  }

  // ===== TELA DE ERRO =====
  if (status === "error") {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-3xl font-black text-red-500 mb-4">Ops! Algo deu errado.</h2>
          <button onClick={() => setStatus("idle")} className="bg-zinc-700 text-white font-bold py-3 px-8 rounded-xl hover:bg-zinc-600 transition">
            Tentar novamente
          </button>
        </div>
      </main>
    );
  }

  // ===== FORMULÁRIO PRINCIPAL =====
  return (
    <main className="min-h-screen bg-black text-white p-6 md:p-10">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-yellow-400 hover:underline mb-8 inline-block font-bold">← Voltar para o início</Link>
        <h1 className="text-4xl font-black mb-1 text-white">Cadastrar Jogador</h1>
        <form onSubmit={handleSubmit} className="space-y-10 mt-8">
          
          <section>
            <h2 className="text-lg font-bold text-yellow-400 mb-4">📋 Dados Básicos</h2>
            <div className="space-y-4">
              <input name="Nick" required placeholder="Nick no Free Fire *" className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-yellow-400 transition" />
              <input name="ID" required placeholder="ID do Free Fire *" className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-yellow-400 transition" />
              <input name="Contato" required placeholder="Discord ou WhatsApp *" className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-yellow-400 transition" />
            </div>
          </section>
          
          <section>
            <h2 className="text-lg font-bold text-yellow-400 mb-4">🎮 Sobre o Jogador</h2>
            <div className="space-y-4">
              <select name="FuncaoPrincipal" required className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-yellow-400 transition">
                <option value="">Função Principal *</option>
                <option>🟢 Rush 1</option>
                <option>🟢 Rush 2</option>
                <option>🔵 Granadeiro</option>
                <option>🟡 Suporte</option>
                <option>🟣 IGL (Capitão)</option>
              </select>
              <select name="FuncaoSecundaria" className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-yellow-400 transition">
                <option value="">Função Secundária</option>
                <option>🟢 Rush 1</option>
                <option>🟢 Rush 2</option>
                <option>🔵 Granadeiro</option>
                <option>🟡 Suporte</option>
                <option>🟣 IGL (Capitão)</option>
              </select>
              <select name="Nivel" className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-yellow-400 transition">
                <option value="">Nível</option>
                <option>🟤 Iniciante</option>
                <option>🟠 Intermediário</option>
                <option>🔵 Avançado</option>
                <option>🟣 Profissional</option>
              </select>
              <input name="Idade" type="number" placeholder="Idade" className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-yellow-400 transition" />
              <input name="Gameplay" type="url" placeholder="Link de Gameplay (Opcional)" className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-yellow-400 transition" />
              <textarea name="Bio" placeholder="Bio curta (Opcional)" className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-yellow-400 transition resize-none" rows={3} />
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-yellow-400 mb-4">⏰ Disponibilidade</h2>
            <div className="space-y-4">
              <select name="Plataforma" required className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-yellow-400 transition">
                <option value="">Plataforma *</option>
                <option>📱 Mobile</option>
                <option>🖥️ Emulador</option>
                <option>🎮 Mobilador</option>
              </select>
              <input name="Horario" required placeholder="Horários disponíveis *" className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-yellow-400 transition" />
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-yellow-400 mb-4">🎯 O que você procura?</h2>
            <div className="space-y-4">
              <select name="TemTime" required className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-yellow-400 transition">
                <option value="">Tem time atual? *</option>
                <option>Sim</option>
                <option>Não</option>
              </select>
              <select name="Procura" required className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-yellow-400 transition">
                <option value="">Está procurando *</option>
                <option>🏆 Time completo</option>
                <option>👤 1 jogador específico</option>
                <option>👥 2 jogadores</option>
                <option>🧩 Jogadores para completar meu time</option>
              </select>
              <select name="QtdJogadores" className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-yellow-400 transition">
                <option value="">Quantos jogadores precisa?</option>
                <option>1</option>
                <option>2</option>
                <option>3</option>
                <option>4</option>
                <option>5 (time completo)</option>
              </select>
            </div>
          </section>

          <button type="submit" disabled={status === "submitting"} className="w-full bg-yellow-400 text-black font-bold py-4 rounded-xl hover:bg-yellow-300 transition text-lg disabled:bg-zinc-700 disabled:text-zinc-400 disabled:cursor-not-allowed">
            {status === "submitting" ? "Enviando dados..." : "🚀 Salvar Cadastro"}
          </button>
        </form>
        <p className="text-center text-zinc-600 text-xs mt-8 pb-6">by Izuuki.x — LAFF Finder</p>
      </div>
    </main>
  );
}