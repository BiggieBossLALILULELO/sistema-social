import { useState, useEffect, useRef } from "react";
import db from "./db";

// ── Banco de dados ────────────────────────────────────────────────
async function sGet(key) {
  try { const r = await db.kv.get(key); return r ? r.value : null; } catch { return null; }
}
async function sSet(key, val) {
  try { await db.kv.put({ key, value: val }); } catch (e) { console.error(e); }
}

// ── Utilitários ───────────────────────────────────────────────────
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function fDate(iso) { return iso ? new Date(iso).toLocaleDateString("pt-BR") : "—"; }
function fCur(v) { return "R$ " + Number(v || 0).toFixed(2).replace(".", ","); }
function nowYM() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; }
function ymLabel(ym) { const [y, m] = ym.split("-"); return `${MESES[Number(m) - 1]} ${y}`; }

const CATEGORIAS = ["Alimento", "Roupa", "Higiene", "Medicamento", "Brinquedo", "Móvel", "Outro"];
const BAIRROS = ["Afogados", "Boa Viagem", "Boa Vista", "Brasília Teimosa", "Cajueiro Seco", "Casa Amarela", "Casa Forte", "Cordeiro", "Derby", "Encruzilhada", "Espinheiro", "Graças", "Ibura", "Imbiribeira", "Iputinga", "Jardim São Paulo", "Madalena", "Mustardinha", "Pina", "Recife (Bairro)", "Santo Amaro", "Santo Antônio", "Sancho", "Torrões", "Várzea", "Outro"];
const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

// ── CSS Global injetado ───────────────────────────────────────────
const globalCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --primary: #16784A;
    --primary-dark: #0F5535;
    --primary-light: #E8F5EE;
    --primary-mid: #21A066;
    --accent: #E05C2A;
    --accent-light: #FDF0EA;
    --bg: #F4F2ED;
    --card: #FFFFFF;
    --text: #18181B;
    --muted: #71717A;
    --border: #E4E4E7;
    --danger: #DC2626;
    --danger-light: #FEF2F2;
    --warning: #D97706;
    --warning-light: #FFFBEB;
    --info: #2563EB;
    --info-light: #EFF6FF;
    --purple: #7C3AED;
    --purple-light: #F5F3FF;
    --shadow-sm: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
    --shadow: 0 4px 12px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.04);
    --shadow-lg: 0 10px 30px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.05);
    --radius: 14px;
    --radius-sm: 8px;
    --radius-xs: 6px;
    --font: 'Plus Jakarta Sans', 'Segoe UI', sans-serif;
  }

  body {
    font-family: var(--font);
    background: var(--bg);
    color: var(--text);
    -webkit-font-smoothing: antialiased;
  }

  input, select, textarea, button { font-family: var(--font); }

  /* ── Layout ── */
  .app-container { max-width: 960px; margin: 0 auto; padding: 0 20px; }
  .page-content { padding: 24px 0 100px; }

  /* ── Header ── */
  .app-header {
    background: linear-gradient(135deg, var(--primary-dark) 0%, var(--primary) 60%, var(--primary-mid) 100%);
    padding: 0 20px;
    position: sticky; top: 0; z-index: 100;
    box-shadow: 0 2px 12px rgba(0,0,0,0.15);
  }
  .header-inner {
    max-width: 960px; margin: 0 auto;
    display: flex; align-items: center; gap: 14px;
    padding: 14px 0;
  }
  .header-logo {
    width: 42px; height: 42px; border-radius: 12px;
    background: rgba(255,255,255,0.18);
    display: flex; align-items: center; justify-content: center;
    font-size: 22px; flex-shrink: 0;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  }
  .header-title { font-size: 17px; font-weight: 800; color: #fff; letter-spacing: -0.02em; }
  .header-sub { font-size: 11px; color: rgba(255,255,255,0.65); margin-top: 2px; }
  .header-stats { margin-left: auto; display: flex; gap: 8px; }
  .header-stat {
    background: rgba(255,255,255,0.14);
    border-radius: 10px; padding: 7px 14px; text-align: center;
    backdrop-filter: blur(4px);
  }
  .header-stat-val { font-size: 18px; font-weight: 800; color: #fff; line-height: 1; }
  .header-stat-label { font-size: 10px; color: rgba(255,255,255,0.7); margin-top: 2px; }

  /* ── Desktop nav (top tabs) ── */
  .desktop-nav {
    background: var(--card);
    border-bottom: 1px solid var(--border);
    box-shadow: var(--shadow-sm);
    display: flex;
  }
  .desktop-nav-inner { max-width: 960px; margin: 0 auto; display: flex; padding: 0 20px; }
  .nav-btn {
    padding: 15px 20px; border: none; background: none; cursor: pointer;
    font-family: var(--font); font-weight: 700; font-size: 13.5px;
    color: var(--muted); border-bottom: 3px solid transparent;
    transition: all 0.18s; white-space: nowrap; display: flex; align-items: center; gap: 7px;
  }
  .nav-btn.active { color: var(--primary); border-bottom-color: var(--primary); }
  .nav-btn:hover:not(.active) { color: var(--text); background: var(--bg); }

  /* ── Mobile bottom nav ── */
  .mobile-nav {
    display: none;
    position: fixed; bottom: 0; left: 0; right: 0; z-index: 100;
    background: var(--card);
    border-top: 1px solid var(--border);
    box-shadow: 0 -4px 20px rgba(0,0,0,0.08);
    padding-bottom: env(safe-area-inset-bottom);
  }
  .mobile-nav-inner { display: flex; }
  .mobile-nav-btn {
    flex: 1; border: none; background: none; cursor: pointer;
    font-family: var(--font); font-weight: 600; font-size: 10px;
    color: var(--muted); padding: 10px 4px 12px;
    display: flex; flex-direction: column; align-items: center; gap: 4px;
    transition: all 0.15s;
  }
  .mobile-nav-btn.active { color: var(--primary); }
  .mobile-nav-btn .nav-icon { font-size: 22px; line-height: 1; }
  .mobile-nav-btn .nav-dot {
    width: 4px; height: 4px; border-radius: 99px;
    background: var(--primary); opacity: 0;
    transition: opacity 0.15s;
  }
  .mobile-nav-btn.active .nav-dot { opacity: 1; }

  @media (max-width: 640px) {
    .desktop-nav { display: none; }
    .mobile-nav { display: block; }
    .app-container { padding: 0 14px; }
    .page-content { padding: 18px 0 90px; }
    .header-title { font-size: 15px; }
    .header-stat { padding: 6px 10px; }
    .header-stat-val { font-size: 16px; }
  }

  /* ── Cards ── */
  .card {
    background: var(--card); border-radius: var(--radius);
    border: 1px solid var(--border); padding: 18px 20px;
    box-shadow: var(--shadow-sm); transition: box-shadow 0.18s;
  }
  .card.clickable { cursor: pointer; }
  .card.clickable:hover { box-shadow: var(--shadow); transform: translateY(-1px); }
  .card.clickable:active { transform: translateY(0); }

  /* ── Formulários ── */
  .field { display: flex; flex-direction: column; gap: 6px; }
  .field-label {
    font-size: 11.5px; font-weight: 700; color: var(--muted);
    text-transform: uppercase; letter-spacing: 0.06em;
  }
  .field-input {
    padding: 10px 14px; border-radius: var(--radius-sm);
    border: 1.5px solid var(--border); font-size: 14px;
    background: var(--card); color: var(--text);
    outline: none; transition: border-color 0.15s, box-shadow 0.15s;
    width: 100%;
  }
  .field-input:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(22,120,74,0.12);
  }
  textarea.field-input { resize: vertical; min-height: 80px; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }
  .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }

  @media (max-width: 640px) {
    .grid-2 { grid-template-columns: 1fr; }
    .grid-3 { grid-template-columns: 1fr; }
    .grid-4 { grid-template-columns: 1fr 1fr; }
  }

  /* ── Botões ── */
  .btn {
    display: inline-flex; align-items: center; gap: 7px;
    border-radius: var(--radius-sm); border: none; cursor: pointer;
    font-family: var(--font); font-weight: 700; transition: all 0.15s;
    white-space: nowrap;
  }
  .btn-md { padding: 10px 20px; font-size: 14px; }
  .btn-sm { padding: 7px 14px; font-size: 13px; }
  .btn-primary { background: var(--primary); color: #fff; box-shadow: 0 2px 8px rgba(22,120,74,0.25); }
  .btn-primary:hover { background: var(--primary-dark); box-shadow: 0 4px 14px rgba(22,120,74,0.35); }
  .btn-accent { background: var(--accent); color: #fff; box-shadow: 0 2px 8px rgba(224,92,42,0.25); }
  .btn-accent:hover { background: #c04e22; }
  .btn-ghost { background: transparent; color: var(--muted); border: 1.5px solid var(--border); }
  .btn-ghost:hover { background: var(--bg); color: var(--text); }
  .btn-danger { background: var(--danger); color: #fff; }
  .btn-danger:hover { background: #b91c1c; }
  .btn-info { background: var(--info); color: #fff; }
  .btn-purple { background: var(--purple); color: #fff; box-shadow: 0 2px 8px rgba(124,58,237,0.25); }
  .btn-purple:hover { background: #6d28d9; }
  .btn-full { width: 100%; justify-content: center; }

  /* ── Badges ── */
  .badge {
    display: inline-block; font-size: 11px; font-weight: 700;
    padding: 3px 10px; border-radius: 99px; white-space: nowrap; letter-spacing: 0.02em;
  }
  .badge-primary { background: var(--primary-light); color: var(--primary); }
  .badge-accent { background: var(--accent-light); color: var(--accent); }
  .badge-danger { background: var(--danger-light); color: var(--danger); }
  .badge-warning { background: var(--warning-light); color: var(--warning); }
  .badge-muted { background: var(--bg); color: var(--muted); }
  .badge-purple { background: var(--purple-light); color: var(--purple); }
  .badge-info { background: var(--info-light); color: var(--info); }

  /* ── Stat boxes ── */
  .stat-row { display: flex; gap: 12px; flex-wrap: wrap; }
  .stat-box {
    background: var(--card); border-radius: var(--radius-sm);
    border: 1px solid var(--border); padding: 14px 18px;
    flex: 1; min-width: 80px; box-shadow: var(--shadow-sm);
  }
  .stat-label { font-size: 11px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; }
  .stat-value { font-size: 26px; font-weight: 800; line-height: 1.2; margin-top: 4px; }

  /* ── Alert ── */
  .alert {
    border-radius: var(--radius-sm); padding: 12px 16px;
    display: flex; align-items: flex-start; gap: 10px; margin-bottom: 16px;
  }
  .alert-danger { background: var(--danger-light); border: 1px solid #fecaca; }
  .alert-warning { background: var(--warning-light); border: 1px solid #fde68a; }

  /* ── Progress ── */
  .progress-bar {
    background: var(--bg); border-radius: 99px; height: 8px; overflow: hidden;
  }
  .progress-fill {
    height: 100%; border-radius: 99px; transition: width 0.5s ease;
  }

  /* ── Empty state ── */
  .empty-state {
    text-align: center; padding: 56px 20px; color: var(--muted);
  }
  .empty-icon { font-size: 48px; margin-bottom: 14px; opacity: 0.6; }
  .empty-text { font-size: 14px; line-height: 1.6; }

  /* ── Tabs (dentro de módulo) ── */
  .inner-tabs {
    display: flex; gap: 4px; background: var(--bg);
    padding: 5px; border-radius: var(--radius-sm);
    flex-wrap: wrap; margin-bottom: 20px;
  }
  .inner-tab {
    padding: 8px 14px; border-radius: 7px; border: none; cursor: pointer;
    font-family: var(--font); font-weight: 700; font-size: 13px;
    background: transparent; color: var(--muted); transition: all 0.15s;
  }
  .inner-tab.active { background: var(--primary); color: #fff; box-shadow: 0 2px 8px rgba(22,120,74,0.2); }

  /* ── Section title ── */
  .section-title { font-size: 12px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 12px; }

  /* ── Separador ── */
  .divider { border: none; border-top: 1px solid var(--border); margin: 18px 0; }

  /* ── Back bar ── */
  .back-bar { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
  .back-bar h2 { font-size: 20px; font-weight: 800; letter-spacing: -0.02em; }

  /* ── Busca ── */
  .search-row { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
  .search-input {
    flex: 1; min-width: 200px; padding: 10px 16px;
    border-radius: var(--radius-sm); border: 1.5px solid var(--border);
    font-size: 14px; font-family: var(--font);
    background: var(--card); color: var(--text); outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
    box-shadow: var(--shadow-sm);
  }
  .search-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(22,120,74,0.1); }

  /* ── Filter pills ── */
  .filter-pill {
    padding: 5px 14px; border-radius: 99px;
    border: 1.5px solid var(--border); background: transparent;
    color: var(--muted); cursor: pointer; font-family: var(--font);
    font-size: 12px; font-weight: 700; transition: all 0.15s;
  }
  .filter-pill.active { background: var(--primary); color: #fff; border-color: var(--primary); }

  /* ── Item tag ── */
  .item-tag {
    font-size: 12px; background: var(--primary-light); color: var(--primary);
    padding: 3px 12px; border-radius: 99px; font-weight: 600; display: inline-block;
  }

  /* ── Autocomplete list ── */
  .autocomplete-list {
    border: 1.5px solid var(--border); border-radius: var(--radius-sm);
    overflow: hidden; box-shadow: var(--shadow);
    background: var(--card); margin-top: -6px;
  }
  .autocomplete-item {
    padding: 11px 16px; cursor: pointer;
    border-bottom: 1px solid var(--border); transition: background 0.1s;
  }
  .autocomplete-item:last-child { border-bottom: none; }
  .autocomplete-item:hover { background: var(--bg); }

  /* ── Beneficiário card ── */
  .ben-card-name { font-weight: 700; font-size: 15px; margin-bottom: 3px; }
  .ben-card-meta { font-size: 13px; color: var(--muted); }
  .ben-card-needs {
    margin-top: 10px; font-size: 13px; color: var(--muted);
    background: var(--bg); padding: 8px 12px; border-radius: var(--radius-xs);
    border-left: 3px solid var(--primary-light);
  }

  /* ── Movimentação ── */
  .mov-icon {
    width: 40px; height: 40px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; flex-shrink: 0;
  }

  /* ── Summary banner ── */
  .summary-banner {
    background: linear-gradient(135deg, var(--primary-dark), var(--primary-mid));
    border-radius: var(--radius); padding: 22px 24px;
    color: #fff; margin-bottom: 24px; box-shadow: var(--shadow);
  }

  /* ── Relatório card ── */
  .rel-card {
    display: flex; justify-content: space-between; align-items: center;
    gap: 12px; flex-wrap: wrap;
  }

  /* ── Scrollbar ── */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #d4d4d8; border-radius: 99px; }
`;

// ── Componentes base ──────────────────────────────────────────────

function Inp({ label, style: s, ...p }) {
  return (
    <div className="field">
      {label && <span className="field-label">{label}</span>}
      <input className="field-input" style={s} {...p} />
    </div>
  );
}
function Sel({ label, children, ...p }) {
  return (
    <div className="field">
      {label && <span className="field-label">{label}</span>}
      <select className="field-input" {...p}>{children}</select>
    </div>
  );
}
function Txta({ label, ...p }) {
  return (
    <div className="field">
      {label && <span className="field-label">{label}</span>}
      <textarea className="field-input" {...p} />
    </div>
  );
}

function Btn({ children, variant = "primary", size = "md", full, onClick, type = "button", style: s }) {
  return (
    <button type={type} onClick={onClick}
      className={`btn btn-${size} btn-${variant}${full ? " btn-full" : ""}`}
      style={s}>
      {children}
    </button>
  );
}

function Badge({ children, color = "primary" }) {
  return <span className={`badge badge-${color}`}>{children}</span>;
}

function StatBox({ label, value, color = "var(--primary)" }) {
  return (
    <div className="stat-box">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ color }}>{value}</div>
    </div>
  );
}

function Card({ children, style: s, onClick }) {
  return (
    <div className={`card${onClick ? " clickable" : ""}`} style={s} onClick={onClick}>
      {children}
    </div>
  );
}

function Empty({ icon, text }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <div className="empty-text">{text}</div>
    </div>
  );
}

function Progress({ value, max }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const col = pct >= 100 ? "var(--primary)" : pct >= 60 ? "var(--primary-mid)" : pct >= 30 ? "var(--warning)" : "var(--danger)";
  return (
    <div className="progress-bar">
      <div className="progress-fill" style={{ width: `${pct}%`, background: col }} />
    </div>
  );
}

function InnerTabs({ tabs, active, onChange }) {
  return (
    <div className="inner-tabs">
      {tabs.map(([k, l]) => (
        <button key={k} className={`inner-tab${active === k ? " active" : ""}`} onClick={() => onChange(k)}>{l}</button>
      ))}
    </div>
  );
}

// ── Gerador de relatório ──────────────────────────────────────────
function gerarRelatorio(tipo, dados) {
  const { beneficiarios = [], atendimentos = [], movs = [] } = dados;
  const now = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  const th = `background:#16784A;color:#fff;padding:10px 14px;text-align:left;font-size:13px;font-weight:600`;
  const td = `padding:10px 14px;border-bottom:1px solid #f0f0f0;font-size:13px;vertical-align:top`;
  let body = "";
  if (tipo === "beneficiarios") {
    body = `<h2 style="margin:0 0 16px;font-size:18px">Beneficiários cadastrados (${beneficiarios.length})</h2>
      <table width="100%" cellspacing="0" style="border-collapse:collapse;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb">
        <tr><th style="${th}">Nome</th><th style="${th}">Bairro</th><th style="${th}">Pessoas</th><th style="${th}">Renda</th><th style="${th}">Necessidades</th><th style="${th}">Cadastro</th></tr>
        ${beneficiarios.map((b, i) => `<tr style="background:${i % 2 ? "#f9fafb" : "#fff"}"><td style="${td}">${b.nome}</td><td style="${td}">${b.bairro || "—"}</td><td style="${td}">${b.numPessoas || "—"}</td><td style="${td}">${b.renda ? fCur(b.renda) : "—"}</td><td style="${td}">${b.necessidades || "—"}</td><td style="${td}">${fDate(b.dataRegistro)}</td></tr>`).join("")}
      </table>`;
  } else if (tipo === "atendimentos") {
    body = `<h2 style="margin:0 0 16px;font-size:18px">Registro de atendimentos (${atendimentos.length})</h2>
      <table width="100%" cellspacing="0" style="border-collapse:collapse;border:1px solid #e5e7eb">
        <tr><th style="${th}">Data</th><th style="${th}">Beneficiário</th><th style="${th}">Itens distribuídos</th><th style="${th}">Voluntário</th></tr>
        ${atendimentos.map((a, i) => `<tr style="background:${i % 2 ? "#f9fafb" : "#fff"}"><td style="${td}">${fDate(a.data)}</td><td style="${td}">${a.beneficiarioNome || "—"}</td><td style="${td}">${(a.itens || []).map(x => `${x.quantidade} ${x.unidade} de ${x.itemNome}`).join(", ") || "—"}</td><td style="${td}">${a.voluntario || "—"}</td></tr>`).join("")}
      </table>`;
  } else {
    const ent = movs.filter(m => m.tipo === "entrada").reduce((s, m) => s + m.quantidade, 0);
    const sai = movs.filter(m => m.tipo === "saida").reduce((s, m) => s + m.quantidade, 0);
    body = `<h2 style="margin:0 0 8px;font-size:18px">Histórico de doações (${movs.length} registros)</h2>
      <p style="margin:0 0 16px;color:#666">Total de entradas: <strong>${ent}</strong> · Total de saídas: <strong>${sai}</strong></p>
      <table width="100%" cellspacing="0" style="border-collapse:collapse;border:1px solid #e5e7eb">
        <tr><th style="${th}">Data</th><th style="${th}">Tipo</th><th style="${th}">Item</th><th style="${th}">Qtd</th><th style="${th}">Origem / Destino</th></tr>
        ${movs.map((m, i) => `<tr style="background:${i % 2 ? "#f9fafb" : "#fff"}"><td style="${td}">${fDate(m.data)}</td><td style="${td};color:${m.tipo === "entrada" ? "#16784A" : "#E05C2A"};font-weight:700">${m.tipo === "entrada" ? "⬇ Entrada" : "⬆ Saída"}</td><td style="${td}">${m.itemNome}</td><td style="${td}">${m.quantidade} ${m.unidade}</td><td style="${td}">${m.tipo === "entrada" ? (m.doador || "anônimo") : (m.beneficiario || "geral")}</td></tr>`).join("")}
      </table>`;
  }
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Relatório · Sistema Social Recife</title>
    <style>body{font-family:Georgia,serif;max-width:900px;margin:0 auto;padding:40px 32px;color:#111}@media print{.no-print{display:none}}</style></head>
    <body>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:28px;padding-bottom:20px;border-bottom:3px solid #16784A">
        <div><h1 style="margin:0;color:#16784A;font-size:24px;font-weight:800">🤝 Sistema Social · Recife</h1><p style="margin:6px 0 0;font-size:13px;color:#666">Relatório gerado em ${now}</p></div>
        <button class="no-print" onclick="window.print()" style="background:#16784A;color:#fff;border:none;padding:12px 24px;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600">🖨 Imprimir / Salvar PDF</button>
      </div>
      ${body}
    </body></html>`;
  const w = window.open("", "_blank");
  if (w) { w.document.write(html); w.document.close(); }
}

// ══════════════════════════════════════════════════════════════════
// BENEFICIÁRIOS
// ══════════════════════════════════════════════════════════════════
function BeneficiariosModule({ beneficiarios, setBeneficiarios, atendimentos }) {
  const [view, setView] = useState("list");
  const [sel, setSel] = useState(null);
  const [search, setSearch] = useState("");
  const EF = { nome: "", cpf: "", telefone: "", endereco: "", bairro: "", numPessoas: "", renda: "", necessidades: "", observacoes: "" };
  const [form, setForm] = useState(EF);
  const f = k => e => setForm({ ...form, [k]: e.target.value });

  const save = async d => { await sSet("beneficiarios", d); setBeneficiarios(d); };
  const submit = async () => {
    if (!form.nome.trim()) return alert("Nome é obrigatório.");
    await save([...beneficiarios, { ...form, id: uid(), dataRegistro: new Date().toISOString() }]);
    setForm(EF); setView("list");
  };
  const del = async id => {
    if (!confirm("Remover beneficiário?")) return;
    await save(beneficiarios.filter(i => i.id !== id));
    setView("list"); setSel(null);
  };

  const filtered = beneficiarios.filter(b =>
    b.nome.toLowerCase().includes(search.toLowerCase()) ||
    (b.bairro || "").toLowerCase().includes(search.toLowerCase()) ||
    (b.cpf || "").includes(search)
  );

  if (view === "form") return (
    <div>
      <div className="back-bar">
        <Btn variant="ghost" size="sm" onClick={() => setView("list")}>← Voltar</Btn>
        <h2>Novo beneficiário</h2>
      </div>
      <Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="grid-2">
            <Inp label="Nome completo *" value={form.nome} onChange={f("nome")} placeholder="Maria da Silva" />
            <Inp label="CPF" value={form.cpf} onChange={f("cpf")} placeholder="000.000.000-00" />
          </div>
          <div className="grid-2">
            <Inp label="Telefone / WhatsApp" value={form.telefone} onChange={f("telefone")} placeholder="(81) 9 0000-0000" />
            <Sel label="Bairro" value={form.bairro} onChange={f("bairro")}>
              <option value="">Selecione o bairro</option>
              {BAIRROS.map(b => <option key={b}>{b}</option>)}
            </Sel>
          </div>
          <Inp label="Endereço" value={form.endereco} onChange={f("endereco")} placeholder="Rua, número, complemento" />
          <div className="grid-2">
            <Inp label="Nº de pessoas na família" type="number" min="1" value={form.numPessoas} onChange={f("numPessoas")} placeholder="4" />
            <Inp label="Renda familiar (R$)" type="number" min="0" value={form.renda} onChange={f("renda")} placeholder="800" />
          </div>
          <Txta label="Necessidades" value={form.necessidades} onChange={f("necessidades")} placeholder="Ex: cesta básica, fraldas, medicamento..." />
          <Txta label="Observações" value={form.observacoes} onChange={f("observacoes")} placeholder="Informações adicionais..." />
          <hr className="divider" />
          <div style={{ display: "flex", gap: 10 }}>
            <Btn onClick={submit}>💾 Salvar cadastro</Btn>
            <Btn variant="ghost" onClick={() => setView("list")}>Cancelar</Btn>
          </div>
        </div>
      </Card>
    </div>
  );

  if (view === "detail" && sel) {
    const b = sel;
    const hists = atendimentos.filter(a => a.beneficiarioId === b.id);
    return (
      <div>
        <div className="back-bar">
          <Btn variant="ghost" size="sm" onClick={() => setView("list")}>← Voltar</Btn>
          <h2>Ficha do beneficiário</h2>
        </div>
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
            <div>
              <h3 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>{b.nome}</h3>
              <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>Cadastrado em {fDate(b.dataRegistro)}</p>
            </div>
            <Badge color="primary">Ativo</Badge>
          </div>
          <div className="grid-2" style={{ marginBottom: 14 }}>
            {b.cpf && <div><p className="field-label">CPF</p><p style={{ fontSize: 14, marginTop: 4 }}>{b.cpf}</p></div>}
            {b.telefone && <div><p className="field-label">Telefone</p><p style={{ fontSize: 14, marginTop: 4 }}>{b.telefone}</p></div>}
            {b.bairro && <div><p className="field-label">Bairro</p><p style={{ fontSize: 14, marginTop: 4 }}>{b.bairro}</p></div>}
            {b.endereco && <div><p className="field-label">Endereço</p><p style={{ fontSize: 14, marginTop: 4 }}>{b.endereco}</p></div>}
            {b.numPessoas && <div><p className="field-label">Pessoas na família</p><p style={{ fontSize: 14, marginTop: 4 }}>{b.numPessoas}</p></div>}
            {b.renda && <div><p className="field-label">Renda familiar</p><p style={{ fontSize: 14, marginTop: 4 }}>{fCur(b.renda)}</p></div>}
          </div>
          {b.necessidades && <div style={{ marginBottom: 12 }}>
            <p className="field-label" style={{ marginBottom: 6 }}>Necessidades</p>
            <p style={{ fontSize: 14, background: "var(--bg)", padding: "10px 14px", borderRadius: 8, borderLeft: "3px solid var(--primary)" }}>{b.necessidades}</p>
          </div>}
          {b.observacoes && <div>
            <p className="field-label" style={{ marginBottom: 6 }}>Observações</p>
            <p style={{ fontSize: 14, background: "var(--bg)", padding: "10px 14px", borderRadius: 8 }}>{b.observacoes}</p>
          </div>}
          <hr className="divider" />
          <Btn variant="danger" size="sm" onClick={() => del(b.id)}>🗑 Remover cadastro</Btn>
        </Card>

        <p style={{ fontSize: 16, fontWeight: 800, marginBottom: 14 }}>📋 Histórico de atendimentos ({hists.length})</p>
        {hists.length === 0
          ? <p style={{ fontSize: 14, color: "var(--muted)" }}>Nenhum atendimento registrado para este beneficiário.</p>
          : hists.map(a => (
            <Card key={a.id} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>📅 {fDate(a.data)}</span>
                {a.voluntario && <Badge color="muted">👤 {a.voluntario}</Badge>}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {(a.itens || []).map((it, i) => <span key={i} className="item-tag">{it.quantidade} {it.unidade} de {it.itemNome}</span>)}
              </div>
              {a.observacoes && <p style={{ marginTop: 10, fontSize: 13, color: "var(--muted)", background: "var(--bg)", padding: "7px 12px", borderRadius: 6 }}>{a.observacoes}</p>}
            </Card>
          ))}
      </div>
    );
  }

  return (
    <div>
      <div className="search-row">
        <input className="search-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍  Buscar por nome, bairro ou CPF..." />
        <Btn onClick={() => setView("form")}>+ Novo cadastro</Btn>
      </div>

      <div className="stat-row" style={{ marginBottom: 20 }}>
        <StatBox label="Famílias cadastradas" value={beneficiarios.length} />
        <StatBox label="Bairros" value={[...new Set(beneficiarios.map(b => b.bairro).filter(Boolean))].length} color="var(--accent)" />
        <StatBox label="Pessoas atendidas" value={beneficiarios.reduce((s, b) => s + (Number(b.numPessoas) || 0), 0)} color="var(--primary-mid)" />
        <StatBox label="Atendimentos" value={atendimentos.length} color="var(--purple)" />
      </div>

      {filtered.length === 0
        ? <Empty icon="👥" text={beneficiarios.length === 0 ? "Nenhum beneficiário cadastrado.\nClique em '+ Novo cadastro' para começar." : "Nenhum resultado encontrado."} />
        : filtered.map(b => (
          <Card key={b.id} style={{ marginBottom: 12 }} onClick={() => { setSel(b); setView("detail"); }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <p className="ben-card-name">{b.nome}</p>
                <p className="ben-card-meta">
                  {[b.bairro, b.numPessoas && `${b.numPessoas} pessoas`, b.renda && fCur(b.renda)].filter(Boolean).join("  ·  ")}
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, marginLeft: 12 }}>
                <Badge color="primary">Ativo</Badge>
                <span style={{ fontSize: 11, color: "var(--muted)" }}>{fDate(b.dataRegistro)}</span>
              </div>
            </div>
            {b.necessidades && <p className="ben-card-needs">📋 {b.necessidades.slice(0, 90)}{b.necessidades.length > 90 ? "..." : ""}</p>}
          </Card>
        ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// DOAÇÕES & ESTOQUE
// ══════════════════════════════════════════════════════════════════
function DoacoesModule({ estoque, setEstoque, movs, setMovs, metas, setMetas }) {
  const [tab, setTab] = useState("estoque");
  const EE = { itemNome: "", categoria: "Alimento", quantidade: "", unidade: "unidade", doador: "", observacao: "" };
  const ES = { itemId: "", quantidade: "", beneficiario: "", observacao: "" };
  const EM = { itemNome: "", categoria: "Alimento", meta: "", unidade: "unidade", mesAno: nowYM() };
  const [fEnt, setFEnt] = useState(EE);
  const [fSai, setFSai] = useState(ES);
  const [fMeta, setFMeta] = useState(EM);

  const saveE = async d => { await sSet("estoque", d); setEstoque(d); };
  const saveM = async d => { await sSet("movimentacoes", d); setMovs(d); };
  const saveMt = async d => { await sSet("metas", d); setMetas(d); };

  const regEntrada = async () => {
    if (!fEnt.itemNome.trim() || !fEnt.quantidade) return alert("Preencha nome e quantidade.");
    const qtd = Number(fEnt.quantidade);
    const idx = estoque.findIndex(i => i.nome.toLowerCase() === fEnt.itemNome.toLowerCase() && i.categoria === fEnt.categoria);
    const ne = [...estoque];
    if (idx >= 0) ne[idx] = { ...ne[idx], quantidade: ne[idx].quantidade + qtd };
    else ne.push({ id: uid(), nome: fEnt.itemNome, categoria: fEnt.categoria, quantidade: qtd, unidade: fEnt.unidade });
    await saveE(ne);
    await saveM([{ id: uid(), tipo: "entrada", itemNome: fEnt.itemNome, categoria: fEnt.categoria, quantidade: qtd, unidade: fEnt.unidade, doador: fEnt.doador, observacao: fEnt.observacao, data: new Date().toISOString() }, ...movs]);
    setFEnt(EE); alert("✅ Entrada registrada!");
  };

  const regSaida = async () => {
    if (!fSai.itemId || !fSai.quantidade) return alert("Selecione o item e a quantidade.");
    const item = estoque.find(i => i.id === fSai.itemId);
    const qtd = Number(fSai.quantidade);
    if (qtd > item.quantidade) return alert(`Estoque insuficiente! Disponível: ${item.quantidade} ${item.unidade}`);
    await saveE(estoque.map(i => i.id === item.id ? { ...i, quantidade: i.quantidade - qtd } : i));
    await saveM([{ id: uid(), tipo: "saida", itemNome: item.nome, categoria: item.categoria, quantidade: qtd, unidade: item.unidade, beneficiario: fSai.beneficiario, observacao: fSai.observacao, data: new Date().toISOString() }, ...movs]);
    setFSai(ES); alert("✅ Saída registrada!");
  };

  const addMeta = async () => {
    if (!fMeta.itemNome.trim() || !fMeta.meta) return alert("Preencha item e meta.");
    const idx = metas.findIndex(m => m.itemNome.toLowerCase() === fMeta.itemNome.toLowerCase() && m.mesAno === fMeta.mesAno);
    const nm = [...metas];
    if (idx >= 0) nm[idx] = { ...nm[idx], meta: Number(fMeta.meta), unidade: fMeta.unidade, categoria: fMeta.categoria };
    else nm.push({ id: uid(), ...fMeta, meta: Number(fMeta.meta) });
    await saveMt(nm); setFMeta(EM); alert("✅ Meta salva!");
  };

  const delMeta = async id => { if (!confirm("Remover meta?")) return; await saveMt(metas.filter(m => m.id !== id)); };
  const baixo = estoque.filter(i => i.quantidade <= 5);
  const mes = nowYM();
  const metasMes = metas.filter(m => m.mesAno === mes);

  return (
    <div>
      <InnerTabs active={tab} onChange={setTab} tabs={[["estoque", "📦 Estoque"], ["entrada", "⬇ Entrada"], ["saida", "⬆ Saída"], ["metas", "🎯 Metas"], ["historico", "📋 Histórico"]]} />

      {tab === "estoque" && <>
        <div className="stat-row" style={{ marginBottom: 16 }}>
          <StatBox label="Tipos de item" value={estoque.length} />
          <StatBox label="Unidades totais" value={estoque.reduce((s, i) => s + i.quantidade, 0)} color="var(--primary-mid)" />
          <StatBox label="Baixo estoque" value={baixo.length} color={baixo.length > 0 ? "var(--danger)" : "var(--muted)"} />
        </div>
        {baixo.length > 0 && (
          <div className="alert alert-danger">
            <span style={{ fontSize: 20 }}>⚠️</span>
            <p style={{ fontSize: 13, color: "var(--danger)" }}><strong>Estoque baixo:</strong> {baixo.map(i => i.nome).join(", ")}</p>
          </div>
        )}
        {estoque.length === 0 ? <Empty icon="📦" text="Nenhum item no estoque.\nRegistre uma entrada para começar." />
          : CATEGORIAS.filter(c => estoque.some(i => i.categoria === c)).map(cat => (
            <div key={cat} style={{ marginBottom: 24 }}>
              <p className="section-title">{cat}</p>
              {estoque.filter(i => i.categoria === cat).map(item => {
                const meta = metasMes.find(m => m.itemNome.toLowerCase() === item.nome.toLowerCase());
                return (
                  <Card key={item.id} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: meta ? 12 : 0 }}>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: 15 }}>{item.nome}</p>
                        <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{item.unidade}</p>
                      </div>
                      <p style={{ fontSize: 28, fontWeight: 800, color: item.quantidade <= 5 ? "var(--danger)" : "var(--primary)" }}>{item.quantidade}</p>
                    </div>
                    {meta && <>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 12, color: "var(--muted)" }}>Meta: {meta.meta} {meta.unidade}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: item.quantidade >= meta.meta ? "var(--primary)" : "var(--warning)" }}>
                          {Math.min(100, Math.round((item.quantidade / meta.meta) * 100))}%
                        </span>
                      </div>
                      <Progress value={item.quantidade} max={meta.meta} />
                    </>}
                  </Card>
                );
              })}
            </div>
          ))}
      </>}

      {tab === "entrada" && (
        <Card>
          <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 20 }}>Registrar doação recebida</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="grid-2">
              <Inp label="Nome do item *" value={fEnt.itemNome} onChange={e => setFEnt({ ...fEnt, itemNome: e.target.value })} placeholder="Ex: Cesta básica" />
              <Sel label="Categoria" value={fEnt.categoria} onChange={e => setFEnt({ ...fEnt, categoria: e.target.value })}>{CATEGORIAS.map(c => <option key={c}>{c}</option>)}</Sel>
            </div>
            <div className="grid-2">
              <Inp label="Quantidade *" type="number" min="1" value={fEnt.quantidade} onChange={e => setFEnt({ ...fEnt, quantidade: e.target.value })} placeholder="10" />
              <Inp label="Unidade" value={fEnt.unidade} onChange={e => setFEnt({ ...fEnt, unidade: e.target.value })} placeholder="unidade, kg, litro..." />
            </div>
            <Inp label="Nome do doador" value={fEnt.doador} onChange={e => setFEnt({ ...fEnt, doador: e.target.value })} placeholder="Nome ou empresa (opcional)" />
            <Txta label="Observações" value={fEnt.observacao} onChange={e => setFEnt({ ...fEnt, observacao: e.target.value })} placeholder="Data de validade, condições..." />
            <Btn onClick={regEntrada} style={{ alignSelf: "flex-start" }}>⬇ Confirmar entrada</Btn>
          </div>
        </Card>
      )}

      {tab === "saida" && (
        <Card>
          <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 20 }}>Registrar distribuição</h3>
          {estoque.filter(i => i.quantidade > 0).length === 0
            ? <Empty icon="📦" text="Nenhum item disponível no estoque." />
            : <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Sel label="Item *" value={fSai.itemId} onChange={e => setFSai({ ...fSai, itemId: e.target.value })}>
                <option value="">Selecione o item</option>
                {estoque.filter(i => i.quantidade > 0).map(i => <option key={i.id} value={i.id}>{i.nome} — {i.quantidade} {i.unidade} disponíveis</option>)}
              </Sel>
              <Inp label="Quantidade *" type="number" min="1" value={fSai.quantidade} onChange={e => setFSai({ ...fSai, quantidade: e.target.value })} placeholder="1" />
              <Inp label="Beneficiário" value={fSai.beneficiario} onChange={e => setFSai({ ...fSai, beneficiario: e.target.value })} placeholder="Nome da família (opcional)" />
              <Txta label="Observações" value={fSai.observacao} onChange={e => setFSai({ ...fSai, observacao: e.target.value })} placeholder="Motivo da distribuição..." />
              <Btn onClick={regSaida} variant="accent" style={{ alignSelf: "flex-start" }}>⬆ Confirmar saída</Btn>
            </div>}
        </Card>
      )}

      {tab === "metas" && <>
        <Card style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 20 }}>🎯 Definir meta de arrecadação</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="grid-2">
              <Inp label="Item *" value={fMeta.itemNome} onChange={e => setFMeta({ ...fMeta, itemNome: e.target.value })} placeholder="Ex: Cesta básica" />
              <Sel label="Categoria" value={fMeta.categoria} onChange={e => setFMeta({ ...fMeta, categoria: e.target.value })}>{CATEGORIAS.map(c => <option key={c}>{c}</option>)}</Sel>
            </div>
            <div className="grid-2">
              <Inp label="Quantidade meta *" type="number" min="1" value={fMeta.meta} onChange={e => setFMeta({ ...fMeta, meta: e.target.value })} placeholder="100" />
              <Inp label="Unidade" value={fMeta.unidade} onChange={e => setFMeta({ ...fMeta, unidade: e.target.value })} placeholder="unidade, kg..." />
            </div>
            <Sel label="Mês" value={fMeta.mesAno} onChange={e => setFMeta({ ...fMeta, mesAno: e.target.value })}>
              {Array.from({ length: 12 }, (_, i) => { const d = new Date(); d.setMonth(d.getMonth() + i - 2); const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; return <option key={ym} value={ym}>{ymLabel(ym)}</option>; })}
            </Sel>
            <Btn onClick={addMeta} variant="purple" style={{ alignSelf: "flex-start" }}>🎯 Salvar meta</Btn>
          </div>
        </Card>
        {metas.length === 0 ? <Empty icon="🎯" text="Nenhuma meta definida ainda." />
          : [...new Set(metas.map(m => m.mesAno))].sort().reverse().map(ym => (
            <div key={ym} style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 15, fontWeight: 800, marginBottom: 12 }}>
                {ymLabel(ym)} {ym === mes && <Badge color="primary">mês atual</Badge>}
              </p>
              {metas.filter(m => m.mesAno === ym).map(m => {
                const atual = estoque.find(i => i.nome.toLowerCase() === m.itemNome.toLowerCase())?.quantidade || 0;
                const pct = Math.min(100, Math.round((atual / m.meta) * 100));
                return (
                  <Card key={m.id} style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: 15 }}>{m.itemNome}</p>
                        <Badge color="muted">{m.categoria}</Badge>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ fontSize: 24, fontWeight: 800, color: pct >= 100 ? "var(--primary)" : pct >= 60 ? "var(--warning)" : "var(--danger)" }}>{pct}%</p>
                        <p style={{ fontSize: 12, color: "var(--muted)" }}>{atual} / {m.meta} {m.unidade}</p>
                      </div>
                    </div>
                    <Progress value={atual} max={m.meta} />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                      {pct < 100
                        ? <p style={{ fontSize: 12, color: "var(--warning)" }}>Faltam {m.meta - atual} {m.unidade} para a meta</p>
                        : <p style={{ fontSize: 12, color: "var(--primary)", fontWeight: 700 }}>✅ Meta atingida!</p>}
                      <button onClick={() => delMeta(m.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "var(--muted)", padding: "4px 8px" }}>🗑</button>
                    </div>
                  </Card>
                );
              })}
            </div>
          ))}
      </>}

      {tab === "historico" && <>
        <div className="stat-row" style={{ marginBottom: 20 }}>
          <StatBox label="Entradas" value={movs.filter(m => m.tipo === "entrada").reduce((s, m) => s + m.quantidade, 0)} />
          <StatBox label="Saídas" value={movs.filter(m => m.tipo === "saida").reduce((s, m) => s + m.quantidade, 0)} color="var(--accent)" />
          <StatBox label="Registros" value={movs.length} color="var(--info)" />
        </div>
        {movs.length === 0 ? <Empty icon="📋" text="Nenhuma movimentação registrada ainda." />
          : movs.slice(0, 60).map(m => (
            <Card key={m.id} style={{ marginBottom: 10, display: "flex", alignItems: "flex-start", gap: 14 }}>
              <div className="mov-icon" style={{ background: m.tipo === "entrada" ? "var(--primary-light)" : "var(--accent-light)" }}>
                {m.tipo === "entrada" ? "⬇" : "⬆"}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700, fontSize: 14 }}>{m.itemNome} <span style={{ fontWeight: 500, color: "var(--muted)" }}>— {m.quantidade} {m.unidade}</span></p>
                <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 3 }}>
                  {m.tipo === "entrada" ? `Doador: ${m.doador || "anônimo"}` : `Para: ${m.beneficiario || "distribuição geral"}`} · {fDate(m.data)}
                </p>
                {m.observacao && <p style={{ marginTop: 6, fontSize: 12, color: "var(--muted)", background: "var(--bg)", padding: "5px 10px", borderRadius: 6 }}>{m.observacao}</p>}
              </div>
              <Badge color={m.tipo === "entrada" ? "primary" : "accent"}>{m.tipo === "entrada" ? "Entrada" : "Saída"}</Badge>
            </Card>
          ))}
      </>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// ATENDIMENTOS
// ══════════════════════════════════════════════════════════════════
function AtendimentosModule({ atendimentos, setAtendimentos, beneficiarios, estoque, setEstoque, movs, setMovs }) {
  const [view, setView] = useState("list");
  const [busca, setBusca] = useState("");
  const [benSel, setBenSel] = useState(null);
  const [itens, setItens] = useState([{ itemId: "", quantidade: "" }]);
  const [voluntario, setVoluntario] = useState("");
  const [obs, setObs] = useState("");
  const [filtroMes, setFiltroMes] = useState("todos");

  const saveA = async d => { await sSet("atendimentos", d); setAtendimentos(d); };
  const updItem = (i, k, v) => setItens(itens.map((it, idx) => idx === i ? { ...it, [k]: v } : it));

  const registrar = async () => {
    if (!benSel) return alert("Selecione um beneficiário.");
    const valid = itens.filter(it => it.itemId && it.quantidade);
    if (valid.length === 0) return alert("Adicione pelo menos um item.");
    for (const it of valid) { const e = estoque.find(e => e.id === it.itemId); if (Number(it.quantidade) > e.quantidade) return alert(`Estoque insuficiente para ${e.nome}!`); }
    const itFmt = valid.map(it => { const e = estoque.find(e => e.id === it.itemId); return { itemId: it.itemId, itemNome: e.nome, quantidade: Number(it.quantidade), unidade: e.unidade }; });
    const novoEst = estoque.map(e => { const it = valid.find(i => i.itemId === e.id); return it ? { ...e, quantidade: e.quantidade - Number(it.quantidade) } : e; });
    const novasMov = valid.map(it => { const e = estoque.find(e => e.id === it.itemId); return { id: uid(), tipo: "saida", itemNome: e.nome, categoria: e.categoria, quantidade: Number(it.quantidade), unidade: e.unidade, beneficiario: benSel.nome, data: new Date().toISOString() }; });
    await saveA([{ id: uid(), beneficiarioId: benSel.id, beneficiarioNome: benSel.nome, itens: itFmt, voluntario, observacoes: obs, data: new Date().toISOString() }, ...atendimentos]);
    await sSet("estoque", novoEst); setEstoque(novoEst);
    await sSet("movimentacoes", [...novasMov, ...movs]); setMovs([...novasMov, ...movs]);
    setBenSel(null); setItens([{ itemId: "", quantidade: "" }]); setVoluntario(""); setObs("");
    setView("list"); alert("✅ Atendimento registrado!");
  };

  const benFiltrados = beneficiarios.filter(b => b.nome.toLowerCase().includes(busca.toLowerCase()));
  const mesesDisp = [...new Set(atendimentos.map(a => a.data?.slice(0, 7)))].sort().reverse();
  const atFilt = filtroMes === "todos" ? atendimentos : atendimentos.filter(a => a.data?.startsWith(filtroMes));

  if (view === "form") return (
    <div>
      <div className="back-bar">
        <Btn variant="ghost" size="sm" onClick={() => setView("list")}>← Voltar</Btn>
        <h2>Registrar atendimento</h2>
      </div>
      <Card style={{ marginBottom: 14 }}>
        <p className="section-title" style={{ marginBottom: 14 }}>1 · Beneficiário</p>
        {benSel
          ? <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--primary-light)", padding: "12px 16px", borderRadius: 10, border: "1.5px solid var(--primary)" }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: 15 }}>{benSel.nome}</p>
              <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>{benSel.bairro}</p>
            </div>
            <Btn variant="ghost" size="sm" onClick={() => setBenSel(null)}>Trocar</Btn>
          </div>
          : <>
            <input className="field-input" value={busca} onChange={e => setBusca(e.target.value)} placeholder="🔍 Buscar beneficiário pelo nome..." style={{ marginBottom: 8 }} />
            {busca && <div className="autocomplete-list">
              {benFiltrados.slice(0, 5).map(b => (
                <div key={b.id} className="autocomplete-item" onClick={() => { setBenSel(b); setBusca(""); }}>
                  <p style={{ fontWeight: 700, fontSize: 14 }}>{b.nome}</p>
                  <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{b.bairro}</p>
                </div>
              ))}
              {benFiltrados.length === 0 && <p style={{ padding: "12px 16px", fontSize: 13, color: "var(--muted)" }}>Nenhum resultado.</p>}
            </div>}
            {beneficiarios.length === 0 && <p style={{ fontSize: 13, color: "var(--warning)", marginTop: 8 }}>⚠️ Nenhum beneficiário cadastrado. Vá até a aba Beneficiários primeiro.</p>}
          </>}
      </Card>

      <Card style={{ marginBottom: 14 }}>
        <p className="section-title" style={{ marginBottom: 14 }}>2 · Itens distribuídos</p>
        {itens.map((it, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 90px auto", gap: 10, marginBottom: 10, alignItems: "end" }}>
            <Sel label={i === 0 ? "Item" : undefined} value={it.itemId} onChange={e => updItem(i, "itemId", e.target.value)}>
              <option value="">Selecione o item...</option>
              {estoque.filter(e => e.quantidade > 0).map(e => <option key={e.id} value={e.id}>{e.nome} (est: {e.quantidade})</option>)}
            </Sel>
            <Inp label={i === 0 ? "Qtd" : undefined} type="number" min="1" value={it.quantidade} onChange={e => updItem(i, "quantidade", e.target.value)} placeholder="1" />
            {itens.length > 1 && <button onClick={() => setItens(itens.filter((_, idx) => idx !== i))} style={{ background: "var(--danger-light)", border: "none", cursor: "pointer", color: "var(--danger)", fontSize: 16, padding: "10px 12px", borderRadius: 8, alignSelf: "flex-end" }}>✕</button>}
          </div>
        ))}
        <Btn variant="ghost" size="sm" onClick={() => setItens([...itens, { itemId: "", quantidade: "" }])} style={{ marginTop: 4 }}>+ Adicionar item</Btn>
      </Card>

      <Card style={{ marginBottom: 20 }}>
        <p className="section-title" style={{ marginBottom: 14 }}>3 · Detalhes</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Inp label="Voluntário responsável" value={voluntario} onChange={e => setVoluntario(e.target.value)} placeholder="Nome do voluntário (opcional)" />
          <Txta label="Observações do atendimento" value={obs} onChange={e => setObs(e.target.value)} placeholder="Condições, situação da família, observações..." />
        </div>
      </Card>

      <div style={{ display: "flex", gap: 10 }}>
        <Btn variant="purple" onClick={registrar}>📝 Registrar atendimento</Btn>
        <Btn variant="ghost" onClick={() => setView("list")}>Cancelar</Btn>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div className="stat-row" style={{ flex: 1 }}>
          <StatBox label="Total de atendimentos" value={atendimentos.length} color="var(--purple)" />
          <StatBox label="Este mês" value={atendimentos.filter(a => a.data?.startsWith(nowYM())).length} color="var(--primary-mid)" />
        </div>
        <Btn variant="purple" onClick={() => setView("form")}>+ Novo atendimento</Btn>
      </div>

      {mesesDisp.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {["todos", ...mesesDisp].map(m => (
            <button key={m} className={`filter-pill${filtroMes === m ? " active" : ""}`} onClick={() => setFiltroMes(m)}>
              {m === "todos" ? "Todos" : ymLabel(m)}
            </button>
          ))}
        </div>
      )}

      {atFilt.length === 0
        ? <Empty icon="📝" text="Nenhum atendimento registrado.\nClique em '+ Novo atendimento' para começar." />
        : atFilt.map(a => (
          <Card key={a.id} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div>
                <p style={{ fontWeight: 700, fontSize: 15 }}>{a.beneficiarioNome || "Beneficiário não identificado"}</p>
                <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 3 }}>📅 {fDate(a.data)}{a.voluntario && `  ·  👤 ${a.voluntario}`}</p>
              </div>
              <Badge color="purple">{(a.itens || []).length} {(a.itens || []).length === 1 ? "item" : "itens"}</Badge>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {(a.itens || []).map((it, i) => <span key={i} className="item-tag">{it.quantidade} {it.unidade} de {it.itemNome}</span>)}
            </div>
            {a.observacoes && <p style={{ marginTop: 10, fontSize: 13, color: "var(--muted)", background: "var(--bg)", padding: "8px 12px", borderRadius: 6 }}>{a.observacoes}</p>}
          </Card>
        ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// RELATÓRIOS
// ══════════════════════════════════════════════════════════════════
function RelatoriosModule({ beneficiarios, atendimentos, estoque, movs }) {
  const dados = { beneficiarios, atendimentos, estoque, movs };
  const mes = nowYM();
  const totalPessoas = beneficiarios.reduce((s, b) => s + (Number(b.numPessoas) || 0), 0);
  const totalDist = movs.filter(m => m.tipo === "saida").reduce((s, m) => s + m.quantidade, 0);
  const doadores = [...new Set(movs.filter(m => m.tipo === "entrada" && m.doador).map(m => m.doador))].length;

  return (
    <div>
      <div className="summary-banner">
        <p style={{ fontSize: 12, fontWeight: 700, opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Painel de impacto</p>
        <p style={{ fontSize: 22, fontWeight: 800, marginBottom: 20, letterSpacing: "-0.02em" }}>🤝 Sistema Social · Recife</p>
        <div className="grid-4">
          {[[beneficiarios.length, "Famílias"], [totalPessoas, "Pessoas"], [totalDist, "Itens distribuídos"], [doadores, "Doadores"]].map(([v, l]) => (
            <div key={l} style={{ background: "rgba(255,255,255,0.15)", borderRadius: 10, padding: "12px 14px", backdropFilter: "blur(4px)" }}>
              <p style={{ fontSize: 24, fontWeight: 800, color: "#fff" }}>{v}</p>
              <p style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>{l}</p>
            </div>
          ))}
        </div>
      </div>

      <p style={{ fontSize: 16, fontWeight: 800, marginBottom: 14 }}>📄 Exportar relatórios</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
        {[
          ["beneficiarios", "👥", "Lista de beneficiários", `${beneficiarios.length} cadastros com nome, bairro, renda e necessidades`],
          ["atendimentos", "📝", "Registro de atendimentos", `${atendimentos.length} atendimentos com itens entregues e datas`],
          ["estoque", "📦", "Histórico de doações", `${movs.length} movimentações com entradas e saídas`],
        ].map(([tipo, icon, titulo, desc]) => (
          <Card key={tipo}>
            <div className="rel-card">
              <div>
                <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 3 }}>{icon} {titulo}</p>
                <p style={{ fontSize: 13, color: "var(--muted)" }}>{desc}</p>
              </div>
              <Btn variant="info" size="sm" onClick={() => gerarRelatorio(tipo, dados)}>🖨 Gerar PDF</Btn>
            </div>
          </Card>
        ))}
      </div>

      <p style={{ fontSize: 16, fontWeight: 800, marginBottom: 14 }}>📊 Atividade — {ymLabel(mes)}</p>
      <div className="grid-3" style={{ marginBottom: 28 }}>
        <StatBox label="Atendimentos no mês" value={atendimentos.filter(a => a.data?.startsWith(mes)).length} color="var(--purple)" />
        <StatBox label="Itens recebidos" value={movs.filter(m => m.tipo === "entrada" && m.data?.startsWith(mes)).reduce((s, m) => s + m.quantidade, 0)} />
        <StatBox label="Itens distribuídos" value={movs.filter(m => m.tipo === "saida" && m.data?.startsWith(mes)).reduce((s, m) => s + m.quantidade, 0)} color="var(--accent)" />
      </div>

      <p style={{ fontSize: 16, fontWeight: 800, marginBottom: 14 }}>🏘 Famílias por bairro</p>
      {beneficiarios.length === 0 ? <Empty icon="🗺" text="Nenhum dado ainda." />
        : [...new Set(beneficiarios.map(b => b.bairro).filter(Boolean))].sort().map(bairro => {
          const count = beneficiarios.filter(b => b.bairro === bairro).length;
          const pct = Math.round((count / beneficiarios.length) * 100);
          return (
            <div key={bairro} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{bairro}</span>
                <span style={{ fontSize: 13, color: "var(--muted)" }}>{count} família{count !== 1 ? "s" : ""} · {pct}%</span>
              </div>
              <Progress value={count} max={beneficiarios.length} />
            </div>
          );
        })}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// APP RAIZ
// ══════════════════════════════════════════════════════════════════
const NAV = [
  { id: "beneficiarios", icon: "👥", label: "Beneficiários" },
  { id: "doacoes", icon: "📦", label: "Doações" },
  { id: "atendimentos", icon: "📝", label: "Atendimentos" },
  { id: "relatorios", icon: "📊", label: "Relatórios" },
];

export default function App() {
  const [mod, setMod] = useState("beneficiarios");
  const [beneficiarios, setBeneficiarios] = useState([]);
  const [atendimentos, setAtendimentos] = useState([]);
  const [estoque, setEstoque] = useState([]);
  const [movs, setMovs] = useState([]);
  const [metas, setMetas] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Injeta CSS global
    const style = document.createElement("style");
    style.textContent = globalCSS;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    Promise.all([sGet("beneficiarios"), sGet("atendimentos"), sGet("estoque"), sGet("movimentacoes"), sGet("metas")])
      .then(([b, a, e, m, mt]) => {
        setBeneficiarios(b || []); setAtendimentos(a || []); setEstoque(e || []); setMovs(m || []); setMetas(mt || []);
        setReady(true);
      });
  }, []);

  return (
    <>
      {/* Header */}
      <header className="app-header">
        <div className="header-inner">
          <div className="header-logo">🤝</div>
          <div>
            <div className="header-title">Sistema Social · Recife</div>
            <div className="header-sub">Dados salvos localmente · funciona offline</div>
          </div>
          <div className="header-stats">
            <div className="header-stat">
              <div className="header-stat-val">{beneficiarios.length}</div>
              <div className="header-stat-label">famílias</div>
            </div>
            <div className="header-stat">
              <div className="header-stat-val">{atendimentos.length}</div>
              <div className="header-stat-label">atendimentos</div>
            </div>
          </div>
        </div>
      </header>

      {/* Desktop nav */}
      <nav className="desktop-nav">
        <div className="desktop-nav-inner">
          {NAV.map(n => (
            <button key={n.id} className={`nav-btn${mod === n.id ? " active" : ""}`} onClick={() => setMod(n.id)}>
              {n.icon} {n.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Conteúdo */}
      <main className="app-container">
        <div className="page-content">
          {!ready ? (
            <div style={{ textAlign: "center", padding: 60, color: "var(--muted)" }}>
              <div style={{ fontSize: 36, marginBottom: 14 }}>⏳</div>
              <p>Carregando dados...</p>
            </div>
          ) : (
            <>
              {mod === "beneficiarios" && <BeneficiariosModule beneficiarios={beneficiarios} setBeneficiarios={setBeneficiarios} atendimentos={atendimentos} />}
              {mod === "doacoes" && <DoacoesModule estoque={estoque} setEstoque={setEstoque} movs={movs} setMovs={setMovs} metas={metas} setMetas={setMetas} />}
              {mod === "atendimentos" && <AtendimentosModule atendimentos={atendimentos} setAtendimentos={setAtendimentos} beneficiarios={beneficiarios} estoque={estoque} setEstoque={setEstoque} movs={movs} setMovs={setMovs} />}
              {mod === "relatorios" && <RelatoriosModule beneficiarios={beneficiarios} atendimentos={atendimentos} estoque={estoque} movs={movs} />}
            </>
          )}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="mobile-nav">
        <div className="mobile-nav-inner">
          {NAV.map(n => (
            <button key={n.id} className={`mobile-nav-btn${mod === n.id ? " active" : ""}`} onClick={() => setMod(n.id)}>
              <span className="nav-icon">{n.icon}</span>
              <span>{n.label}</span>
              <span className="nav-dot" />
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}
