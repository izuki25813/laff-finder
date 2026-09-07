"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbywdkprIPjco6PAB-m9Crnx-fLFxwzRSEoWt9ydPj5Z1qQJzYhIscz83ZXOiYFC4aD8gg/exec"; 

export default function CompletPage() {
  const [activeTab, setActiveTab] = useState<"disponivel" | "precisando">("disponivel");
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  const [form, setForm] = useState({
    nick: "", contato: "", hInicio: "", hFim: "", 
    qtd: "1", funcao: "", desc: "", pin: ""
  });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await fetch(`${SCRIPT_URL}?sheet=COMPLETS`);
      const data = await res.json();
      
      const cincoHorasEmMs = 5 * 60 * 60 * 1000;
      const agora = Date.now();
      
      const postsValidos = data.filter((post: any) => {
        const dataPost = new Date(post.Data).getTime();
        return (agora - dataPost) < cincoHorasEmMs;
      });

      setPosts(postsValidos.reverse());
    } catch (error) {
      console.error("Erro ao buscar posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg("");

    try {
      await fetch(SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({
          action: "create_complet",
          tipo: activeTab,
          nick: form.nick,
          hInicio: form.hInicio,
          hFim: form.hFim,
          qtd: form.qtd,
          funcao: form.funcao,
          desc: form.desc,
          contato: form.contato,
          pin: form.pin
        })
      });
      setMsg("✅ Postado com sucesso!");
      setForm({ nick: "", contato: "", hInicio: "", hFim: "", qtd: "1", funcao: "", desc: "", pin: "" });
      fetchPosts();
    } catch (error) {
      setMsg("❌ Erro ao postar.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (nick: string) => {
    const pinInput = prompt("Digite o PIN de 4 dígitos para apagar este post:");
    if (!pinInput) return;

    try {
      const res = await fetch(SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({ action: "delete_complet", nick: nick, pin: pinInput })
      });
      const result = await res.json();
      
      if (result.status === 'deleted') {
        alert("Post apagado com sucesso!");
        fetchPosts();
      } else {
        alert("PIN ou Nick incorretos. Tente novamente.");
      }
    } catch (error) {
      alert("Erro ao apagar.");
    }
  };

  const formatWhatsAppLink = (phone: string) => {
    // Se for Discord ou Instagram, não tenta formatar como link de WhatsApp
    if (phone.toLowerCase().includes('discord') || phone.toLowerCase().includes('instagram') || phone.includes('@')) {
      return "#"; 
    }
    const numbers = phone.replace(/\D/g, '');
    const fullNumber = numbers.startsWith('55') ? numbers : '55' + numbers;
    return `https://wa.me/${fullNumber}`;
  };

  return (
    <main className="min-h-screen bg-black text-white p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-yellow-400 hover:underline mb-8 inline-block font-bold">
          ← Voltar para o início
        </Link>

        <h1 className="text-4xl font-black mb-2 text-white">🤝 Complet e Divulgação</h1>
        <p className="text-zinc-400 mb-8">
          Encontre players para completar seu time ou ofereça sua vaga. 
          <br/>
          <span className="text-xs text-zinc-500">⚠️ Os posts somem automaticamente após 5 horas.</span>
        </p>

        {/* ABAS */}
        <div className="flex gap-2 mb-8 bg-zinc-900 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab("disponivel")}
            className={`flex-1 py-3 rounded-lg font-bold transition ${activeTab === "disponivel" ? "bg-green-600 text-white" : "text-zinc-400 hover:text-white"}`}
          >
            🟢 Disponível pra completar
          </button>
          <button 
            onClick={() => setActiveTab("precisando")}
            className={`flex-1 py-3 rounded-lg font-bold transition ${activeTab === "precisando" ? "bg-red-600 text-white" : "text-zinc-400 hover:text-white"}`}
          >
            🔴 Precisando de complet
          </button>
        </div>

        {/* FORMULÁRIO */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-10">
          <h2 className="text-xl font-black mb-4 text-yellow-400">
            {activeTab === "disponivel" ? "Oferecer minha vaga" : "Procurar jogadores"}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input 
                required 
                value={form.nick} 
                onChange={e => setForm({...form, nick: e.target.value})} 
                placeholder="Seu Nick *" 
                className="bg-black border border-zinc-700 rounded-lg p-3 text-white focus:border-yellow-400 outline-none" 
              />
              <input 
                required 
                value={form.contato} 
                onChange={e => setForm({...form, contato: e.target.value})} 
                placeholder="WhatsApp, Discord ou Instagram *" 
                className="bg-black border border-zinc-700 rounded-lg p-3 text-white focus:border-yellow-400 outline-none" 
              />
            </div>

            {activeTab === "disponivel" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select 
                  required 
                  value={form.funcao} 
                  onChange={e => setForm({...form, funcao: e.target.value})} 
                  className="bg-black border border-zinc-700 rounded-lg p-3 text-white focus:border-yellow-400 outline-none"
                >
                  <option value="">Sua Função Principal *</option>
                  <option>🟢 Rush 1</option>
                  <option>🟢 Rush 2</option>
                  <option>🔵 Granadeiro</option>
                  <option>🟡 Suporte</option>
                  <option>🟣 IGL (Capitão)</option>
                </select>
                <input 
                  required 
                  value={form.hInicio} 
                  onChange={e => setForm({...form, hInicio: e.target.value})} 
                  placeholder="Disponível a partir de (ex: 19:00) *" 
                  className="bg-black border border-zinc-700 rounded-lg p-3 text-white focus:border-yellow-400 outline-none" 
                />
                <input 
                  required 
                  value={form.hFim} 
                  onChange={e => setForm({...form, hFim: e.target.value})} 
                  placeholder="Até que horas? (ex: 23:00) *" 
                  className="bg-black border border-zinc-700 rounded-lg p-3 text-white focus:border-yellow-400 outline-none md:col-span-2" 
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <select 
                  required 
                  value={form.qtd} 
                  onChange={e => setForm({...form, qtd: e.target.value})} 
                  className="bg-black border border-zinc-700 rounded-lg p-3 text-white focus:border-yellow-400 outline-none"
                >
                  <option value="1">Preciso de 1 player</option>
                  <option value="2">Preciso de 2 players</option>
                  <option value="3">Preciso de 3 players</option>
                  <option value="4">Preciso de 4 players</option>
                </select>
                <input 
                  required 
                  value={form.funcao} 
                  onChange={e => setForm({...form, funcao: e.target.value})} 
                  placeholder="Função necessária (ex: Rush)" 
                  className="bg-black border border-zinc-700 rounded-lg p-3 text-white focus:border-yellow-400 outline-none" 
                />
                <input 
                  required 
                  value={form.hInicio} 
                  onChange={e => setForm({...form, hInicio: e.target.value})} 
                  placeholder="Horário do jogo (ex: 20:00)" 
                  className="bg-black border border-zinc-700 rounded-lg p-3 text-white focus:border-yellow-400 outline-none" 
                />
              </div>
            )}

            {activeTab === "precisando" && (
              <textarea 
                required 
                value={form.desc} 
                onChange={e => setForm({...form, desc: e.target.value})} 
                placeholder="Descrição (ex: Campeonato LAFF, premiação R$500, foco em ganhar)" 
                rows={3} 
                className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white focus:border-yellow-400 outline-none resize-none" 
              />
            )}

            <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4">
              <p className="text-xs text-yellow-400 mb-2 font-bold">🔒 Crie um PIN de 4 números para poder apagar seu post depois:</p>
              <input 
                required 
                value={form.pin} 
                onChange={e => setForm({...form, pin: e.target.value})} 
                maxLength={4} 
                placeholder="Ex: 1234" 
                className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white focus:border-yellow-400 outline-none tracking-widest text-center text-xl font-black" 
              />
            </div>

            <button disabled={submitting} className="w-full bg-yellow-400 text-black font-black py-4 rounded-xl hover:bg-yellow-300 transition disabled:bg-zinc-700 disabled:text-zinc-500">
              {submitting ? "Publicando..." : "🚀 Publicar Anúncio"}
            </button>
            {msg && <p className="text-center font-bold text-green-400">{msg}</p>}
          </form>
        </div>

        {/* FEED DE POSTS */}
        <h2 className="text-2xl font-black mb-4 text-white">📢 Anúncios Ativos</h2>
        
        {loading ? (
          <p className="text-zinc-500 text-center py-10 animate-pulse">Carregando anúncios...</p>
        ) : posts.length === 0 ? (
          <p className="text-zinc-500 text-center py-10">Nenhum anúncio ativo no momento. Seja o primeiro!</p>
        ) : (
          <div className="space-y-4">
            {posts.map((post, index) => (
              <div key={index} className={`rounded-xl border p-5 flex flex-col md:flex-row justify-between gap-4 ${post.Tipo === 'disponivel' ? 'bg-green-950/20 border-green-900/50' : 'bg-red-950/20 border-red-900/50'}`}>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-black px-2 py-1 rounded ${post.Tipo === 'disponivel' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                      {post.Tipo === 'disponivel' ? '🟢 DISPONÍVEL' : '🔴 PRECISANDO'}
                    </span>
                    <h3 className="text-xl font-black text-white">{post.Nick}</h3>
                    {post.FuncaoPrecisa && <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded font-bold">{post.FuncaoPrecisa}</span>}
                  </div>
                  
                  {post.Tipo === 'disponivel' ? (
                    <p className="text-zinc-300 text-sm">⏰ Disponível de <span className="text-white font-bold">{post.HorarioInicio}</span> até <span className="text-white font-bold">{post.HorarioFim}</span></p>
                  ) : (
                    <div className="text-zinc-300 text-sm space-y-1">
                      <p>👥 Precisa de: <span className="text-white font-bold">{post.QtdPlayers} player(s)</span></p>
                      <p>⏰ Horário: <span className="text-white font-bold">{post.HorarioInicio}</span></p>
                      {post.Descricao && <p className="italic text-zinc-400 mt-2">"{post.Descricao}"</p>}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 min-w-[150px]">
                  {post.Contato && !post.Contato.includes('#') ? (
                    <a href={formatWhatsAppLink(post.Contato)} target="_blank" className="block w-full bg-green-600 hover:bg-green-500 text-white text-center font-bold py-2 rounded-lg text-sm transition">
                      💬 Chamar no Zap
                    </a>
                  ) : (
                    <div className="block w-full bg-zinc-700 text-zinc-300 text-center font-bold py-2 rounded-lg text-sm cursor-default">
                      📋 Contato: {post.Contato}
                    </div>
                  )}
                  <button onClick={() => handleDelete(post.Nick)} className="w-full bg-zinc-800 hover:bg-red-600 text-zinc-400 hover:text-white text-center font-bold py-2 rounded-lg text-xs transition">
                    🗑️ Apagar meu post
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}