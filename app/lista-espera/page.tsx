"use client";

import Link from "next/link";
import { useState } from "react";

// URL DO SEU APPS SCRIPT (JÁ CONFIGURADA!)
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbywdkprIPjco6PAB-m9Crnx-fLFxwzRSEoWt9ydPj5Z1qQJzYhIscz83ZXOiYFC4aD8gg/exec"; 

// ⚠️ SUA CHAVE PIX (Se for diferente do e-mail, mude só aqui embaixo)
const CHAVE_PIX = "izukianonimo@gmail.com"; 

export default function ListaEsperaPage() {
  const [step, setStep] = useState(1); // 1: Dados, 2: Pagamento, 3: Sucesso
  const [form, setForm] = useState({ nick: "", id: "", whatsapp: "" });
  const [submitting, setSubmitting] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);

  const handleCopyPix = () => {
    navigator.clipboard.writeText(CHAVE_PIX);
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 2000);
  };

  const handleConfirmPayment = async () => {
    setSubmitting(true);
    try {
      await fetch(SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({
          action: "join_waiting_list",
          nick: form.nick,
          id: form.id,
          whatsapp: form.whatsapp
        })
      });
      setStep(3); // Vai para a tela de sucesso
    } catch (error) {
      alert("Erro ao confirmar. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  // TELA 3: SUCESSO (MENSAGEM FINAL)
  if (step === 3) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="text-center max-w-md w-full bg-zinc-900 border border-yellow-400/30 rounded-2xl p-8">
          <div className="text-6xl mb-6">⏳</div>
          <h2 className="text-3xl font-black text-yellow-400 mb-4">Você está na Lista!</h2>
          <p className="text-zinc-300 text-lg mb-8 leading-relaxed">
            Acompanhe as lives e aguarde ser chamado.
            <br/><br/>
            <span className="text-sm text-zinc-500">
              Assim que o pagamento for confirmado pelo Izuuki.x, você receberá o acesso no WhatsApp.
            </span>
          </p>
          <Link href="/" className="block w-full bg-yellow-400 text-black font-bold py-3 rounded-xl hover:bg-yellow-300 transition">
            Voltar ao início
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-6 md:p-10">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-yellow-400 hover:underline mb-8 inline-block font-bold">← Voltar para o início</Link>
        
        <h1 className="text-4xl font-black mb-2 text-white">🔒 Acesso VIP - ZK Esports</h1>
        <p className="text-zinc-400 mb-8">
          Preencha seus dados e realize o pagamento para entrar na lista de espera oficial.
        </p>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8">
          
          {/* BARRA DE PROGRESSO */}
          <div className="flex items-center justify-between mb-8">
            <div className={`flex-1 h-1 rounded-full ${step >= 1 ? 'bg-yellow-400' : 'bg-zinc-700'}`}></div>
            <div className={`flex-1 h-1 rounded-full mx-2 ${step >= 2 ? 'bg-yellow-400' : 'bg-zinc-700'}`}></div>
            <div className={`flex-1 h-1 rounded-full ${step >= 3 ? 'bg-yellow-400' : 'bg-zinc-700'}`}></div>
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-black text-yellow-400 mb-4">Passo 1: Seus Dados</h2>
              <input 
                required value={form.nick} onChange={e => setForm({...form, nick: e.target.value})} 
                placeholder="Nick no Free Fire *" 
                className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white focus:border-yellow-400 outline-none" 
              />
              <input 
                required value={form.id} onChange={e => setForm({...form, id: e.target.value})} 
                placeholder="ID do Free Fire *" 
                className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white focus:border-yellow-400 outline-none" 
              />
              <input 
                required value={form.whatsapp} onChange={e => setForm({...form, whatsapp: e.target.value})} 
                placeholder="WhatsApp (ex: 11999999999) *" 
                className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white focus:border-yellow-400 outline-none" 
              />
              <button 
                onClick={() => setStep(2)}
                disabled={!form.nick || !form.id || !form.whatsapp}
                className="w-full bg-yellow-400 text-black font-black py-4 rounded-xl hover:bg-yellow-300 transition disabled:bg-zinc-700 disabled:text-zinc-500 disabled:cursor-not-allowed"
              >
                Ir para Pagamento →
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-black text-yellow-400 mb-4">Passo 2: Pagamento via PIX</h2>
              
              <div className="bg-black border-2 border-dashed border-yellow-400/50 rounded-xl p-6 text-center">
                <p className="text-zinc-400 text-sm mb-2">Chave PIX:</p>
                <p className="text-white font-mono text-lg break-all mb-4">{CHAVE_PIX}</p>
                
                <button 
                  onClick={handleCopyPix}
                  className={`w-full font-bold py-3 rounded-lg transition ${pixCopied ? 'bg-green-600 text-white' : 'bg-zinc-800 text-white hover:bg-zinc-700'}`}
                >
                  {pixCopied ? '✅ Chave Copiada!' : ' Copiar Chave PIX'}
                </button>
              </div>

              <div className="bg-yellow-900/10 border border-yellow-600/30 rounded-lg p-4">
                <p className="text-yellow-400 text-sm">
                  ⚠️ Após fazer o PIX no seu banco, clique no botão abaixo para confirmar sua entrada na lista. O Izuuki.x irá conferir o pagamento e te chamar no WhatsApp.
                </p>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 bg-zinc-800 text-white font-bold py-4 rounded-xl hover:bg-zinc-700 transition">
                  ← Voltar
                </button>
                <button 
                  onClick={handleConfirmPayment}
                  disabled={submitting}
                  className="flex-[2] bg-green-600 text-white font-black py-4 rounded-xl hover:bg-green-500 transition disabled:bg-zinc-700"
                >
                  {submitting ? 'Confirmando...' : '✅ JÁ FIZ O PIX, ENTRAR NA LISTA'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}