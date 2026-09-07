"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

// ⚠️ COLE AQUI A NOVA URL DO SEU APPS SCRIPT
const SCRIPT_URL = "COLE_A_NOVA_URL_AQUI"; 

export default function FeedbackPage() {
  const [tipo, setTipo] = useState("Sugestão");
  const [form, setForm] = useState({ nick: "", instagram: "", msg: "" });
  const [status, setStatus] = useState("idle");
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(true);

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      const res = await fetch(`${SCRIPT_URL}?sheet=FEEDBACKS`);
      const data = await res.json();
      setFeedbacks(data.reverse()); // Mais recentes primeiro
    } catch (error) {
      console.error("Erro ao buscar feedbacks:", error);
    } finally {
      setLoadingFeed(false);
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setStatus("sending");

    try {
      await fetch(SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({
          action: "send_feedback",
          nick: form.nick,
          instagram: form.instagram,
          tipo: tipo,
          msg: form.msg
        })
      });
      setStatus("success");
      setForm({ nick: "", instagram: "", msg: "" });
      fetchFeedbacks();
    } catch (error) {
      setStatus("error");
    }
  };

  const handleVote = async (index: number, tipoVoto: 'like' | 'deslike') => {
    try {
      const res = await fetch(SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({ action: "vote_feedback", index: index, tipo: tipoVoto })
      });
      const result = await res.json();
      if (result.status === 'success') {
        fetchFeedbacks(); // Recarrega para mostrar novo contador
      }
    } catch (error) {
      console.error("Erro ao votar:", error);
    }
  };

  const handleDelete = async (index: number) => {
    const senha = prompt("🔒 Digite a senha de administrador para apagar:");
    if (!senha) return;

    try {
      const res = await fetch(SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({ action: "delete_feedback", index: index, senha: senha })
      });
      const result = await res.json();
      if (result.status === 'deleted') {
        alert("✅ Feedback apagado com sucesso!");
        fetchFeedbacks();
      } else {
        alert("❌ Senha incorreta! Apenas o administrador pode apagar.");
      }
    } catch (error) {
      alert("Erro ao apagar.");
    }
  };

  if (status === "success") {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="text-center max-w-md w-full">
          <div className="text-6xl mb-4">💡</div>
          <h2 className="text-3xl font-black text-yellow-400 mb-4">Obrigado!</h2>
          <p className="text-zinc-400 mb-8">Sua mensagem foi enviada com sucesso e já está visível no feed abaixo. Sua opinião ajuda a construir o melhor site da LAFF!</p>
          <button onClick={() => setStatus("idle")} className="block w-full bg-yellow-400 text-black font-bold py-3 rounded-xl hover:bg-yellow-300 transition">
            Enviar outra mensagem
          </button>
          <Link href="/" className="block w-full bg-zinc-800 text-zinc-300 font-bold py-3 rounded-xl hover:bg-zinc-700 transition mt-2">
            Voltar ao início
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-yellow-400 hover:underline mb-8 inline-block font-bold">← Voltar para o início</Link>
        
        <h1 className="text-4xl font-black mb-2 text-white">💡 Sugestões e Feedbacks</h1>
        <p className="text-zinc-400 mb-8">
          O LAFF Finder é feito pela comunidade. Tem uma ideia? Achou um erro? Manda pra gente!
          <br/>
          <span className="text-xs text-zinc-500">⚠️ Seu Nick e Instagram serão exibidos publicamente.</span>
        </p>

        {/* FORMULÁRIO */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-10">
          <h2 className="text-xl font-black mb-4 text-yellow-400">Deixe sua mensagem</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2 bg-black p-1 rounded-xl">
              <button type="button" onClick={() => setTipo("Sugestão")} className={`flex-1 py-3 rounded-lg font-bold transition ${tipo === "Sugestão" ? "bg-blue-600 text-white" : "text-zinc-500 hover:text-white"}`}>
                💡 Sugestão
              </button>
              <button type="button" onClick={() => setTipo("Feedback")} className={`flex-1 py-3 rounded-lg font-bold transition ${tipo === "Feedback" ? "bg-red-600 text-white" : "text-zinc-500 hover:text-white"}`}>
                🐞 Erro / Problema
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input 
                required 
                value={form.nick} 
                onChange={e => setForm({...form, nick: e.target.value})} 
                placeholder="Seu Nick no Free Fire *" 
                className="bg-black border border-zinc-700 rounded-lg p-3 text-white focus:border-yellow-400 outline-none" 
              />
              <input 
                required 
                value={form.instagram} 
                onChange={e => setForm({...form, instagram: e.target.value})} 
                placeholder="Instagram (ex: @izuki.x) *" 
                className="bg-black border border-zinc-700 rounded-lg p-3 text-white focus:border-yellow-400 outline-none" 
              />
            </div>

            <textarea 
              required 
              value={form.msg} 
              onChange={e => setForm({...form, msg: e.target.value})} 
              placeholder={tipo === "Sugestão" ? "Descreva sua ideia aqui..." : "Descreva o erro ou problema..."} 
              rows={5} 
              className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white focus:border-yellow-400 outline-none resize-none" 
            />

            <button disabled={status === "sending"} className="w-full bg-yellow-400 text-black font-black py-4 rounded-xl hover:bg-yellow-300 transition disabled:bg-zinc-700 disabled:text-zinc-500">
              {status === "sending" ? "Enviando..." : "🚀 Enviar Mensagem"}
            </button>
            
            {status === "error" && <p className="text-center text-red-500 font-bold">Erro ao enviar. Tente novamente.</p>}
          </form>
        </div>

        {/* FEED PÚBLICO */}
        <h2 className="text-2xl font-black mb-4 text-white">📢 Feed da Comunidade</h2>
        
        {loadingFeed ? (
          <p className="text-zinc-500 text-center py-10 animate-pulse">Carregando feedbacks...</p>
        ) : feedbacks.length === 0 ? (
          <p className="text-zinc-500 text-center py-10">Nenhum feedback ainda. Seja o primeiro!</p>
        ) : (
          <div className="space-y-4">
            {feedbacks.map((fb, index) => {
              // O índice real na planilha (considerando que o array está invertido)
              const realIndex = feedbacks.length - 1 - index;
              const likes = fb.Likes || 0;
              const deslikes = fb.Deslikes || 0;

              return (
                <div key={index} className={`rounded-xl border p-5 ${fb.Tipo === 'Sugestão' ? 'bg-blue-950/20 border-blue-900/50' : 'bg-red-950/20 border-red-900/50'}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-black px-2 py-1 rounded ${fb.Tipo === 'Sugestão' ? 'bg-blue-600 text-white' : 'bg-red-600 text-white'}`}>
                        {fb.Tipo === 'Sugestão' ? '💡 SUGESTÃO' : '🐞 FEEDBACK'}
                      </span>
                      <div>
                        <p className="font-black text-white">{fb.Nick}</p>
                        <a href={`https://instagram.com/${fb.Instagram.replace('@', '')}`} target="_blank" className="text-xs text-pink-400 hover:text-pink-300">
                          📷 {fb.Instagram}
                        </a>
                      </div>
                    </div>
                    <button onClick={() => handleDelete(realIndex)} className="text-zinc-600 hover:text-red-500 text-xs transition" title="Apagar (Admin)">
                      🗑️
                    </button>
                  </div>

                  <p className="text-zinc-300 text-sm mb-4 whitespace-pre-wrap">{fb.Mensagem}</p>

                  <div className="flex gap-2 border-t border-zinc-800 pt-3">
                    <button 
                      onClick={() => handleVote(realIndex, 'like')}
                      className="flex items-center gap-1 bg-zinc-800 hover:bg-green-900/50 text-zinc-300 hover:text-green-400 px-3 py-1 rounded-lg text-xs font-bold transition"
                    >
                      👍 {likes}
                    </button>
                    <button 
                      onClick={() => handleVote(realIndex, 'deslike')}
                      className="flex items-center gap-1 bg-zinc-800 hover:bg-red-900/50 text-zinc-300 hover:text-red-400 px-3 py-1 rounded-lg text-xs font-bold transition"
                    >
                      👎 {deslikes}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-center text-zinc-600 text-xs mt-12 pb-6">
          by Izuuki.x — LAFF Finder
        </p>
      </div>
    </main>
  );
}