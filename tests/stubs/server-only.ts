// Stub para o marker package "server-only" dentro do ambiente Node do
// Vitest. O pacote real lança um erro incondicional na sua export
// "default" (usada fora da condition "react-server" do Next.js) — sem
// este alias, qualquer import de um módulo server-only quebraria os
// testes antes mesmo de rodar. Ver vitest.config.ts (resolve.alias).
export {};
