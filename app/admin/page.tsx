import { requireAdminAccess } from "@/lib/auth";

export default async function AdminPage() {
  await requireAdminAccess();

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <p className="mb-3 text-xs font-black uppercase tracking-[0.3em] text-yellow-400">Admin</p>
        <h1 className="text-3xl font-black">Área administrativa</h1>
        <p className="mt-4 text-zinc-300">Acesso restrito com validação no servidor.</p>
      </div>
    </main>
  );
}
