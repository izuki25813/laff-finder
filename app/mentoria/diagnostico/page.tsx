import Link from "next/link";

import { CheckoutButton } from "./CheckoutButton";
import {
  DIAGNOSTIC_STATUS_LABELS,
  parseDiagnosticResult,
  type DiagnosticRequestRow,
  type DiagnosticResult,
} from "@/lib/diagnostics";
import { getMentorshipProductBySlug } from "@/lib/mentorship";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Diagnóstico | LAFF Finder",
  description: "Solicite e acompanhe seu diagnóstico de gameplay no LAFF Finder.",
};

const STATUS_MESSAGES: Record<string, string> = {
  enviado: "Diagnóstico enviado! Acompanhe o status abaixo.",
  atualizado: "Informações atualizadas com sucesso.",
  "sem-matricula": "Não foi possível continuar: nenhuma matrícula ativa foi encontrada para o diagnóstico.",
  "ja-existe": "Você já possui um diagnóstico em andamento para esta matrícula.",
  "erro-link": "Informe o link do seu gameplay para continuar.",
  "nao-autorizado": "Você não está autorizado a realizar esta ação.",
  erro: "Não foi possível concluir a ação. Tente novamente.",
};

export default async function DiagnosticoPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const paramsValue = (await searchParams) ?? {};
  const statusParam = Array.isArray(paramsValue.status) ? paramsValue.status[0] : paramsValue.status;
  const statusMessage = statusParam ? (STATUS_MESSAGES[statusParam] ?? "") : "";

  const product = getMentorshipProductBySlug("diagnostico");
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  let enrollment: { id: string } | null = null;
  let pendingEnrollment: { id: string } | null = null;
  let diagnosticRequest: DiagnosticRequestRow | null = null;

  if (supabase && user) {
    const { data: diagnosticProducts } = await supabase
      .from("mentoring_products")
      .select("id")
      .eq("product_type", "diagnostic")
      .eq("active", true);

    const diagnosticProductIds = (diagnosticProducts ?? []).map((item) => item.id);

    if (diagnosticProductIds.length > 0) {
      const { data: enrollments } = await supabase
        .from("mentorship_enrollments")
        .select("id")
        .eq("student_id", user.id)
        .eq("status", "active")
        .in("product_id", diagnosticProductIds)
        .order("created_at", { ascending: false })
        .limit(1);

      enrollment = enrollments?.[0] ?? null;

      if (!enrollment) {
        // Sem matrícula ativa ainda: verifica se existe uma matrícula
        // pending para oferecer o botão de pagamento (Fase 10.4). Isso
        // não ativa nada — só localiza uma matrícula pending existente
        // para permitir iniciar o checkout a partir dela.
        const { data: pendingEnrollments } = await supabase
          .from("mentorship_enrollments")
          .select("id")
          .eq("student_id", user.id)
          .eq("status", "pending")
          .in("product_id", diagnosticProductIds)
          .order("created_at", { ascending: false })
          .limit(1);

        pendingEnrollment = pendingEnrollments?.[0] ?? null;
      }
    }

    if (enrollment) {
      const { data: requestData } = await supabase
        .from("diagnostic_requests")
        .select("*")
        .eq("enrollment_id", enrollment.id)
        .maybeSingle();

      diagnosticRequest = (requestData as DiagnosticRequestRow | null) ?? null;
    }
  }

  const result = diagnosticRequest ? parseDiagnosticResult(diagnosticRequest.result) : null;

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-yellow-400">LAFF Finder</p>
            <h1 className="mt-2 text-3xl font-black">Diagnóstico</h1>
          </div>
          <Link
            href="/mentoria"
            className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-bold text-white transition hover:border-yellow-500 hover:text-yellow-400"
          >
            Voltar para mentoria
          </Link>
        </div>

        {statusMessage ? (
          <div className="mb-6 rounded-xl border border-yellow-500/50 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
            {statusMessage}
          </div>
        ) : null}

        <article className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 md:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-yellow-300">Produto de entrada</p>
              <h2 className="mt-2 text-2xl font-black text-white">{product?.name ?? "Diagnóstico"}</h2>
            </div>
            <p className="text-2xl font-black text-yellow-300">{product?.priceLabel ?? "R$ 39"}</p>
          </div>

          {product?.description ? (
            <p className="mb-6 text-sm leading-6 text-zinc-300">{product.description}</p>
          ) : null}

          {!user ? (
            <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
              <p className="text-sm text-zinc-300">Faça login para iniciar ou acompanhar o seu diagnóstico.</p>
              <Link
                href="/login?next=/mentoria/diagnostico"
                className="inline-flex rounded-xl bg-yellow-400 px-4 py-3 font-black text-black transition hover:bg-yellow-300"
              >
                Entrar para continuar
              </Link>
            </div>
          ) : pendingEnrollment ? (
            <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
              <p className="text-sm font-bold text-white">
                Você tem uma matrícula pendente de pagamento para este diagnóstico.
              </p>
              <p className="text-sm text-zinc-400">
                O diagnóstico é liberado assim que o pagamento for confirmado pelo Mercado Pago. A confirmação pode
                levar alguns instantes após o pagamento.
              </p>
              <CheckoutButton enrollmentId={pendingEnrollment.id} />
            </div>
          ) : !enrollment ? (
            <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
              <p className="text-sm font-bold text-white">
                Você ainda não possui uma matrícula para este diagnóstico.
              </p>
              <p className="text-sm text-zinc-400">
                Inicie a compra abaixo. O diagnóstico é liberado automaticamente assim que o pagamento for
                confirmado pelo Mercado Pago.
              </p>
              <CheckoutButton label="Comprar diagnóstico" />
            </div>
          ) : !diagnosticRequest ? (
            <form
              action="/api/diagnosticos"
              method="POST"
              className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-5"
            >
              <input type="hidden" name="next" value="/mentoria/diagnostico" />
              <p className="text-sm font-bold text-white">
                Matrícula ativa confirmada. Envie o material do seu gameplay para iniciar o diagnóstico.
              </p>

              <label className="block space-y-2 text-sm text-zinc-300">
                <span className="font-medium">Link do gameplay *</span>
                <input
                  type="url"
                  name="gameplay_url"
                  required
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none transition focus:border-yellow-400"
                  placeholder="https://..."
                />
              </label>

              <label className="block space-y-2 text-sm text-zinc-300">
                <span className="font-medium">Título (opcional)</span>
                <input
                  type="text"
                  name="gameplay_title"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none transition focus:border-yellow-400"
                  placeholder="Ex.: Ranked - partida decisiva"
                />
              </label>

              <label className="block space-y-2 text-sm text-zinc-300">
                <span className="font-medium">Contexto/observações (opcional)</span>
                <textarea
                  name="context"
                  rows={4}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none transition focus:border-yellow-400"
                  placeholder="Conte um pouco sobre o que quer melhorar, dúvidas específicas, etc."
                />
              </label>

              <button
                type="submit"
                className="inline-flex rounded-xl bg-yellow-400 px-5 py-3 font-black text-black transition hover:bg-yellow-300"
              >
                Enviar diagnóstico
              </button>
            </form>
          ) : (
            <DiagnosticRequestPanel diagnosticRequest={diagnosticRequest} result={result} />
          )}
        </article>
      </div>
    </main>
  );
}

function DiagnosticRequestPanel({
  diagnosticRequest,
  result,
}: {
  diagnosticRequest: DiagnosticRequestRow;
  result: DiagnosticResult | null;
}) {
  const statusLabel = DIAGNOSTIC_STATUS_LABELS[diagnosticRequest.status] ?? diagnosticRequest.status;
  const canEdit = diagnosticRequest.status === "pending" || diagnosticRequest.status === "awaiting_info";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <div>
          <p className="text-xs text-zinc-500">Status do diagnóstico</p>
          <p className="mt-1 text-lg font-black text-white">{statusLabel}</p>
        </div>
        <span className="rounded-full border border-yellow-500/40 bg-yellow-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-yellow-300">
          {diagnosticRequest.status}
        </span>
      </div>

      {diagnosticRequest.status === "awaiting_info" ? (
        <div className="rounded-xl border border-yellow-500/50 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
          O mentor solicitou mais informações. Atualize os dados abaixo e envie novamente.
        </div>
      ) : null}

      {diagnosticRequest.status === "in_review" ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-300">
          Seu diagnóstico está em análise. Você será avisado assim que o resultado estiver disponível.
        </div>
      ) : null}

      {diagnosticRequest.status === "cancelled" ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-300">
          Este diagnóstico foi cancelado.
        </div>
      ) : null}

      {canEdit ? (
        <form
          action={`/api/diagnosticos/${diagnosticRequest.id}`}
          method="POST"
          className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-5"
        >
          <input type="hidden" name="next" value="/mentoria/diagnostico" />

          <label className="block space-y-2 text-sm text-zinc-300">
            <span className="font-medium">Link do gameplay *</span>
            <input
              type="url"
              name="gameplay_url"
              required
              defaultValue={diagnosticRequest.gameplay_url ?? ""}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none transition focus:border-yellow-400"
            />
          </label>

          <label className="block space-y-2 text-sm text-zinc-300">
            <span className="font-medium">Título (opcional)</span>
            <input
              type="text"
              name="gameplay_title"
              defaultValue={diagnosticRequest.gameplay_title ?? ""}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none transition focus:border-yellow-400"
            />
          </label>

          <label className="block space-y-2 text-sm text-zinc-300">
            <span className="font-medium">Contexto/observações (opcional)</span>
            <textarea
              name="context"
              rows={4}
              defaultValue={diagnosticRequest.context ?? ""}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none transition focus:border-yellow-400"
            />
          </label>

          <button
            type="submit"
            className="inline-flex rounded-xl bg-yellow-400 px-5 py-3 font-black text-black transition hover:bg-yellow-300"
          >
            Atualizar informações
          </button>
        </form>
      ) : (
        <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-5 text-sm text-zinc-300">
          <p>
            <span className="text-zinc-500">Link do gameplay:</span> {diagnosticRequest.gameplay_url ?? "—"}
          </p>
          {diagnosticRequest.gameplay_title ? (
            <p>
              <span className="text-zinc-500">Título:</span> {diagnosticRequest.gameplay_title}
            </p>
          ) : null}
          {diagnosticRequest.context ? (
            <p>
              <span className="text-zinc-500">Contexto:</span> {diagnosticRequest.context}
            </p>
          ) : null}
        </div>
      )}

      {diagnosticRequest.status === "completed" ? (
        <div className="space-y-4 rounded-2xl border border-yellow-500/30 bg-gradient-to-b from-yellow-500/5 to-zinc-950 p-5">
          <h3 className="text-lg font-black text-white">Resultado do diagnóstico</h3>
          {!result ? (
            <p className="text-sm text-zinc-400">O resultado ainda não está disponível.</p>
          ) : (
            <div className="space-y-4 text-sm text-zinc-200">
              {result.strengths?.length ? <ResultList title="Pontos fortes" items={result.strengths} /> : null}
              {result.main_errors?.length ? <ResultList title="Principais erros" items={result.main_errors} /> : null}
              {result.decision_making ? <ResultText title="Tomada de decisão" text={result.decision_making} /> : null}
              {result.positioning ? <ResultText title="Posicionamento" text={result.positioning} /> : null}
              {result.game_reading ? <ResultText title="Leitura de jogo" text={result.game_reading} /> : null}
              {result.exercises?.length ? <ResultList title="Exercícios recomendados" items={result.exercises} /> : null}
              {result.checklist?.length ? <ResultList title="Checklist de evolução" items={result.checklist} /> : null}
              {result.final_diagnostic ? <ResultText title="Conclusão" text={result.final_diagnostic} /> : null}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function ResultList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-yellow-300">{title}</p>
      <ul className="space-y-1">
        {items.map((item, index) => (
          <li key={index} className="flex gap-2">
            <span className="text-yellow-400">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ResultText({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <p className="mb-1 text-xs font-black uppercase tracking-[0.2em] text-yellow-300">{title}</p>
      <p className="leading-6 text-zinc-300">{text}</p>
    </div>
  );
}
