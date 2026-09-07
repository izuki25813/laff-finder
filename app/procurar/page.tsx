"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

const SHEET_ID = "1jmohWo0KBC_HDW7j47efTMoVhdUG0dFdE3_c7oG-zmE";
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;

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

  const formatWhatsAppLink = (phone: string) => {
    // Remove tudo que não é número
    const numbers = phone.replace(/\D/g, '');
    // Adiciona 55 se não tiver (código do Brasil)
    const fullNumber = numbers.startsWith('55') ? numbers : '55' + numbers;
    return `https://wa.me/${fullNumber}`;
  };

  const filteredPlayers = players.filter((p) => {
    const matchFuncao = filtroFuncao ? p.FuncaoPrincipal?.includes(filtroFuncao) : true;
    const matchPlataforma = filtroPlataforma ? p.Plataforma?.includes(filtroPlataforma) : true;
    return matchFuncao && matchPlataforma;
  });

  const roles = ["Rush 1", "Rush 2", "Granadeiro", "Suporte", "IGL (Capitão)"];

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

        {/*  FILTRO DE MATCH RÁPIDO */}
        <div className="mb-8">
          <h2 className="text-sm font-bold text-yellow-400 uppercase tracking-wider mb-3">🎯 O que você precisa no seu time?</h2>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setFiltroFuncao("")}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition ${filtroFuncao === "" ? "bg-yellow-400 text-black" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"}`}
            >
              Ver todos
            </button>
            {roles.map((role) => (
              <button 
                key={role}
                onClick={() => setFiltroFuncao(role)}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition ${filtroFuncao === role ? "bg-yellow-400 text-black" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"}`}
              >
                Preciso de {role}
              </button>
            ))}
          </div>
        </div>

        {/* FILTROS CLÁSSICOS */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-8 flex flex-col sm:flex-row gap-4">
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
              <div key={index} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-yellow-400/50 transition group flex flex-col">
                
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
                  <p className="text-sm text-zinc-400 italic mb-4 line-clamp-3 flex-grow">
                    "{player.Bio}"
                  </p>
                )}

                {/* BOTÃO WHATSAPP DIRETO */}
                <div className="border-t border-zinc-800 pt-4 mt-auto space-y-2">
                  <a 
                    href={formatWhatsAppLink(player.Contato)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg transition text-sm flex items-center justify-center gap-2"
                  >
                    <span>💬</span>
                    <span>Chamar no WhatsApp</span>
                  </a>
                  
                  {player.Gameplay && player.Gameplay !== "Sem link" && (
                    <a 
                      href={player.Gameplay} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 text-xs text-red-400 hover:text-red-300 transition py-1"
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