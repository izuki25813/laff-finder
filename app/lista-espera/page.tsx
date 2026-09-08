"use client";

import Link from "next/link";
import { useState } from "react";

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbywdkprIPjco6PAB-m9Crnx-fLFxwzRSEoWt9ydPj5Z1qQJzYhIscz83ZXOiYFC4aD8gg/exec"; 
const CHAVE_PIX = "izukianonimo@gmail.com"; 
const ADMIN_WHATSAPP = "559984399514"; 

// DADOS DOS PLANOS
const planos = [
  {
    id: 1,
    nome: "Acesso Padrão",
    preco: "19,90",
    beneficios: [
      "Análise das redes sociais",
      "Entrada na fila de testes (ordem de chegada)",
      "Acesso básico ao banco de dados"
    ]
  },
  {
    id: 2,
    nome: "Prioridade ZK",
    preco: "34,90",
    destaque: true,
    beneficios: [
      "Tudo do Plano Padrão",
      "Pula 50% da fila de espera",
      "Prescrição de Treino escrito rápida do Izuuki.x",
      "React de Brinde para analisar erros após o teste!"
    ]
  },
  {
    id: 3,
    nome: "ZK Elite Express",
    preco: "49,90",
    beneficios: [
      "Prioridade Máxima (Pula a fila inteira)",
      "Garantia de teste agendado em até 24 horas",
      "Feedback em Áudio/Vídeo (15min) pós-teste",
      "+1 Dia de Pro Level GRÁTIS",
      "Selo 'Candidato Elite' no seu perfil F/A"
    ]
  }
];

export default function ListaEsperaPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ nick: "", videoLink: "", whatsapp: "", funcao: "" });
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);
  const [errors, setErrors] = useState<any>({});

  const validateStep1 = () => {
    const newErrors: any = {};
    if (!form.nick.trim()) newErrors.nick = "Nick é obrigatório";
    if (!form.videoLink.trim()) {
      newErrors.videoLink = "Link de vídeo é obrigatório";
    } else if (!form.videoLink.includes('http')) {
      newErrors.videoLink = "Insira um link válido (comece com http)";
    }
    if (!form.whatsapp.trim()) {
      newErrors.whatsapp = "WhatsApp é obrigatório";
    } else if (form.whatsapp.replace(/\D/g, '').length < 10) {
      newErrors.whatsapp = "WhatsApp inválido";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && selectedPlan) {
      setStep(3);
    }
  };

  const handleCopyPix = () => {
    navigator.clipboard.writeText(CHAVE_PIX);
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 2000);
  };

  const handleSendReceipt = () => {
    const planoEscolhido = planos.find(p => p.id === selectedPlan);
    const mensagem = `Olá Izuuki.x! Acabei de fazer o PIX para entrar na Lista de Espera VIP.\n\nPlano: ${planoEscolhido?.nome} (R$ ${planoEscolhido?.preco})\nMeu Nick: ${form.nick}\nMinha Função: ${form.funcao || 'Não informada'}\n\nSegue o comprovante em anexo! 👇`;
    const url = `https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
  };

  const handleConfirmPayment = async () => {
    setSubmitting(true);
    const planoEscolhido = planos.find(p => p.id === selectedPlan);
    try {
      await fetch(SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({
          action: "join_waiting_list",
          nick: form.nick,
          videoLink: form.videoLink,
          whatsapp: form.whatsapp,
          funcao: form.funcao,
          plano: planoEscolhido?.nome,
          valor: planoEscolhido?.preco
        })
      });
      setStep(4); // Tela de sucesso
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

  // TELA 4: SUCESSO
  if (step === 4) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="text-center max-w-md w-full bg-zinc-900 border border-yellow-400/30 rounded-2xl p-8">
          <div className="text-6xl mb-6"></div>
          <h2 className="text-3xl font-black text-yellow-400 mb-4">Você está na Lista!</h2>
          <p className="text-zinc-300 text-lg mb-8 leading-relaxed">
            Acompanhe as lives e aguarde ser chamado.
            <br/><br/>
            <span className="text-sm text-zinc-500">
              Assim que o Izuuki.x conferir seu comprovante no WhatsApp, seu acesso será liberado.
            </span>
          </p>
          <Link href="/mentoria" className="block w-full bg-gradient-to-r from-yellow-600 to-yellow-400 text-black font-black py-4 rounded-xl hover:from-yellow-500 hover:to-yellow-300 transition mb-3 shadow-lg">
             Ver Planos de Mentoria e Evolução
          </Link>
          <Link href="/" className="block w-full bg-zinc-800 text-zinc-300 font-bold py-3 rounded-xl hover:bg-zinc-700 transition text-sm">
            ← Voltar ao início
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-6 md:p-10">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-yellow-400 hover:underline mb-8 inline-block font-bold">← Voltar para o início</Link>
        
        <h1 className="text-4xl font-black mb-2 text-white">🔒 Acesso VIP - ZK Esports</h1>
        <p className="text-zinc-400 mb-8">
          Preencha seus dados, escolha seu plano e garanta seu lugar na fila.
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
            <div className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${step >= 3 ? 'bg-yellow-400 text-black' : 'bg-zinc-700 text-zinc-500'}`}>3</div>
            </div>
          </div>

          {/* PASSO 1: DADOS */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-yellow-400 mb-2">Passo 1: Seus Dados</h2>
                <p className="text-zinc-500 text-sm">Preencha corretamente para receber o acesso</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-zinc-300 mb-2">Nick no Free Fire <span className="text-red-500">*</span></label>
                  <input value={form.nick} onChange={e => setForm({...form, nick: e.target.value})} placeholder="Ex: Izuuki.x" className={`w-full bg-black border rounded-lg p-3 text-white focus:outline-none transition ${errors.nick ? 'border-red-500' : 'border-zinc-700 focus:border-yellow-400'}`} />
                  {errors.nick && <p className="text-red-500 text-xs mt-1">{errors.nick}</p>}
                </div>

                <div>
                  <label className="block text-sm font-bold text-zinc-300 mb-2">Link de Rede Social com Vídeos <span className="text-red-500">*</span></label>
                  <input value={form.videoLink} onChange={e => setForm({...form, videoLink: e.target.value})} placeholder="Ex: https://youtube.com/@seucanal" className={`w-full bg-black border rounded-lg p-3 text-white focus:outline-none transition ${errors.videoLink ? 'border-red-500' : 'border-zinc-700 focus:border-yellow-400'}`} />
                  {errors.videoLink && <p className="text-red-500 text-xs mt-1">{errors.videoLink}</p>}
                </div>

                <div>
                  <label className="block text-sm font-bold text-zinc-300 mb-2">WhatsApp <span className="text-red-500">*</span></label>
                  <input value={form.whatsapp} onChange={e => setForm({...form, whatsapp: formatWhatsApp(e.target.value)})} placeholder="(99) 8439-9514" maxLength={15} className={`w-full bg-black border rounded-lg p-3 text-white focus:outline-none transition ${errors.whatsapp ? 'border-red-500' : 'border-zinc-700 focus:border-yellow-400'}`} />
                  {errors.whatsapp && <p className="text-red-500 text-xs mt-1">{errors.whatsapp}</p>}
                </div>

                <div>
                  <label className="block text-sm font-bold text-zinc-300 mb-2">Sua Função <span className="text-zinc-600">(opcional)</span></label>
                  <select value={form.funcao} onChange={e => setForm({...form, funcao: e.target.value})} className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white focus:border-yellow-400 outline-none">
                    <option value="">Selecione sua função</option>
                    <option>🟢 Rush 1</option>
                    <option>🟢 Rush 2</option>
                    <option> Granadeiro</option>
                    <option>🟡 Suporte</option>
                    <option>🟣 IGL (Capitão)</option>
                  </select>
                </div>
              </div>

              <button onClick={handleNextStep} className="w-full bg-yellow-400 text-black font-black py-4 rounded-xl hover:bg-yellow-300 transition text-lg shadow-lg">
                Escolher meu Plano →
              </button>
            </div>
          )}

          {/* PASSO 2: ESCOLHA DO PLANO */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-yellow-400 mb-2">Passo 2: Escolha seu Plano</h2>
                <p className="text-zinc-500 text-sm">Selecione o nível de prioridade que você deseja</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {planos.map((plano) => (
                  <div 
                    key={plano.id}
                    onClick={() => setSelectedPlan(plano.id)}
                    className={`relative rounded-xl border-2 p-5 cursor-pointer transition-all duration-200 ${
                      selectedPlan === plano.id 
                        ? 'border-yellow-400 bg-yellow-400/10 scale-[1.02] shadow-lg shadow-yellow-400/20' 
                        : 'border-zinc-700 bg-black hover:border-zinc-500'
                    }`}
                  >
                    {plano.destaque && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-black text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                        Mais Escolhido
                      </div>
                    )}
                    
                    <h3 className="text-lg font-black text-white mb-1">{plano.nome}</h3>
                    <div className="text-3xl font-black text-yellow-400 mb-4">
                      R$ {plano.preco}
                    </div>
                    
                    <ul className="space-y-2">
                      {plano.beneficios.map((beneficio, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-zinc-300">
                          <span className="text-green-400 mt-0.5">✓</span>
                          <span>{beneficio}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={() => setStep(1)} className="flex-1 bg-zinc-800 text-white font-bold py-4 rounded-xl hover:bg-zinc-700 transition">
                  ← Voltar
                </button>
                <button 
                  onClick={handleNextStep}
                  disabled={!selectedPlan}
                  className="flex-[2] bg-yellow-400 text-black font-black py-4 rounded-xl hover:bg-yellow-300 transition disabled:bg-zinc-700 disabled:text-zinc-500 disabled:cursor-not-allowed text-lg"
                >
                  Ir para Pagamento →
                </button>
              </div>
            </div>
          )}

          {/* PASSO 3: PAGAMENTO */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-yellow-400 mb-2">Passo 3: Pagamento via PIX</h2>
                <p className="text-zinc-500 text-sm">Copie a chave, pague no seu banco e envie o print</p>
              </div>

              {/* RESUMO DO PLANO ESCOLHIDO */}
              <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-xl p-4 flex justify-between items-center">
                <div>
                  <p className="text-xs text-yellow-400 font-bold uppercase">Plano Escolhido</p>
                  <p className="text-white font-black text-lg">{planos.find(p => p.id === selectedPlan)?.nome}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-yellow-400 font-bold uppercase">Valor</p>
                  <p className="text-white font-black text-2xl">R$ {planos.find(p => p.id === selectedPlan)?.preco}</p>
                </div>
              </div>
              
              <div className="bg-black border-2 border-dashed border-yellow-400/50 rounded-xl p-6 text-center">
                <p className="text-zinc-400 text-sm mb-2">Chave PIX (E-mail):</p>
                <p className="text-white font-mono text-lg break-all mb-4">{CHAVE_PIX}</p>
                
                <button onClick={handleCopyPix} className={`w-full font-bold py-3 rounded-lg transition ${pixCopied ? 'bg-green-600 text-white' : 'bg-zinc-800 text-white hover:bg-zinc-700'}`}>
                  {pixCopied ? '✅ Chave Copiada!' : '📋 Copiar Chave PIX'}
                </button>
              </div>

              <button 
                onClick={handleSendReceipt}
                className="w-full bg-green-600 hover:bg-green-500 text-white font-black py-4 rounded-xl transition text-lg flex items-center justify-center gap-2 shadow-lg shadow-green-900/50"
              >
                📲 Enviar Comprovante no WhatsApp
              </button>

              <div className="bg-yellow-900/10 border border-yellow-600/30 rounded-lg p-4">
                <p className="text-yellow-400 text-sm text-center">
                  ⚠️ Após enviar o print no WhatsApp, clique no botão abaixo para finalizar.
                </p>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex-1 bg-zinc-800 text-white font-bold py-4 rounded-xl hover:bg-zinc-700 transition">
                  ← Voltar
                </button>
                <button 
                  onClick={handleConfirmPayment}
                  disabled={submitting}
                  className="flex-[2] bg-zinc-700 text-zinc-300 font-black py-4 rounded-xl hover:bg-zinc-600 transition disabled:opacity-50"
                >
                  {submitting ? 'Cadastrando...' : '✅ JÁ ENVIEI O COMPROVANTE'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}