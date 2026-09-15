"use client";

import { useState } from "react";

type CheckoutApiResponse = { success: true; initPoint: string } | { success: false; message?: string };

export function CheckoutButton({ enrollmentId }: { enrollmentId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    if (loading) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/checkout/mercado-pago", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentId }),
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
        {loading ? "Redirecionando..." : "Pagar com Mercado Pago"}
      </button>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
    </div>
  );
}
