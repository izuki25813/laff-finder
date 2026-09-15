import { vi } from "vitest";

// Réplica mínima do "thenable" que o supabase-js retorna para uma query
// (PostgrestFilterBuilder): toda chamada encadeável (select/eq/in/order/
// limit/insert/update) devolve o próprio builder, e tanto `.then()`
// quanto `.maybeSingle()`/`.single()` resolvem para o mesmo resultado —
// assim o mock funciona tanto para `await admin.from(...).select(...)`
// (sem terminador) quanto para `...maybeSingle()`/`...single()`.
export type QueryResult<T> = { data: T; error: unknown };

export function makeQueryChain<T>(result: QueryResult<T>) {
  const chain: Record<string, unknown> = {};
  const chainable = ["select", "eq", "in", "order", "limit", "insert", "update"];

  for (const method of chainable) {
    chain[method] = vi.fn(() => chain);
  }

  chain.maybeSingle = vi.fn(() => Promise.resolve(result));
  chain.single = vi.fn(() => Promise.resolve(result));
  chain.then = (
    onFulfilled: (value: QueryResult<T>) => unknown,
    onRejected?: (reason: unknown) => unknown,
  ) => Promise.resolve(result).then(onFulfilled, onRejected);

  return chain;
}

// `admin.from` é chamado várias vezes em sequência dentro do checkout
// (busca de payment existente, insert, update). Esta fila devolve um
// builder por chamada, na ordem em que os testes esperam que aconteçam.
export function makeFromQueue(chains: unknown[]) {
  const queue = [...chains];
  return vi.fn(() => {
    const next = queue.shift();
    if (!next) {
      throw new Error("makeFromQueue: mais chamadas a .from() do que o esperado pelo teste.");
    }
    return next;
  });
}
