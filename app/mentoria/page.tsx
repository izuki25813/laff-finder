import Link from "next/link";

export default function MentoriaPage() {
  return (
    <main className="min-h-screen bg-black text-white p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <Link href="/" className="text-yellow-400 hover:underline mb-8 inline-block font-bold">
          ← Voltar para o início
        </Link>

        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black mb-4 text-white">
            Mentoria ou Pro Level
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            Evolua no Free Fire. Escolha a modalidade ideal para o seu objetivo competitivo.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col hover:border-yellow-400/50 transition group">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-2xl font-black text-white mb-2">Mentoria Individual</h3>
            <span className="inline-block bg-yellow-400/10 text-yellow-400 text-xs font-bold px-3 py-1 rounded-full w-fit mb-4">
              TREINAMENTO EXCLUSIVO
            </span>
            <p className="text-zinc-400 text-sm mb-6 flex-grow leading-relaxed">
              Foco 100% em você. Análise detalhada da sua gameplay, correção de erros mecânicos, posicionamento e um plano de evolução 100% personalizado para o seu estilo, além de acompanhamento extra e trabalho de mentalidade! (Estresse, pressão, nervosismo e muito mais)
            </p>
            <Link href="/em-breve" className="w-full bg-zinc-800 hover:bg-yellow-400 hover:text-black text-white font-bold py-3 rounded-xl transition text-center">
              Quero Mentoria Individual
            </Link>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col hover:border-yellow-400/50 transition group">
            <div className="text-4xl mb-4">🛡️</div>
            <h3 className="text-2xl font-black text-white mb-2">Mentoria Coletiva</h3>
            <span className="inline-block bg-yellow-400/10 text-yellow-400 text-xs font-bold px-3 py-1 rounded-full w-fit mb-4">
              TREINAMENTO EXCLUSIVO
            </span>
            <p className="text-zinc-400 text-sm mb-6 flex-grow leading-relaxed">
              Evolua com seu squad. Foco em melhorar o jogo completo, treinos específicos, análise de erros, rotação, comunicação, sistema de pressão, end game, quebras, sinergia de equipe e análise de replays de campeonatos e acompanhamento em treinos do dia a dia para dominar a LAFF e os amadores!
            </p>
            <Link href="/em-breve" className="w-full bg-zinc-800 hover:bg-yellow-400 hover:text-black text-white font-bold py-3 rounded-xl transition text-center">
              Quero Mentoria Coletiva
            </Link>
          </div>

          <div className="bg-gradient-to-b from-zinc-900 to-black border border-yellow-600/50 rounded-2xl p-6 flex flex-col hover:border-yellow-400 transition group relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-yellow-400 text-black text-xs font-black px-3 py-1 rounded-bl-xl shadow-lg">
              MAIS POPULAR
            </div>
            <div className="text-4xl mb-4"></div>
            <h3 className="text-2xl font-black text-white mb-2">Pro Level</h3>
            <span className="inline-block bg-yellow-400 text-black text-xs font-bold px-3 py-1 rounded-full w-fit mb-4">
              TREINAMENTO EXCLUSIVO
            </span>
            <p className="text-zinc-400 text-sm mb-6 flex-grow leading-relaxed">
              O método completo e definitivo. Testado e comprovado pelos ProPlayers da FFWS. Baseado em Pressão e acompanhamento exclusivo no Discord e Whatsapp, com técnicas e treinamentos avançados para dominar o FreeFire Profissional!
              <br /><br />
              Tanto mecânico + Sensi, Reversão de Rush, reposicionamento de Suportes, quanto trabalho mental sob pressão e muito mais.
              <br /><br />
              <span className="text-yellow-400 font-bold">Extras:</span> Acesso individual, comunidade exclusiva e atualizações constantes.
            </p>
            <Link href="/em-breve" className="w-full bg-gradient-to-r from-yellow-600 to-yellow-400 hover:from-yellow-500 hover:to-yellow-300 text-black font-black py-3 rounded-xl transition text-center shadow-lg shadow-yellow-900/50">
              Acessar o Pro Level
            </Link>
          </div>

        </div>

        <p className="text-center text-zinc-600 text-xs mt-16 pb-6">
          by Izuuki.x — Transformando jogadores em profissionais.
        </p>
      </div>
    </main>
  );
}