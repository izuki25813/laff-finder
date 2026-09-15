export const metadata = {
  title: "Acesso restrito",
  description: "Você precisa estar autenticado para acessar esta área.",
};

export default function AdminAccessDeniedPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-6 py-16">
        <div className="w-full rounded-2xl border border-red-500/40 bg-zinc-950 p-8 text-center">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.3em] text-red-400">Restrito</p>
          <h1 className="text-3xl font-black">Acesso restrito</h1>
          <p className="mt-4 text-zinc-300">
            Faça login com uma conta autorizada para acessar esta área.
          </p>
          <div className="mt-6">
            <a href="/login" className="inline-flex rounded-xl bg-yellow-400 px-5 py-3 font-black text-black hover:bg-yellow-300">
              Ir para login
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
