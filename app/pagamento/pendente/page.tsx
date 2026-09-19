import Link from "next/link";

// Página de retorno do Checkout Pro (Fase 10.4). Puramente informativa —
// NÃO lê query params do Mercado Pago e NÃO altera nenhum dado.

export const metadata = {
  title: "Pagamento pendente | FINDER",
  description: "Retorno do checkout Mercado Pago.",
};

export default function PagamentoPendentePage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-xl px-4 py-16 md:px-6">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-8 text-center">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-yellow-400">FINDER</p>
          <h1 className="mt-3 text-2xl font-black text-white">Pagamento pendente</h1>
          <p className="mt-4 text-sm leading-6 text-zinc-300">
            O Mercado Pago está processando seu pagamento (comum em alguns meios de pagamento, como boleto). Assim
            que a confirmação chegar ao nosso sistema, sua matrícula será ativada automaticamente.
          </p>
          <Link
            href="/mentoria/diagnostico"
            className="mt-6 inline-flex rounded-xl bg-yellow-400 px-5 py-3 font-black text-black transition hover:bg-yellow-300"
          >
            Acompanhar status
          </Link>
        </div>
      </div>
    </main>
  );
}
