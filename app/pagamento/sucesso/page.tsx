import Link from "next/link";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getServerSession } from "@/lib/auth";

export const metadata = {
  title: "Pagamento em confirmação | FINDER",
  description: "Retorno do checkout Mercado Pago.",
};

interface SearchParams {
  external_reference?: string;
  status?: string;
  payment_id?: string;
  preference_id?: string;
}

function PaymentStatusUI({
  title,
  description,
  buttonText,
  buttonHref,
  variant = "success",
}: {
  title: string;
  description: string;
  buttonText: string;
  buttonHref: string;
  variant?: "success" | "pending" | "error" | "info";
}) {
  const colors = {
    success: "border-green-500/30 text-green-400",
    pending: "border-yellow-500/30 text-yellow-400",
    error: "border-red-500/30 text-red-400",
    info: "border-blue-500/30 text-blue-400",
  };

  const borderColor = colors[variant];

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-xl px-4 py-16 md:px-6">
        <div className={`rounded-3xl border ${borderColor} bg-zinc-950 p-8 text-center`}>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-yellow-400">FINDER</p>
          <h1 className="mt-3 text-2xl font-black text-white">{title}</h1>
          <p className="mt-4 text-sm leading-6 text-zinc-300">{description}</p>
          <Link
            href={buttonHref}
            className="mt-6 inline-flex rounded-xl bg-yellow-400 px-5 py-3 font-black text-black transition hover:bg-yellow-300"
          >
            {buttonText}
          </Link>
        </div>
      </div>
    </main>
  );
}

export default async function PagamentoSucessoPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const externalReference = params.external_reference;
  const mpStatus = params.status;

let enrollmentStatus: "active" | "pending" | "cancelled" | "completed" | null = null;

  if (externalReference) {
    const supabase = await createSupabaseServerClient();
    const session = await getServerSession();

    if (supabase && session?.user) {
      const { data: payment } = await supabase
        .from("payments")
        .select("id, enrollment_id, status")
        .eq("id", externalReference)
        .eq("student_id", session.user.id)
        .maybeSingle();

      if (payment) {
        const { data: enrollment } = await supabase
          .from("mentorship_enrollments")
          .select("status")
          .eq("id", payment.enrollment_id)
          .eq("student_id", session.user.id)
          .maybeSingle();

        if (enrollment) {
          enrollmentStatus = enrollment.status as "active" | "pending" | "cancelled" | "completed";
        }
      }
    }
  }

  if (enrollmentStatus === "active") {
    return (
      <PaymentStatusUI
        title="Matrícula ativa!"
        description="Seu diagnóstico está liberado. Envie o material do seu gameplay para iniciar a análise."
        buttonText="Enviar gameplay"
        buttonHref="/mentoria/diagnostico"
        variant="success"
      />
    );
  }

  if (mpStatus === "approved" && enrollmentStatus === "pending") {
    return (
      <PaymentStatusUI
        title="Pagamento confirmado!"
        description="Estamos ativando sua matrícula. Isso pode levar alguns instantes."
        buttonText="Acompanhar status"
        buttonHref="/mentoria/diagnostico"
        variant="pending"
      />
    );
  }

  if (mpStatus === "pending") {
    return (
      <PaymentStatusUI
        title="Pagamento pendente"
        description="Assim que o Mercado Pago confirmar o pagamento, sua matrícula será ativada automaticamente."
        buttonText="Acompanhar status"
        buttonHref="/mentoria/diagnostico"
        variant="pending"
      />
    );
  }

  if (mpStatus === "rejected") {
    return (
      <PaymentStatusUI
        title="Pagamento não aprovado"
        description="O pagamento não foi aprovado pelo Mercado Pago. Você pode tentar novamente a qualquer momento."
        buttonText="Tentar novamente"
        buttonHref="/mentoria/diagnostico"
        variant="error"
      />
    );
  }

  return (
    <PaymentStatusUI
      title="Pagamento recebido pelo Mercado Pago"
      description="A confirmação definitiva ainda depende da validação do nosso sistema — isso pode levar alguns instantes. Sua matrícula será ativada automaticamente assim que a confirmação chegar."
      buttonText="Acompanhar status"
      buttonHref="/mentoria/diagnostico"
      variant="info"
    />
  );
}