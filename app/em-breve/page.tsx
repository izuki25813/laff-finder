import Link from "next/link";

export default function EmBrevePage() {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="text-center max-w-md w-full">
        <div className="text-6xl mb-6">🚧</div>
        <h1 className="text-4xl font-black text-yellow-400 mb-4">EM BREVE</h1>
        <p className="text-zinc-400 mb-8 text-lg">
          Estamos finalizando os detalhes dessa modalidade para te entregar a melhor experiência possível. 
          <br /><br />
          Enquanto isso, entre no nosso grupo oficial para ficar por dentro de tudo e tirar dúvidas!
        </p>
        
        <a 
          href="https://chat.whatsapp.com/D76yLZo60ZIA9HLwWndfEh"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full bg-green-600 hover:bg-green-500 text-white font-black py-4 rounded-xl mb-4 transition text-lg flex items-center justify-center gap-2 shadow-lg shadow-green-900/50"
        >
          <span className="text-2xl">💬</span> 
          Grupo: Suporte e Produtos IZUKI.X
        </a>

        <Link 
          href="/" 
          className="block w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold py-3 rounded-xl transition text-sm"
        >
          ← Voltar ao início
        </Link>
        
        <p className="text-zinc-600 text-xs mt-8">by Izuuki.x — LAFF Finder</p>
      </div>
    </main>
  );
}