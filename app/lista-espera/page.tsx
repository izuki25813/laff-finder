"use client";

import Link from "next/link";
import { useState } from "react";

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbywdkprIPjco6PAB-m9Crnx-fLFxwzRSEoWt9ydPj5Z1qQJzYhIscz83ZXOiYFC4aD8gg/exec"; 
const CHAVE_PIX = "izukianonimo@gmail.com"; 

export default function ListaEsperaPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ nick: "", id: "", whatsapp: "", nivel: "" });
  const [submitting, setSubmitting] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);
  const [errors, setErrors] = useState<any>({});

  const validateStep1 = () => {
    const newErrors: any = {};
    if (!form.nick.trim()) newErrors.nick = "Nick é obrigatório";
    if (!form.id.trim()) newErrors.id = "ID é obrigatório";
    if (!form.whatsapp.trim()) {
      newErrors.whatsapp = "WhatsApp é obrigatório";
    } else if (form.whatsapp.replace(/\D/g, '').length < 10) {
      newErrors.whatsapp = "WhatsApp inválido";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

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
          whatsapp: form.whatsapp,
          nivel: form.nivel
        })
      });
      setStep(3);
    } catch (error) {
      alert("Erro ao confirmar. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatWhatsApp = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim();
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').trim();
  };

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
        
        <h1 className="text-4xl font-black mb-2 text-white"> Acesso VIP - ZK Esports</h1>
        <p className="text-zinc-400 mb-8">
          Preencha seus dados e realize o pagamento para entrar na lista de espera oficial.
        </p>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8">
          
          {/* BARRA DE PROGRESSO */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${step >= 1 ? 'bg-yellow-400 text-black' : 'bg-zinc-700 text-zinc-500'}`}>1</div>
              <div className={`flex-1 h-1 rounded-full ${step >= 2 ? 'bg-yellow-400' : 'bg-zinc-700'}`}></div>
            </div>
            <div className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${step >= 2 ? 'bg-yellow-400 text-black' : 'bg-zinc-700 text-zinc-500'}`}>2</div>
              <div className={`flex-1 h-1 rounded-full ${step >= 3 ? 'bg-yellow-400' : 'bg-zinc-700'}`}></div>
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${step >= 3 ? 'bg-yellow-400 text-black' : 'bg-zinc-700 text-zinc-500'}`}>3</div>
          </div>

          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-yellow-400 mb-2">Passo 1: Seus Dados</h2>
                <p className="text-zinc-500 text-sm">Preencha corretamente para receber o acesso</p>
              </div>

              <div className="space-y-4">
                {/* NICK */}
                <div>
                  <label className="block text-sm font-bold text-zinc-300 mb-2">
                    Nick no Free Fire <span className="text-red-500">*</span>
                  </label>
                  <input 
                    value={form.nick} 
                    onChange={e => setForm({...form, nick: e.target.value})} 
                    placeholder="Ex: Izuuki.x" 
                    className={`w-full bg-black border rounded-lg p-3 text-white focus:outline-none transition ${errors.nick ? 'border-red-500' : 'border-zinc-700 focus:border-yellow-400'}`} 
                  />
                  {errors.nick && <p className="text-red-500 text-xs mt-1">{errors.nick}</p>}
                </div>

                {/* ID */}
                <div>
                  <label className="block text-sm font-bold text-zinc-300 mb-2">
                    ID do Free Fire <span className="text-red-500">*</span>
                  </label>
                  <input 
                    value={form.id} 
                    onChange={e => setForm({...form, id: e.target.value})} 
                    placeholder="Ex: 123456789" 
                    type="number"
                    className={`w-full bg-black border rounded-lg p-3 text-white focus:outline-none transition ${errors.id ? 'border-red-500' : 'border-zinc-700 focus:border-yellow-400'}`} 
                  />
                  {errors.id && <p className="text-red-500 text-xs mt-1">{errors.id}</p>}
                </div>

                {/* WHATSAPP */}
                <div>
                  <label className="block text-sm font-bold text-zinc-300 mb-2">
                    WhatsApp <span className="text-red-500">*</span>
                  </label>
                  <input 
                    value={form.whatsapp} 
                    onChange={e => setForm({...form, whatsapp: formatWhatsApp(e.target.value)})} 
                    placeholder="(11) 99999-9999" 
                    maxLength={15}
                    className={`w-full bg-black border rounded-lg p-3 text-white focus:outline-none transition ${errors.whatsapp ? 'border-red-500' : 'border-zinc-700 focus:border-yellow-400'}`} 
                  />
                  {errors.whatsapp && <p className="text-red-500 text-xs mt-1">{errors.whatsapp}</p>}
                  <p className="text-zinc-600 text-xs mt-1">Usaremos este número para te chamar após confirmar o pagamento</p>
                </div>

                {/* NÍVEL (OPCIONAL) */}
                <div>
                  <label className="block text-sm font-bold text-zinc-300 mb-2">
                    Seu nível atual <span className="text-zinc-600">(opcional)</span>
                  </label>
                  <select 
                    value={form.nivel} 
                    onChange={e => setForm({...form, nivel: e.target.value})} 
                    className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white focus:border-yellow-400 outline-none"
                  >
                    <option value="">Selecione seu nível</option>
                    <option>🟤 Iniciante</option>
                    <option>🟠 Intermediário</option>
                    <option>🔵 Avançado</option>
                    <option>🟣 Profissional</option>
                  </select>
                </div>
              </div>

              <button 
                onClick={handleNextStep}
                className="w-full bg-yellow-400 text-black font-black py-4 rounded-xl hover:bg-yellow-300 transition text-lg shadow-lg"
              >
                Ir para Pagamento →
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-yellow-400 mb-2">Passo 2: Pagamento via PIX</h2>
                <p className="text-zinc-500 text-sm">Copie a chave e faça o pagamento no seu banco</p>
              </div>
              
              <div className="bg-black border-2 border-dashed border-yellow-400/50 rounded-xl p-6 text-center">
                <p className="text-zinc-400 text-sm mb-2">Chave PIX (E-mail):</p>
                <p className="text-white font-mono text-lg break-all mb-4">{CHAVE_PIX}</p>
                
                <button 
                  onClick={handleCopyPix}
                  className={`w-full font-bold py-3 rounded-lg transition ${pixCopied ? 'bg-green-600 text-white' : 'bg-zinc-800 text-white hover:bg-zinc-700'}`}
                >
                  {pixCopied ? '✅ Chave Copiada!' : '📋 Copiar Chave PIX'}
                </button>
              </div>

              <div className="bg-yellow-900/10 border border-yellow-600/30 rounded-lg p-4">
                <p className="text-yellow-400 text-sm">
                  ️ Após fazer o PIX no seu banco, clique no botão abaixo para confirmar sua entrada na lista. O Izuuki.x irá conferir o pagamento e te chamar no WhatsApp.
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