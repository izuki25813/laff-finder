"use client";

import { useState } from "react";

type EnsureEnrollmentResponse =
  | { success: true; enrollment: { id: string; status: string } }
  | { success: false; message?: string };

type CheckoutApiResponse = { success: true; initPoint: string } | { success: false; message?: string };

// Quando `enrollmentId` não é passado (aluno ainda sem nenhuma matrícula
// para o diagnóstico), o botão primeiro garante a matrícula pending via
// POST /api/mentoria/diagnostico/enrollment (Fase 10.7) e só então
// prossegue para o checkout existente — sem duplicar a lógica de
// payment, que continua inteiramente em /api/checkout/mercado-pago.
export function CheckoutButton({
  enrollmentId,
  label = "Pagar com Mercado Pago",
}: {
  enrollmentId?: string;
  label?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    if (loading) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      let resolvedEnrollmentId = enrollmentId;

      if (!resolvedEnrollmentId) {
        const ensureResponse = await fetch("/api/mentoria/diagnostico/enrollment", { method: "POST" });
        const ensureData = (await ensureResponse.json()) as EnsureEnrollmentResponse;

        if (!ensureResponse.ok || !ensureData.success) {
          setError(
            (!ensureData.success && ensureData.message) ||
              "Não foi possível iniciar a matrícula. Tente novamente.",
          );
          setLoading(false);
          return;
        }

        resolvedEnrollmentId = ensureData.enrollment.id;
      }

      const response = await fetch("/api/checkout/mercado-pago", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentId: resolvedEnrollmentId }),
      });

      const data = (await response.json()) as CheckoutApiResponse;

      if (!response.ok || !data.success) {
        setError(
          (!data.success && data.message) || "Não foi possível iniciar o pagamento. Tente novamente.",
        );
        setLoading(false);
        return;
      }

      window.location.href = data.initPoint;
    } catch {
      setError("Não foi possível iniciar o pagamento. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="inline-flex rounded-xl bg-yellow-400 px-5 py-3 font-black text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Redirecionando..." : label}
      </button>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
    </div>
  );
}
