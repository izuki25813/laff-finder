"use client";

import Link from "next/link";
import { useState } from "react";
import { APPS_SCRIPT_URL } from "@/lib/config";
const CHAVE_PIX = "izukianonimo@gmail.com";
const ADMIN_WHATSAPP = "559984399514";

const planos = [
  { id: 1, nome: "Acesso Padrão", preco: "19,90", beneficios: ["Análise das redes sociais", "Entrada na fila de testes (ordem de chegada)", "Acesso básico ao banco de dados"] },
  { id: 2, nome: "Prioridade ZK", preco: "34,90", destaque: true, beneficios: ["Tudo do Plano Padrão", "Pula 50% da fila de espera", "Prescrição de Treino escrito rápida do Izuuki.x", "React de Brinde para analisar erros após o teste!"] },
  { id: 3, nome: "ZK Elite Express", preco: "49,90", beneficios: ["Prioridade Máxima (Pula a fila inteira)", "Garantia de teste agendado em até 48 horas", "Feedback em Áudio/Vídeo (15min) pós-teste", "+1 Dia de Pro Level GRÁTIS", "Selo 'Candidato Elite' no seu perfil F/A"] },
];

export default function ListaEsperaClient() {
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
    } else if (!form.videoLink.includes("http")) {
      newErrors.videoLink = "Insira um link válido (comece com http)";
    }
    if (!form.whatsapp.trim()) {
      newErrors.whatsapp = "WhatsApp é obrigatório";
    } else if (form.whatsapp.replace(/\D/g, "").length < 10) {
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
    const planoEscolhido = planos.find((p) => p.id === selectedPlan);
    const mensagem = `Olá Izuuki.x! Acabei de fazer o PIX para entrar na Lista de Espera VIP.\n\nPlano: ${planoEscolhido?.nome} (R$ ${planoEscolhido?.preco})\nMeu Nick: ${form.nick}\nMinha Função: ${form.funcao || "Não informada"}\n\nSegue o comprovante em anexo! 👇`;
    const url = `https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, "_blank");
  };

  const handleConfirmPayment = async () => {
    setSubmitting(true);
    const planoEscolhido = planos.find((p) => p.id === selectedPlan);
    try {
      await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "join_waiting_list",
          nick: form.nick,
          videoLink: form.videoLink,
          whatsapp: form.whatsapp,
          funcao: form.funcao,
          plano: planoEscolhido?.nome,
          valor: planoEscolhido?.preco,
        }),
      });
      setStep(4);
    } catch (error) {
      alert("Erro ao confirmar. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatWhatsApp = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").trim();
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").trim();
  };

  if (step === 4) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="text-center max-w-md w-full bg-zinc-900 border border-yellow-400/30 rounded-2xl p-8">
          <div className="text-6xl mb-6">⏳</div>
          <h2 className="text-3xl font-black text-yellow-400 mb-4">Você está na Lista!</h2>
          <p className="text-zinc-300 text-lg mb-8 leading-relaxed">
            Acompanhe as lives e aguarde ser chamado.
            <br /><br />
            <span className="text-sm text-zinc-500">
              Assim que o Izuuki.x conferir seu comprovante no WhatsApp, seu acesso será liberado.
            </span>
          </p>
          <Link href="/mentoria" className="block w-full bg-gradient-to-r from-yellow-600 to-yellow-400 text-black font-black py-4 rounded-xl hover:from-yellow-500 hover:to-yellow-300 transition mb-3 shadow-lg">
            🚀 Ver Planos de Mentoria e Evolução
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
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${step >= 1 ? "bg-yellow-400 text-black" : "bg-zinc-700 text-zinc-500"}`}>1</div>
              <div className={`flex-1 h-1 rounded-full ${step >= 2 ? "bg-yellow-400" : "bg-zinc-700"}`}></div>
            </div>
            <div className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${step >= 2 ? "bg-yellow-400 text-black" : "bg-zinc-700 text-zinc-500"}`}>2</div>
              <div className={`flex-1 h-1 rounded-full ${step >= 3 ? "bg-yellow-400" : "bg-zinc-700"}`}></div>
            </div>
            <div className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${step >= 3 ? "bg-yellow-400 text-black" : "bg-zinc-700 text-zinc-500"}`}>3</div>
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-yellow-400 mb-2">Passo 1: Seus Dados</h2>
                <p className="text-zinc-500 text-sm">Preencha corretamente para receber o acesso</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-zinc-300 mb-2">Nick no Free Fire <span className="text-red-500">*</span></label>
                  <input value={form.nick} onChange={(e) => setForm({ ...form, nick: e.target.value })} placeholder="Ex: Izuuki.x" className={`w-full bg-black border rounded-lg p-3 text-white focus:outline-none transition ${errors.nick ? "border-red-500" : "border-zinc-700 focus:border-yellow-400"}`} />
                  {errors.nick && <p className="text-red-500 text-xs mt-1">{errors.nick}</p>}
                </div>

                <div>
                  <label className="block text-sm font-bold text-zinc-300 mb-2">Link de Rede Social com Vídeos <span className="text-red-500">*</span></label>
                  <input value={form.videoLink} onChange={(e) => setForm({ ...form, videoLink: e.target.value })} placeholder="Ex: https://youtube.com/@seucanal" className={`w-full bg-black border rounded-lg p-3 text-white focus:outline-none transition ${errors.videoLink ? "border-red-500" : "border-zinc-700 focus:border-yellow-400"}`} />
                  {errors.videoLink && <p className="text-red-500 text-xs mt-1">{errors.videoLink}</p>}
                </div>

                <div>
                  <label className="block text-sm font-bold text-zinc-300 mb-2">WhatsApp <span className="text-red-500">*</span></label>
                  <input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: formatWhatsApp(e.target.value) })} placeholder="(99) 8439-9514" maxLength={15} className={`w-full bg-black border rounded-lg p-3 text-white focus:outline-none transition ${errors.whatsapp ? "border-red-500" : "border-zinc-700 focus:border-yellow-400"}`} />
                  {errors.whatsapp && <p className="text-red-500 text-xs mt-1">{errors.whatsapp}</p>}
                </div>

                <div>
                  <label className="block text-sm font-bold text-zinc-300 mb-2">Sua Função <span className="text-zinc-600">(opcional)</span></label>
                  <select value={form.funcao} onChange={(e) => setForm({ ...form, funcao: e.target.value })} className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white focus:border-yellow-400 outline-none">
                    <option value="">Selecione sua função</option>
                    <option>🟢 Rush 1</option>
                    <option>🟢 Rush 2</option>
                    <option>🔵 Granadeiro</option>
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

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-yellow-400 mb-2">Passo 2: Escolha seu Plano</h2>
                <p className="text-zinc-500 text-sm">Selecione a melhor opção para o seu momento.</p>
              </div>

              <div className="space-y-4">
                {planos.map((plano) => (
                  <button
                    key={plano.id}
                    type="button"
                    onClick={() => setSelectedPlan(plano.id)}
                    className={`w-full text-left rounded-2xl border p-5 transition ${selectedPlan === plano.id ? "border-yellow-400 bg-yellow-400/10" : "border-zinc-700 bg-zinc-950 hover:border-zinc-500"}`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xl font-black text-white">{plano.nome}</p>
                        <p className="text-yellow-400 font-bold mt-1">R$ {plano.preco}</p>
                      </div>
                      {plano.destaque && <span className="bg-yellow-400 text-black px-2 py-1 text-xs font-black rounded-full">MAIS POPULAR</span>}
                    </div>
                    <ul className="mt-4 space-y-2 text-sm text-zinc-300">
                      {plano.beneficios.map((beneficio) => (
                        <li key={beneficio}>• {beneficio}</li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 bg-zinc-800 text-zinc-300 font-bold py-3 rounded-xl hover:bg-zinc-700 transition">
                  Voltar
                </button>
                <button onClick={handleNextStep} disabled={!selectedPlan} className="flex-1 bg-yellow-400 text-black font-black py-3 rounded-xl hover:bg-yellow-300 transition disabled:bg-zinc-700 disabled:text-zinc-500">
                  Continuar
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-yellow-400 mb-2">Passo 3: Confirmar pagamento</h2>
                <p className="text-zinc-500 text-sm">Finalize a etapa para entrar na fila de espera.</p>
              </div>

              <div className="bg-black border border-zinc-800 rounded-2xl p-5">
                <p className="text-zinc-400 text-sm mb-2">Plano escolhido</p>
                <p className="text-2xl font-black text-white">{planos.find((p) => p.id === selectedPlan)?.nome}</p>
                <p className="text-yellow-400 font-bold text-lg mt-2">R$ {planos.find((p) => p.id === selectedPlan)?.preco}</p>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5">
                <p className="text-sm text-zinc-400 mb-3">Chave PIX</p>
                <div className="flex items-center justify-between gap-3 rounded-xl bg-zinc-900 border border-zinc-700 p-3">
                  <span className="text-sm text-white break-all">{CHAVE_PIX}</span>
                  <button onClick={handleCopyPix} className="bg-yellow-400 text-black font-black px-3 py-2 rounded-lg text-xs hover:bg-yellow-300 transition">
                    {pixCopied ? "Copiada" : "Copiar"}
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex-1 bg-zinc-800 text-zinc-300 font-bold py-3 rounded-xl hover:bg-zinc-700 transition">
                  Voltar
                </button>
                <button onClick={handleSendReceipt} className="flex-1 bg-green-600 text-white font-black py-3 rounded-xl hover:bg-green-500 transition">
                  Enviar Comprovante
                </button>
              </div>

              <button onClick={handleConfirmPayment} disabled={submitting} className="w-full bg-yellow-400 text-black font-black py-4 rounded-xl hover:bg-yellow-300 transition disabled:bg-zinc-700 disabled:text-zinc-500">
                {submitting ? "Confirmando..." : "Confirmar Pagamento e Entrar na Lista"}
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
