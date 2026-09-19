import Link from "next/link";

// Página de retorno do Checkout Pro (Fase 10.4). Puramente informativa —
// NÃO lê query params do Mercado Pago, NÃO marca nenhum payment como
// approved e NÃO ativa nenhum enrollment. O retorno do Mercado Pago não é
// prova de pagamento; a confirmação real só acontece via webhook (fase
// futura).

export const metadata = {
  title: "Pagamento em confirmação | FINDER",
  description: "Retorno do checkout Mercado Pago.",
};

export default function PagamentoSucessoPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-xl px-4 py-16 md:px-6">
        <div className="rounded-3xl border border-yellow-500/30 bg-zinc-950 p-8 text-center">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-yellow-400">FINDER</p>
          <h1 className="mt-3 text-2xl font-black text-white">Pagamento recebido pelo Mercado Pago</h1>
          <p className="mt-4 text-sm leading-6 text-zinc-300">
            O Mercado Pago indicou que o pagamento foi concluído. A confirmação definitiva ainda depende da
            validação do nosso sistema — isso pode levar alguns instantes. Sua matrícula será ativada
            automaticamente assim que a confirmação chegar.
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
