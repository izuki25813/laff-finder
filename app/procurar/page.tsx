"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

// ✅ ID DA SUA PLANILHA
const SHEET_ID = "1jmohWo0KBC_HDW7j47efTMoVhdUG0dFdE3_c7oG-zmE";
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;

// Função robusta para ler CSV do Google Sheets
const parseCSV = (str: string) => {
  const arr: string[][] = [];
  let quote = false;
  let col = 0, row = 0;
  for (let c = 0; c < str.length; c++) {
    let cc = str[c], nc = str[c + 1];
    arr[row] = arr[row] || [];
    arr[row][col] = arr[row][col] || "";
    if (cc === '"' && quote && nc === '"') { arr[row][col] += cc; ++c; continue; }
    if (cc === '"') { quote = !quote; continue; }
    if (cc === "," && !quote) { ++col; continue; }
    if (cc === "\r" && nc === "\n" && !quote) { ++row; col = 0; ++c; continue; }
    if (cc === "\n" && !quote) { ++row; col = 0; continue; }
    if (cc === "\r" && !quote) { ++row; col = 0; continue; }
    arr[row][col] += cc;
  }
  return arr;
};

export default function ProcurarPage() {
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroFuncao, setFiltroFuncao] = useState("");
  const [filtroPlataforma, setFiltroPlataforma] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(CSV_URL);
        const text = await response.text();
        const rows = parseCSV(text);
        
        const headers = rows[0];
        const data = [];

        for (let i = 1; i < rows.length; i++) {
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = rows[i][index] || "";
          });
          if (obj.Nick && obj.Nick.trim() !== "") {
            data.push(obj);
          }
        }
        setPlayers(data.reverse());
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredPlayers = players.filter((p) => {
    const matchFuncao = filtroFuncao ? p.FuncaoPrincipal?.includes(filtroFuncao) : true;
    const matchPlataforma = filtroPlataforma ? p.Plataforma?.includes(filtroPlataforma) : true;
    return matchFuncao && matchPlataforma;
  });

  return (
    <main className="min-h-screen bg-black text-white p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <Link href="/" className="text-yellow-400 hover:underline mb-8 inline-block font-bold">
          ← Voltar para o início
        </Link>

        <h1 className="text-4xl font-black mb-2 text-white">🔎 Procurar Jogadores</h1>
        <p className="text-zinc-400 mb-8">
          Encontre o player ideal para completar sua line na LAFF.
        </p>

        {/* FILTROS */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-8 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-xs font-bold text-zinc-500 mb-1 uppercase">Filtrar por Função</label>
            <select 
              value={filtroFuncao} 
              onChange={(e) => setFiltroFuncao(e.target.value)}
              className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white focus:border-yellow-400 outline-none"
            >
              <option value="">Todas as funções</option>
              <option> Rush 1</option>
              <option>🟢 Rush 2</option>
              <option>🔵 Granadeiro</option>
              <option>🟡 Suporte</option>
              <option>🟣 IGL (Capitão)</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-bold text-zinc-500 mb-1 uppercase">Filtrar por Plataforma</label>
            <select 
              value={filtroPlataforma} 
              onChange={(e) => setFiltroPlataforma(e.target.value)}
              className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white focus:border-yellow-400 outline-none"
            >
              <option value="">Todas as plataformas</option>
              <option>📱 Mobile</option>
              <option>🖥️ Emulador</option>
              <option>🎮 Mobilador</option>
            </select>
          </div>
        </div>

        {/* LISTA DE JOGADORES */}
        {loading ? (
          <div className="text-center py-20 text-zinc-500">
            <div className="text-4xl mb-4 animate-pulse">⏳</div>
            <p>Carregando o banco de talentos...</p>
          </div>
        ) : filteredPlayers.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">
            <div className="text-4xl mb-4">😕</div>
            <p>Nenhum jogador encontrado com esses filtros.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPlayers.map((player, index) => (
              <div key={index} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-yellow-400/50 transition group">
                
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-xl font-black text-white group-hover:text-yellow-400 transition">
                      {player.Nick}
                    </h3>
                    <p className="text-xs text-zinc-500">ID: {player.ID}</p>
                  </div>
                  {player.PerfilCompleto?.includes("Sim") && (
                    <span className="bg-yellow-400/10 text-yellow-400 text-xs font-bold px-2 py-1 rounded-md border border-yellow-400/20">
                      ⭐ Completo
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="bg-zinc-800 text-zinc-300 text-xs font-bold px-2 py-1 rounded">
                    {player.FuncaoPrincipal || "Sem função"}
                  </span>
                  <span className="bg-zinc-800 text-zinc-300 text-xs font-bold px-2 py-1 rounded">
                    {player.Plataforma || "Sem plataforma"}
                  </span>
                  <span className="bg-zinc-800 text-zinc-300 text-xs font-bold px-2 py-1 rounded">
                    {player.Nivel || "Nível não inf."}
                  </span>
                </div>

                {player.Bio && player.Bio !== "Sem bio" && (
                  <p className="text-sm text-zinc-400 italic mb-4 line-clamp-3">
                    "{player.Bio}"
                  </p>
                )}

                <div className="border-t border-zinc-800 pt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-zinc-300">
                    <span>💬</span> 
                    <span className="truncate">{player.Contato || "Sem contato"}</span>
                  </div>
                  {player.Gameplay && player.Gameplay !== "Sem link" && (
                    <a 
                      href={player.Gameplay} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition"
                    >
                      <span>▶️</span> Ver Gameplay
                    </a>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}

        <p className="text-center text-zinc-600 text-xs mt-12 pb-6">
          by Izuuki.x — LAFF Finder
        </p>
      </div>
    </main>
  );
}