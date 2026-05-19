import { useState, useEffect } from "react";
import db from "./db";

async function sGet(key) {
  try { const r = await db.kv.get(key); return r ? r.value : null; } catch { return null; }
}
async function sSet(key, val) {
  try { await db.kv.put({ key, value: val }); } catch (e) { console.error(e); }
}

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function fDate(iso) { return iso ? new Date(iso).toLocaleDateString("pt-BR") : "—"; }
function fCur(v) { return "R$ " + Number(v || 0).toFixed(2).replace(".", ","); }
function nowYM() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; }
function ymLabel(ym) { const [y, m] = ym.split("-"); return `${MESES[Number(m) - 1]} ${y}`; }

// ── Validações ────────────────────────────────────────────────────
function validarCPF(cpf) {
  const limpo = cpf.replace(/\D/g, "");
  if (limpo.length !== 11) return false;
  if (/^(\d)\1+$/.test(limpo)) return false;
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(limpo[i]) * (10 - i);
  let r = (soma * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  if (r !== parseInt(limpo[9])) return false;
  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(limpo[i]) * (11 - i);
  r = (soma * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  return r === parseInt(limpo[10]);
}

function mascaraCPF(v) {
  return v.replace(/\D/g, "").slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function mascaraTelefone(v) {
  const n = v.replace(/\D/g, "").slice(0, 11);
  if (n.length <= 10)
    return n.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").replace(/-$/, "");
  return n.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").replace(/-$/, "");
}

function mascaraCEP(v) {
  return v.replace(/\D/g, "").slice(0, 8).replace(/(\d{5})(\d{0,3})/, "$1-$2").replace(/-$/, "");
}

function validarTelefone(v) {
  return v.replace(/\D/g, "").length >= 10;
}

function validarCEP(v) {
  return v.replace(/\D/g, "").length === 8;
}

const CATEGORIAS = ["Alimento", "Roupa", "Higiene", "Medicamento", "Brinquedo", "Móvel", "Outro"];
const BAIRROS = ["Afogados", "Boa Viagem", "Boa Vista", "Brasília Teimosa", "Cajueiro Seco", "Casa Amarela", "Casa Forte", "Cordeiro", "Derby", "Encruzilhada", "Espinheiro", "Graças", "Ibura", "Imbiribeira", "Iputinga", "Jardim São Paulo", "Madalena", "Mustardinha", "Pina", "Recife (Bairro)", "Santo Amaro", "Santo Antônio", "Sancho", "Torrões", "Várzea", "Outro"];
const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Lato:wght@400;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --green-900: #0F3D25; --green-800: #155E3E; --green-700: #1A7A50; --green-600: #21956A; --green-100: #DCFCE7; --green-50: #F0FDF4;
    --amber-700: #B45309; --amber-100: #FEF3C7; --amber-50: #FFFBEB;
    --red-700: #B91C1C; --red-100: #FEE2E2; --red-50: #FFF5F5;
    --blue-700: #1D4ED8; --blue-100: #DBEAFE; --blue-50: #EFF6FF;
    --purple-700: #6D28D9; --purple-100: #EDE9FE; --purple-50: #F5F3FF;
    --pink-600: #DB2777; --pink-100: #FCE7F3; --pink-50: #FDF2F8;
    --gray-900: #111827; --gray-800: #1F2937; --gray-700: #374151; --gray-600: #4B5563;
    --gray-500: #6B7280; --gray-400: #9CA3AF; --gray-300: #D1D5DB; --gray-200: #E5E7EB;
    --gray-100: #F3F4F6; --gray-50: #F9FAFB; --white: #FFFFFF;
    --bg: #F1F3F5; --surface: #FFFFFF; --border: #E2E8F0;
    --font-sans: 'Inter', 'Segoe UI', sans-serif; --font-body: 'Lato', 'Segoe UI', sans-serif;
    --radius-xs: 6px; --radius-sm: 10px; --radius: 14px; --radius-lg: 20px;
    --shadow-xs: 0 1px 2px rgba(0,0,0,0.05);
    --shadow-sm: 0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.05);
    --shadow: 0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04);
    --shadow-md: 0 8px 24px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.05);
    --shadow-lg: 0 16px 48px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.06);
  }
  html { scroll-behavior: smooth; }
  body { font-family: var(--font-body); background: var(--bg); color: var(--gray-900); -webkit-font-smoothing: antialiased; font-size: 15px; line-height: 1.6; }
  input, select, textarea, button { font-family: var(--font-body); }

  /* HEADER */
  .app-header { background: var(--green-800); position: sticky; top: 0; z-index: 200; box-shadow: 0 2px 20px rgba(0,0,0,0.2); }
  .header-stripe { height: 4px; background: linear-gradient(90deg, #F472B6, #FDE047, #F472B6); }
  .header-inner { max-width: 1040px; margin: 0 auto; display: flex; align-items: center; gap: 16px; padding: 16px 24px; }
  .header-logo-wrap { width: 52px; height: 52px; border-radius: 14px; background: rgba(255,255,255,0.15); border: 1.5px solid rgba(255,255,255,0.25); display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 2px 12px rgba(0,0,0,0.2); overflow: hidden; }
  .header-logo-wrap img { width: 100%; height: 100%; object-fit: cover; }
  .header-title { font-family: var(--font-sans); font-size: 18px; font-weight: 800; color: #fff; letter-spacing: -0.03em; line-height: 1.2; }
  .header-subtitle { font-size: 12px; color: rgba(255,255,255,0.6); margin-top: 2px; }
  .header-badges { display: flex; gap: 10px; margin-left: auto; }
  .header-badge { background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2); border-radius: 12px; padding: 8px 16px; text-align: center; min-width: 72px; }
  .header-badge-val { font-family: var(--font-sans); font-size: 20px; font-weight: 800; color: #fff; line-height: 1; }
  .header-badge-label { font-size: 10px; color: rgba(255,255,255,0.65); margin-top: 3px; text-transform: uppercase; letter-spacing: 0.04em; }

  /* NAV DESKTOP */
  .desktop-nav { background: var(--green-900); border-bottom: 1px solid rgba(255,255,255,0.08); }
  .desktop-nav-inner { max-width: 1040px; margin: 0 auto; display: flex; padding: 0 24px; }
  .nav-tab { padding: 14px 22px; border: none; background: none; cursor: pointer; font-family: var(--font-sans); font-weight: 600; font-size: 13.5px; color: rgba(255,255,255,0.55); border-bottom: 3px solid transparent; transition: all 0.2s; white-space: nowrap; display: flex; align-items: center; gap: 8px; }
  .nav-tab:hover { color: rgba(255,255,255,0.85); background: rgba(255,255,255,0.05); }
  .nav-tab.active { color: #fff; border-bottom-color: #F472B6; }

  /* NAV MOBILE */
  .mobile-nav { display: none; position: fixed; bottom: 0; left: 0; right: 0; z-index: 200; background: var(--white); border-top: 1px solid var(--border); box-shadow: 0 -4px 24px rgba(0,0,0,0.1); padding-bottom: env(safe-area-inset-bottom); }
  .mobile-nav-inner { display: flex; }
  .mobile-nav-btn { flex: 1; border: none; background: none; cursor: pointer; font-family: var(--font-sans); font-weight: 600; font-size: 10px; color: var(--gray-400); padding: 10px 4px 12px; display: flex; flex-direction: column; align-items: center; gap: 5px; transition: all 0.15s; position: relative; }
  .mobile-nav-btn.active { color: var(--green-700); }
  .mobile-nav-btn .m-icon { font-size: 22px; line-height: 1; }
  .mobile-nav-btn::after { content: ''; position: absolute; top: 0; left: 20%; right: 20%; height: 3px; border-radius: 0 0 3px 3px; background: #F472B6; transform: scaleX(0); transition: transform 0.2s; }
  .mobile-nav-btn.active::after { transform: scaleX(1); }

  @media (max-width: 640px) {
    .desktop-nav { display: none; } .mobile-nav { display: block; }
    .header-inner { padding: 12px 16px; } .header-title { font-size: 15px; }
    .header-badge { padding: 6px 10px; min-width: 56px; } .header-badge-val { font-size: 16px; }
  }

  /* LAYOUT */
  .page-wrap { max-width: 1040px; margin: 0 auto; padding: 0 24px; }
  .page-content { padding: 28px 0 110px; }
  @media (max-width: 640px) { .page-wrap { padding: 0 14px; } .page-content { padding: 18px 0 95px; } }

  /* SECTION */
  .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
  .section-title-lg { font-family: var(--font-sans); font-size: 22px; font-weight: 800; color: var(--gray-900); letter-spacing: -0.02em; }
  .section-sub { font-size: 14px; color: var(--gray-500); margin-top: 2px; }

  /* CARDS */
  .card { background: var(--white); border-radius: var(--radius); border: 1px solid var(--border); padding: 20px 22px; box-shadow: var(--shadow-sm); transition: box-shadow 0.2s, transform 0.2s; }
  .card-hover { cursor: pointer; }
  .card-hover:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
  .card-hover:active { transform: translateY(0); }
  .card-accent-green { border-left: 4px solid var(--green-600); }
  .card-accent-purple { border-left: 4px solid var(--purple-700); }
  .card-accent-pink { border-left: 4px solid #DB2777; }

  /* STATS */
  .stats-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; margin-bottom: 24px; }
  .stat-card { background: var(--white); border-radius: var(--radius-sm); border: 1px solid var(--border); padding: 18px 20px; box-shadow: var(--shadow-sm); position: relative; overflow: hidden; }
  .stat-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; }
  .stat-card.green::before  { background: var(--green-600); }
  .stat-card.amber::before  { background: var(--amber-700); }
  .stat-card.blue::before   { background: var(--blue-700); }
  .stat-card.purple::before { background: var(--purple-700); }
  .stat-card.red::before    { background: var(--red-700); }
  .stat-card.pink::before   { background: #DB2777; }
  .stat-label { font-family: var(--font-sans); font-size: 11px; font-weight: 700; color: var(--gray-500); text-transform: uppercase; letter-spacing: 0.07em; }
  .stat-value { font-family: var(--font-sans); font-size: 32px; font-weight: 800; line-height: 1.1; margin-top: 6px; }
  .stat-card.green  .stat-value { color: var(--green-700); }
  .stat-card.amber  .stat-value { color: var(--amber-700); }
  .stat-card.blue   .stat-value { color: var(--blue-700); }
  .stat-card.purple .stat-value { color: var(--purple-700); }
  .stat-card.red    .stat-value { color: var(--red-700); }
  .stat-card.pink   .stat-value { color: #DB2777; }
  @media (max-width: 640px) { .stats-grid { grid-template-columns: 1fr 1fr; } .stat-value { font-size: 26px; } }

  /* FORMULÁRIOS */
  .form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .form-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
  @media (max-width: 640px) { .form-grid-2, .form-grid-3 { grid-template-columns: 1fr; } }

  .field { display: flex; flex-direction: column; gap: 6px; }
  .field-label { font-family: var(--font-sans); font-size: 12px; font-weight: 700; color: var(--gray-600); text-transform: uppercase; letter-spacing: 0.06em; }
  .field-required { color: var(--red-700); margin-left: 2px; }
  .field-hint { font-size: 11px; color: var(--gray-400); margin-top: 3px; }
  .field-input { padding: 11px 14px; border-radius: var(--radius-xs); border: 1.5px solid var(--gray-300); font-size: 15px; color: var(--gray-900); background: var(--white); outline: none; width: 100%; transition: border-color 0.15s, box-shadow 0.15s; box-shadow: var(--shadow-xs); }
  .field-input:focus { border-color: var(--green-600); box-shadow: 0 0 0 3px rgba(33,149,106,0.15); }
  .field-input.error { border-color: var(--red-700); box-shadow: 0 0 0 3px rgba(185,28,28,0.1); }
  .field-input::placeholder { color: var(--gray-400); }
  textarea.field-input { resize: vertical; min-height: 90px; line-height: 1.6; }
  .field-error { font-size: 12px; color: var(--red-700); font-weight: 600; margin-top: 3px; display: flex; align-items: center; gap: 4px; }

  /* BOTÕES */
  .btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; border: none; border-radius: var(--radius-xs); cursor: pointer; font-family: var(--font-sans); font-weight: 700; transition: all 0.18s; white-space: nowrap; }
  .btn:active { transform: scale(0.97); }
  .btn-lg { padding: 13px 28px; font-size: 15px; border-radius: var(--radius-sm); }
  .btn-md { padding: 10px 22px; font-size: 14px; }
  .btn-sm { padding: 7px 16px; font-size: 13px; }
  .btn-full { width: 100%; }
  .btn-primary { background: var(--green-700); color: #fff; box-shadow: 0 2px 8px rgba(26,122,80,0.3); }
  .btn-primary:hover { background: var(--green-800); }
  .btn-accent { background: var(--amber-700); color: #fff; }
  .btn-accent:hover { background: #92400E; }
  .btn-danger { background: var(--red-700); color: #fff; }
  .btn-info { background: var(--blue-700); color: #fff; }
  .btn-purple { background: var(--purple-700); color: #fff; box-shadow: 0 2px 8px rgba(109,40,217,0.3); }
  .btn-purple:hover { background: #5B21B6; }
  .btn-ghost { background: var(--white); color: var(--gray-600); border: 1.5px solid var(--gray-300); box-shadow: var(--shadow-xs); }
  .btn-ghost:hover { background: var(--gray-50); color: var(--gray-900); }
  .btn-ghost-green { background: var(--green-50); color: var(--green-700); border: 1.5px solid var(--green-100); }
  .btn-ghost-green:hover { background: var(--green-100); }

  /* BADGES */
  .badge { display: inline-flex; align-items: center; gap: 4px; font-family: var(--font-sans); font-size: 11.5px; font-weight: 700; padding: 3px 10px; border-radius: 99px; white-space: nowrap; }
  .badge-green  { background: var(--green-100);  color: var(--green-800); }
  .badge-amber  { background: var(--amber-100);  color: var(--amber-700); }
  .badge-red    { background: var(--red-100);    color: var(--red-700); }
  .badge-blue   { background: var(--blue-100);   color: var(--blue-700); }
  .badge-purple { background: var(--purple-100); color: var(--purple-700); }
  .badge-gray   { background: var(--gray-100);   color: var(--gray-600); }
  .badge-pink   { background: var(--pink-100);   color: var(--pink-600); }

  /* ALERTAS */
  .alert { border-radius: var(--radius-sm); padding: 14px 18px; display: flex; align-items: flex-start; gap: 12px; margin-bottom: 18px; border: 1px solid; }
  .alert-icon { font-size: 20px; flex-shrink: 0; margin-top: 1px; }
  .alert-red   { background: var(--red-50);   border-color: #FCA5A5; }
  .alert-amber { background: var(--amber-50); border-color: #FCD34D; }
  .alert-green { background: var(--green-50); border-color: var(--green-100); }

  /* PROGRESSO */
  .progress-track { background: var(--gray-100); border-radius: 99px; height: 10px; overflow: hidden; }
  .progress-fill { height: 100%; border-radius: 99px; transition: width 0.6s ease; }

  /* EMPTY STATE */
  .empty-state { text-align: center; padding: 64px 24px; background: var(--white); border-radius: var(--radius); border: 1.5px dashed var(--gray-300); }
  .empty-icon { font-size: 52px; margin-bottom: 16px; opacity: 0.5; display: block; }
  .empty-title { font-family: var(--font-sans); font-size: 16px; font-weight: 700; color: var(--gray-700); margin-bottom: 6px; }
  .empty-sub { font-size: 14px; color: var(--gray-500); line-height: 1.6; }

  /* SEARCH */
  .search-wrap { display: flex; gap: 12px; align-items: center; margin-bottom: 20px; flex-wrap: wrap; }
  .search-input { flex: 1; min-width: 220px; padding: 12px 18px; border-radius: var(--radius-sm); border: 1.5px solid var(--gray-300); font-size: 15px; color: var(--gray-900); background: var(--white); outline: none; box-shadow: var(--shadow-sm); transition: border-color 0.15s, box-shadow 0.15s; }
  .search-input:focus { border-color: var(--green-600); box-shadow: 0 0 0 3px rgba(33,149,106,0.12); }
  .search-input::placeholder { color: var(--gray-400); }

  /* INNER TABS */
  .inner-tabs { display: flex; gap: 4px; background: var(--gray-100); padding: 5px; border-radius: var(--radius-sm); flex-wrap: wrap; margin-bottom: 22px; border: 1px solid var(--gray-200); }
  .inner-tab { padding: 9px 16px; border-radius: var(--radius-xs); border: none; cursor: pointer; font-family: var(--font-sans); font-weight: 600; font-size: 13.5px; background: transparent; color: var(--gray-500); transition: all 0.15s; white-space: nowrap; }
  .inner-tab:hover:not(.active) { background: var(--white); color: var(--gray-800); }
  .inner-tab.active { background: var(--white); color: var(--green-800); box-shadow: var(--shadow-sm); font-weight: 700; border: 1px solid var(--gray-200); }

  /* FILTER PILLS */
  .filter-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 18px; }
  .filter-pill { padding: 6px 16px; border-radius: 99px; border: 1.5px solid var(--gray-300); background: var(--white); color: var(--gray-600); cursor: pointer; font-family: var(--font-sans); font-size: 13px; font-weight: 600; transition: all 0.15s; box-shadow: var(--shadow-xs); }
  .filter-pill:hover { border-color: var(--green-600); color: var(--green-700); }
  .filter-pill.active { background: var(--green-700); color: #fff; border-color: var(--green-700); }

  /* MISC */
  .divider { border: none; border-top: 1px solid var(--gray-200); margin: 20px 0; }
  .back-bar { display: flex; align-items: center; gap: 14px; margin-bottom: 22px; }
  .back-bar h2 { font-family: var(--font-sans); font-size: 22px; font-weight: 800; color: var(--gray-900); letter-spacing: -0.02em; }
  .item-tag { display: inline-block; font-size: 13px; font-weight: 600; background: var(--green-50); color: var(--green-800); border: 1px solid var(--green-100); padding: 4px 12px; border-radius: 99px; }
  .ben-name { font-family: var(--font-sans); font-weight: 700; font-size: 16px; color: var(--gray-900); margin-bottom: 4px; }
  .ben-meta { font-size: 13.5px; color: var(--gray-500); }
  .ben-needs { margin-top: 12px; font-size: 13.5px; color: var(--gray-600); background: var(--gray-50); padding: 10px 14px; border-radius: var(--radius-xs); border-left: 3px solid var(--green-100); line-height: 1.5; }
  .mov-icon { width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
  .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-bottom: 16px; }
  .detail-key { font-family: var(--font-sans); font-size: 11px; font-weight: 700; color: var(--gray-400); text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 4px; }
  .detail-val { font-size: 15px; color: var(--gray-800); font-weight: 500; }
  @media (max-width: 640px) { .detail-grid { grid-template-columns: 1fr; } }

  /* FORM SECTION */
  .form-section { background: var(--white); border-radius: var(--radius); border: 1px solid var(--border); padding: 22px 24px; box-shadow: var(--shadow-sm); margin-bottom: 14px; }
  .form-section-header { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; }
  .form-step-num { width: 30px; height: 30px; border-radius: 50%; background: var(--green-700); color: #fff; font-family: var(--font-sans); font-size: 14px; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .form-step-title { font-family: var(--font-sans); font-size: 15px; font-weight: 700; color: var(--gray-800); }

  /* SUMMARY BANNER */
  .summary-banner { background: linear-gradient(135deg, var(--green-900) 0%, var(--green-700) 60%, var(--green-600) 100%); border-radius: var(--radius-lg); padding: 28px 32px; color: #fff; margin-bottom: 28px; box-shadow: var(--shadow-lg); position: relative; overflow: hidden; }
  .summary-banner::after { content: ''; position: absolute; top: -40px; right: -40px; width: 180px; height: 180px; background: rgba(255,255,255,0.05); border-radius: 50%; }
  .summary-stats { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; margin-top: 20px; }
  .summary-stat { background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.15); border-radius: var(--radius-sm); padding: 14px 16px; }
  .summary-stat-val { font-family: var(--font-sans); font-size: 28px; font-weight: 800; color: #fff; line-height: 1; }
  .summary-stat-label { font-size: 11px; color: rgba(255,255,255,0.7); margin-top: 4px; text-transform: uppercase; letter-spacing: 0.05em; }
  @media (max-width: 640px) { .summary-banner { padding: 20px; border-radius: var(--radius); } .summary-stats { grid-template-columns: 1fr 1fr; } }

  /* AUTOCOMPLETE */
  .autocomplete-list { background: var(--white); border: 1.5px solid var(--gray-200); border-radius: var(--radius-sm); overflow: hidden; box-shadow: var(--shadow-md); margin-top: 4px; }
  .autocomplete-item { padding: 13px 16px; cursor: pointer; border-bottom: 1px solid var(--gray-100); transition: background 0.1s; }
  .autocomplete-item:last-child { border-bottom: none; }
  .autocomplete-item:hover { background: var(--green-50); }

  /* REL */
  .rel-export-card { background: var(--white); border-radius: var(--radius-sm); border: 1px solid var(--border); padding: 18px 22px; display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; box-shadow: var(--shadow-sm); transition: box-shadow 0.2s; }
  .rel-export-card:hover { box-shadow: var(--shadow); }
  .rel-export-icon { font-size: 28px; flex-shrink: 0; }
  .rel-export-title { font-family: var(--font-sans); font-size: 15px; font-weight: 700; color: var(--gray-900); }
  .rel-export-desc { font-size: 13px; color: var(--gray-500); margin-top: 2px; }
  .bairro-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
  .bairro-name { font-size: 14px; font-weight: 600; color: var(--gray-700); }
  .bairro-count { font-size: 13px; color: var(--gray-500); }

  /* LOADING */
  .loading-wrap { text-align: center; padding: 80px 24px; }
  .loading-spinner { width: 40px; height: 40px; border-radius: 50%; border: 3px solid var(--gray-200); border-top-color: var(--green-600); animation: spin 0.8s linear infinite; margin: 0 auto 16px; }
  @keyframes spin { to { transform: rotate(360deg); } }

  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--gray-300); border-radius: 99px; }
`;

// ── Componentes base ──────────────────────────────────────────────
function FieldError({ msg }) {
  if (!msg) return null;
  return <span className="field-error">⚠ {msg}</span>;
}

function Inp({ label, required, hint, error, style: s, ...p }) {
  return (
    <div className="field">
      {label && <label className="field-label">{label}{required && <span className="field-required">*</span>}</label>}
      <input className={`field-input${error ? " error" : ""}`} style={s} {...p} />
      {hint && !error && <span className="field-hint">{hint}</span>}
      <FieldError msg={error} />
    </div>
  );
}
function Sel({ label, required, children, ...p }) {
  return (
    <div className="field">
      {label && <label className="field-label">{label}{required && <span className="field-required">*</span>}</label>}
      <select className="field-input" {...p}>{children}</select>
    </div>
  );
}
function Txta({ label, ...p }) {
  return (
    <div className="field">
      {label && <label className="field-label">{label}</label>}
      <textarea className="field-input" {...p} />
    </div>
  );
}
function Btn({ children, variant = "primary", size = "md", full, onClick, type = "button", style: s }) {
  return (
    <button type={type} onClick={onClick} style={s}
      className={`btn btn-${size} btn-${variant}${full ? " btn-full" : ""}`}>
      {children}
    </button>
  );
}
function StatCard({ label, value, color = "green" }) {
  return (
    <div className={`stat-card ${color}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}
function Badge({ children, color = "green" }) {
  return <span className={`badge badge-${color}`}>{children}</span>;
}
function Empty({ icon, title, sub }) {
  return (
    <div className="empty-state">
      <span className="empty-icon">{icon}</span>
      <p className="empty-title">{title}</p>
      {sub && <p className="empty-sub">{sub}</p>}
    </div>
  );
}
function Progress({ value, max }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const col = pct >= 100 ? "var(--green-600)" : pct >= 60 ? "var(--green-700)" : pct >= 30 ? "var(--amber-700)" : "var(--red-700)";
  return <div className="progress-track"><div className="progress-fill" style={{ width: `${pct}%`, background: col }} /></div>;
}
function InnerTabs({ tabs, active, onChange }) {
  return (
    <div className="inner-tabs">
      {tabs.map(([k, l]) => <button key={k} className={`inner-tab${active === k ? " active" : ""}`} onClick={() => onChange(k)}>{l}</button>)}
    </div>
  );
}
function FormSection({ step, title, children }) {
  return (
    <div className="form-section">
      <div className="form-section-header">
        <div className="form-step-num">{step}</div>
        <div className="form-step-title">{title}</div>
      </div>
      {children}
    </div>
  );
}

// ── Relatório ─────────────────────────────────────────────────────
function gerarRelatorio(tipo, dados) {
  const { beneficiarios = [], atendimentos = [], movs = [] } = dados;
  const now = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  const th = `background:#155E3E;color:#fff;padding:11px 14px;text-align:left;font-size:13px;font-weight:600`;
  const td = `padding:11px 14px;border-bottom:1px solid #F3F4F6;font-size:13px;vertical-align:top`;
  let body = "";
  if (tipo === "beneficiarios") {
    body = `<h2 style="margin:0 0 18px;font-size:18px;font-weight:800">Beneficiários — ${beneficiarios.length} famílias</h2>
      <table width="100%" cellspacing="0" style="border-collapse:collapse;border:1px solid #E5E7EB">
        <tr><th style="${th}">Nome</th><th style="${th}">CPF</th><th style="${th}">Bairro</th><th style="${th}">CEP</th><th style="${th}">Endereço</th><th style="${th}">Pessoas</th><th style="${th}">Renda</th><th style="${th}">Cadastro</th></tr>
        ${beneficiarios.map((b, i) => `<tr style="background:${i % 2 ? "#F9FAFB" : "#fff"}"><td style="${td}">${b.nome}</td><td style="${td}">${b.cpf || "—"}</td><td style="${td}">${b.bairro || "—"}</td><td style="${td}">${b.cep || "—"}</td><td style="${td}">${b.endereco || "—"}</td><td style="${td}">${b.numPessoas || "—"}</td><td style="${td}">${b.renda ? fCur(b.renda) : "—"}</td><td style="${td}">${fDate(b.dataRegistro)}</td></tr>`).join("")}
      </table>`;
  } else if (tipo === "atendimentos") {
    body = `<h2 style="margin:0 0 18px;font-size:18px;font-weight:800">Atendimentos — ${atendimentos.length} registros</h2>
      <table width="100%" cellspacing="0" style="border-collapse:collapse;border:1px solid #E5E7EB">
        <tr><th style="${th}">Data</th><th style="${th}">Beneficiário</th><th style="${th}">Itens</th><th style="${th}">Voluntário</th></tr>
        ${atendimentos.map((a, i) => `<tr style="background:${i % 2 ? "#F9FAFB" : "#fff"}"><td style="${td}">${fDate(a.data)}</td><td style="${td}">${a.beneficiarioNome || "—"}</td><td style="${td}">${(a.itens || []).map(x => `${x.quantidade} ${x.unidade} de ${x.itemNome}`).join(", ") || "—"}</td><td style="${td}">${a.voluntario || "—"}</td></tr>`).join("")}
      </table>`;
  } else {
    const ent = movs.filter(m => m.tipo === "entrada").reduce((s, m) => s + m.quantidade, 0);
    const sai = movs.filter(m => m.tipo === "saida").reduce((s, m) => s + m.quantidade, 0);
    body = `<h2 style="margin:0 0 8px;font-size:18px;font-weight:800">Histórico de doações — ${movs.length} registros</h2>
      <p style="margin:0 0 18px;color:#6B7280">Entradas: <strong>${ent}</strong> · Saídas: <strong>${sai}</strong></p>
      <table width="100%" cellspacing="0" style="border-collapse:collapse;border:1px solid #E5E7EB">
        <tr><th style="${th}">Data</th><th style="${th}">Tipo</th><th style="${th}">Item</th><th style="${th}">Qtd</th><th style="${th}">Origem/Destino</th></tr>
        ${movs.map((m, i) => `<tr style="background:${i % 2 ? "#F9FAFB" : "#fff"}"><td style="${td}">${fDate(m.data)}</td><td style="${td};color:${m.tipo === "entrada" ? "#1A7A50" : "#B45309"};font-weight:700">${m.tipo === "entrada" ? "⬇ Entrada" : "⬆ Saída"}</td><td style="${td}">${m.itemNome}</td><td style="${td}">${m.quantidade} ${m.unidade}</td><td style="${td}">${m.tipo === "entrada" ? (m.doador || "anônimo") : (m.beneficiario || "geral")}</td></tr>`).join("")}
      </table>`;
  }
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Relatório · Sistema Partilhar</title>
    <style>*{box-sizing:border-box}body{font-family:Georgia,serif;max-width:960px;margin:0 auto;padding:40px 32px;color:#111827}@media print{.no-print{display:none}}</style></head>
    <body>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:32px;padding-bottom:20px;border-bottom:3px solid #155E3E">
        <div><h1 style="margin:0;color:#155E3E;font-size:26px;font-weight:800">🦋 Sistema Partilhar</h1><p style="margin:8px 0 0;font-size:14px;color:#6B7280">Relatório gerado em ${now}</p></div>
        <button class="no-print" onclick="window.print()" style="background:#155E3E;color:#fff;border:none;padding:13px 26px;border-radius:10px;cursor:pointer;font-size:14px;font-weight:700">🖨 Imprimir / Salvar PDF</button>
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
  const EF = { nome: "", cpf: "", telefone: "", cep: "", endereco: "", numero: "", complemento: "", bairro: "", numPessoas: "", renda: "", necessidades: "", observacoes: "" };
  const [form, setForm] = useState(EF);
  const [erros, setErros] = useState({});

  const f = k => e => {
    let val = e.target.value;
    if (k === "cpf") val = mascaraCPF(val);
    if (k === "telefone") val = mascaraTelefone(val);
    if (k === "cep") val = mascaraCEP(val);
    setForm({ ...form, [k]: val });
    if (erros[k]) setErros({ ...erros, [k]: "" });
  };

  const validar = () => {
    const e = {};
    if (!form.nome.trim()) e.nome = "Nome é obrigatório.";
    if (form.cpf && !validarCPF(form.cpf)) e.cpf = "CPF inválido. Verifique os números digitados.";
    if (form.telefone && !validarTelefone(form.telefone)) e.telefone = "Telefone inválido. Digite DDD + número.";
    if (form.cep && !validarCEP(form.cep)) e.cep = "CEP inválido. Deve ter 8 números.";
    setErros(e);
    return Object.keys(e).length === 0;
  };

  const save = async d => { await sSet("beneficiarios", d); setBeneficiarios(d); };
  const submit = async () => {
    if (!validar()) return;
    await save([...beneficiarios, { ...form, id: uid(), dataRegistro: new Date().toISOString() }]);
    setForm(EF); setErros({}); setView("list");
  };
  const del = async id => {
    if (!confirm("Deseja remover este beneficiário?")) return;
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
        <Btn variant="ghost" size="sm" onClick={() => { setView("list"); setErros({}); setForm(EF); }}>← Voltar</Btn>
        <h2>Novo beneficiário</h2>
      </div>
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div className="form-grid-2">
          <Inp label="Nome completo" required value={form.nome} onChange={f("nome")} placeholder="Ex: Maria da Silva" error={erros.nome} />
          <Inp label="CPF" value={form.cpf} onChange={f("cpf")} placeholder="000.000.000-00" hint="Formato: 000.000.000-00" error={erros.cpf} />
        </div>
        <div className="form-grid-2">
          <Inp label="Telefone / WhatsApp" value={form.telefone} onChange={f("telefone")} placeholder="(81) 9 0000-0000" hint="Formato: (DDD) número" error={erros.telefone} />
          <Sel label="Bairro" value={form.bairro} onChange={f("bairro")}>
            <option value="">Selecione o bairro...</option>
            {BAIRROS.map(b => <option key={b}>{b}</option>)}
          </Sel>
        </div>

        <div style={{ background: "var(--gray-50)", borderRadius: "var(--radius-sm)", padding: "16px 18px", border: "1px solid var(--gray-200)" }}>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 700, color: "var(--gray-500)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>📍 Endereço</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="form-grid-2">
              <Inp label="CEP" value={form.cep} onChange={f("cep")} placeholder="00000-000" hint="Formato: 00000-000" error={erros.cep} />
              <Inp label="Rua / Logradouro" value={form.endereco} onChange={f("endereco")} placeholder="Ex: Rua das Flores" />
            </div>
            <div className="form-grid-2">
              <Inp label="Número" value={form.numero} onChange={f("numero")} placeholder="Ex: 123" />
              <Inp label="Complemento" value={form.complemento} onChange={f("complemento")} placeholder="Ex: Apto 2, casa dos fundos..." />
            </div>
          </div>
        </div>

        <div className="form-grid-2">
          <Inp label="Nº de pessoas na família" type="number" min="1" value={form.numPessoas} onChange={f("numPessoas")} placeholder="Ex: 4" />
          <Inp label="Renda familiar (R$)" type="number" min="0" value={form.renda} onChange={f("renda")} placeholder="Ex: 800" />
        </div>
        <Txta label="Necessidades da família" value={form.necessidades} onChange={f("necessidades")} placeholder="Ex: cesta básica, fraldas, medicamentos..." />
        <Txta label="Observações" value={form.observacoes} onChange={f("observacoes")} placeholder="Informações adicionais sobre a família..." />
        <hr className="divider" />
        <div style={{ display: "flex", gap: 12 }}>
          <Btn size="lg" onClick={submit}>💾 Salvar cadastro</Btn>
          <Btn variant="ghost" size="lg" onClick={() => { setView("list"); setErros({}); setForm(EF); }}>Cancelar</Btn>
        </div>
      </div>
    </div>
  );

  if (view === "detail" && sel) {
    const b = sel;
    const hists = atendimentos.filter(a => a.beneficiarioId === b.id);
    const enderecoCompleto = [b.endereco, b.numero, b.complemento, b.cep].filter(Boolean).join(", ");
    return (
      <div>
        <div className="back-bar">
          <Btn variant="ghost" size="sm" onClick={() => setView("list")}>← Voltar</Btn>
          <h2>Ficha do beneficiário</h2>
        </div>
        <div className="card card-accent-green" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            <div>
              <h3 style={{ fontFamily: "var(--font-sans)", fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em" }}>{b.nome}</h3>
              <p style={{ fontSize: 13, color: "var(--gray-400)", marginTop: 4 }}>Cadastrado em {fDate(b.dataRegistro)}</p>
            </div>
            <Badge color="green">✓ Ativo</Badge>
          </div>
          <div className="detail-grid">
            {b.cpf && <div><p className="detail-key">CPF</p><p className="detail-val">{b.cpf}</p></div>}
            {b.telefone && <div><p className="detail-key">Telefone</p><p className="detail-val">{b.telefone}</p></div>}
            {b.bairro && <div><p className="detail-key">Bairro</p><p className="detail-val">{b.bairro}</p></div>}
            {b.cep && <div><p className="detail-key">CEP</p><p className="detail-val">{b.cep}</p></div>}
            {enderecoCompleto && <div style={{ gridColumn: "1 / -1" }}><p className="detail-key">Endereço</p><p className="detail-val">{enderecoCompleto}</p></div>}
            {b.numPessoas && <div><p className="detail-key">Pessoas na família</p><p className="detail-val">{b.numPessoas} pessoa{b.numPessoas !== "1" ? "s" : ""}</p></div>}
            {b.renda && <div><p className="detail-key">Renda familiar</p><p className="detail-val">{fCur(b.renda)}</p></div>}
          </div>
          {b.necessidades && <div style={{ marginBottom: 14 }}>
            <p className="detail-key" style={{ marginBottom: 8 }}>Necessidades</p>
            <p style={{ fontSize: 14, background: "var(--green-50)", padding: "12px 16px", borderRadius: "var(--radius-xs)", borderLeft: "3px solid var(--green-600)", color: "var(--gray-700)", lineHeight: 1.6 }}>{b.necessidades}</p>
          </div>}
          {b.observacoes && <div>
            <p className="detail-key" style={{ marginBottom: 8 }}>Observações</p>
            <p style={{ fontSize: 14, background: "var(--gray-50)", padding: "12px 16px", borderRadius: "var(--radius-xs)", color: "var(--gray-600)", lineHeight: 1.6 }}>{b.observacoes}</p>
          </div>}
          <hr className="divider" />
          <Btn variant="danger" size="sm" onClick={() => del(b.id)}>🗑 Remover cadastro</Btn>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <h3 style={{ fontFamily: "var(--font-sans)", fontSize: 17, fontWeight: 700 }}>Histórico de atendimentos</h3>
          <Badge color="purple">{hists.length} registro{hists.length !== 1 ? "s" : ""}</Badge>
        </div>
        {hists.length === 0
          ? <p style={{ fontSize: 14, color: "var(--gray-500)", background: "var(--gray-50)", padding: "16px 20px", borderRadius: "var(--radius-xs)", border: "1px dashed var(--gray-300)" }}>Nenhum atendimento registrado para esta família ainda.</p>
          : hists.map(a => (
            <div key={a.id} className="card" style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14 }}>📅 {fDate(a.data)}</span>
                {a.voluntario && <Badge color="gray">👤 {a.voluntario}</Badge>}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {(a.itens || []).map((it, i) => <span key={i} className="item-tag">{it.quantidade} {it.unidade} de {it.itemNome}</span>)}
              </div>
              {a.observacoes && <p style={{ marginTop: 10, fontSize: 13, color: "var(--gray-500)", background: "var(--gray-50)", padding: "8px 12px", borderRadius: "var(--radius-xs)" }}>{a.observacoes}</p>}
            </div>
          ))}
      </div>
    );
  }

  return (
    <div>
      <div className="section-header">
        <div>
          <h2 className="section-title-lg">Beneficiários</h2>
          <p className="section-sub">Famílias cadastradas e atendidas pela instituição</p>
        </div>
        <Btn size="lg" onClick={() => setView("form")}>+ Novo cadastro</Btn>
      </div>
      <div className="stats-grid">
        <StatCard label="Famílias cadastradas" value={beneficiarios.length} color="green" />
        <StatCard label="Bairros atendidos" value={[...new Set(beneficiarios.map(b => b.bairro).filter(Boolean))].length} color="amber" />
        <StatCard label="Pessoas atendidas" value={beneficiarios.reduce((s, b) => s + (Number(b.numPessoas) || 0), 0)} color="blue" />
        <StatCard label="Total atendimentos" value={atendimentos.length} color="purple" />
      </div>
      <div className="search-wrap">
        <input className="search-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍  Buscar por nome, bairro ou CPF..." />
      </div>
      {filtered.length === 0
        ? <Empty icon="👥" title="Nenhum beneficiário encontrado" sub={beneficiarios.length === 0 ? "Clique em '+ Novo cadastro' para registrar as famílias atendidas." : "Tente buscar por outro nome ou bairro."} />
        : filtered.map(b => (
          <div key={b.id} className="card card-hover" style={{ marginBottom: 12 }} onClick={() => { setSel(b); setView("detail"); }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <p className="ben-name">{b.nome}</p>
                <p className="ben-meta">{[b.bairro, b.numPessoas && `${b.numPessoas} pessoas`, b.renda && fCur(b.renda)].filter(Boolean).join("  ·  ")}</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, marginLeft: 16, flexShrink: 0 }}>
                <Badge color="green">Ativo</Badge>
                <span style={{ fontSize: 12, color: "var(--gray-400)" }}>{fDate(b.dataRegistro)}</span>
              </div>
            </div>
            {b.necessidades && <p className="ben-needs">📋 {b.necessidades.slice(0, 100)}{b.necessidades.length > 100 ? "..." : ""}</p>}
          </div>
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
    if (!fEnt.itemNome.trim() || !fEnt.quantidade) return alert("Preencha o nome do item e a quantidade.");
    const qtd = Number(fEnt.quantidade);
    const idx = estoque.findIndex(i => i.nome.toLowerCase() === fEnt.itemNome.toLowerCase() && i.categoria === fEnt.categoria);
    const ne = [...estoque];
    if (idx >= 0) ne[idx] = { ...ne[idx], quantidade: ne[idx].quantidade + qtd };
    else ne.push({ id: uid(), nome: fEnt.itemNome, categoria: fEnt.categoria, quantidade: qtd, unidade: fEnt.unidade });
    await saveE(ne);
    await saveM([{ id: uid(), tipo: "entrada", itemNome: fEnt.itemNome, categoria: fEnt.categoria, quantidade: qtd, unidade: fEnt.unidade, doador: fEnt.doador, observacao: fEnt.observacao, data: new Date().toISOString() }, ...movs]);
    setFEnt(EE); alert("✅ Doação registrada com sucesso!");
  };

  const regSaida = async () => {
    if (!fSai.itemId || !fSai.quantidade) return alert("Selecione o item e informe a quantidade.");
    const item = estoque.find(i => i.id === fSai.itemId);
    const qtd = Number(fSai.quantidade);
    if (qtd > item.quantidade) return alert(`Estoque insuficiente!\nDisponível: ${item.quantidade} ${item.unidade}.`);
    await saveE(estoque.map(i => i.id === item.id ? { ...i, quantidade: i.quantidade - qtd } : i));
    await saveM([{ id: uid(), tipo: "saida", itemNome: item.nome, categoria: item.categoria, quantidade: qtd, unidade: item.unidade, beneficiario: fSai.beneficiario, observacao: fSai.observacao, data: new Date().toISOString() }, ...movs]);
    setFSai(ES); alert("✅ Saída registrada com sucesso!");
  };

  const addMeta = async () => {
    if (!fMeta.itemNome.trim() || !fMeta.meta) return alert("Preencha o item e a quantidade da meta.");
    const idx = metas.findIndex(m => m.itemNome.toLowerCase() === fMeta.itemNome.toLowerCase() && m.mesAno === fMeta.mesAno);
    const nm = [...metas];
    if (idx >= 0) nm[idx] = { ...nm[idx], meta: Number(fMeta.meta), unidade: fMeta.unidade, categoria: fMeta.categoria };
    else nm.push({ id: uid(), ...fMeta, meta: Number(fMeta.meta) });
    await saveMt(nm); setFMeta(EM); alert("✅ Meta salva com sucesso!");
  };

  const delMeta = async id => { if (!confirm("Remover esta meta?")) return; await saveMt(metas.filter(m => m.id !== id)); };
  const baixo = estoque.filter(i => i.quantidade <= 5);
  const mes = nowYM();
  const metasMes = metas.filter(m => m.mesAno === mes);

  return (
    <div>
      <div className="section-header">
        <div>
          <h2 className="section-title-lg">Doações & Estoque</h2>
          <p className="section-sub">Controle de entradas, saídas e metas de arrecadação</p>
        </div>
      </div>
      <InnerTabs active={tab} onChange={setTab} tabs={[["estoque", "📦 Estoque"], ["entrada", "⬇ Registrar entrada"], ["saida", "⬆ Registrar saída"], ["metas", "🎯 Metas"], ["historico", "📋 Histórico"]]} />

      {tab === "estoque" && <>
        <div className="stats-grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
          <StatCard label="Tipos de item" value={estoque.length} color="green" />
          <StatCard label="Unidades no estoque" value={estoque.reduce((s, i) => s + i.quantidade, 0)} color="blue" />
          <StatCard label="Itens com estoque baixo" value={baixo.length} color={baixo.length > 0 ? "red" : "green"} />
        </div>
        {baixo.length > 0 && <div className="alert alert-red">
          <span className="alert-icon">⚠️</span>
          <div>
            <p style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14, color: "var(--red-700)", marginBottom: 2 }}>Atenção — estoque baixo</p>
            <p style={{ fontSize: 13, color: "var(--red-700)" }}>{baixo.map(i => i.nome).join(", ")}</p>
          </div>
        </div>}
        {estoque.length === 0 ? <Empty icon="📦" title="Estoque vazio" sub="Registre uma doação recebida na aba 'Registrar entrada' para começar." />
          : CATEGORIAS.filter(c => estoque.some(i => i.categoria === c)).map(cat => (
            <div key={cat} style={{ marginBottom: 28 }}>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 700, color: "var(--gray-400)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>{cat}</p>
              {estoque.filter(i => i.categoria === cat).map(item => {
                const meta = metasMes.find(m => m.itemNome.toLowerCase() === item.nome.toLowerCase());
                return <div key={item.id} className="card" style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: meta ? 14 : 0 }}>
                    <div>
                      <p style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 16 }}>{item.nome}</p>
                      <p style={{ fontSize: 13, color: "var(--gray-400)", marginTop: 2 }}>{item.unidade}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontFamily: "var(--font-sans)", fontSize: 34, fontWeight: 800, color: item.quantidade <= 5 ? "var(--red-700)" : "var(--green-700)", lineHeight: 1 }}>{item.quantidade}</p>
                      <p style={{ fontSize: 12, color: "var(--gray-400)" }}>disponíveis</p>
                    </div>
                  </div>
                  {meta && <>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: "var(--gray-500)" }}>Meta do mês: {meta.meta} {meta.unidade}</span>
                      <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 700, color: item.quantidade >= meta.meta ? "var(--green-700)" : "var(--amber-700)" }}>{Math.min(100, Math.round((item.quantidade / meta.meta) * 100))}%</span>
                    </div>
                    <Progress value={item.quantidade} max={meta.meta} />
                  </>}
                </div>;
              })}
            </div>
          ))}
      </>}

      {tab === "entrada" && <div className="card">
        <h3 style={{ fontFamily: "var(--font-sans)", fontSize: 18, fontWeight: 800, marginBottom: 22 }}>Registrar doação recebida</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div className="form-grid-2">
            <Inp label="Nome do item" required value={fEnt.itemNome} onChange={e => setFEnt({ ...fEnt, itemNome: e.target.value })} placeholder="Ex: Cesta básica" />
            <Sel label="Categoria" value={fEnt.categoria} onChange={e => setFEnt({ ...fEnt, categoria: e.target.value })}>{CATEGORIAS.map(c => <option key={c}>{c}</option>)}</Sel>
          </div>
          <div className="form-grid-2">
            <Inp label="Quantidade" required type="number" min="1" value={fEnt.quantidade} onChange={e => setFEnt({ ...fEnt, quantidade: e.target.value })} placeholder="Ex: 10" />
            <Inp label="Unidade de medida" value={fEnt.unidade} onChange={e => setFEnt({ ...fEnt, unidade: e.target.value })} placeholder="unidade, kg, litro..." />
          </div>
          <Inp label="Nome do doador" value={fEnt.doador} onChange={e => setFEnt({ ...fEnt, doador: e.target.value })} placeholder="Nome da pessoa ou empresa (opcional)" />
          <Txta label="Observações" value={fEnt.observacao} onChange={e => setFEnt({ ...fEnt, observacao: e.target.value })} placeholder="Data de validade, condições do item..." />
          <hr className="divider" />
          <Btn size="lg" onClick={regEntrada} style={{ alignSelf: "flex-start" }}>⬇ Confirmar entrada</Btn>
        </div>
      </div>}

      {tab === "saida" && <div className="card">
        <h3 style={{ fontFamily: "var(--font-sans)", fontSize: 18, fontWeight: 800, marginBottom: 22 }}>Registrar distribuição de item</h3>
        {estoque.filter(i => i.quantidade > 0).length === 0
          ? <Empty icon="📦" title="Nenhum item disponível" sub="O estoque está vazio. Registre uma entrada antes de registrar uma saída." />
          : <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <Sel label="Item a distribuir" required value={fSai.itemId} onChange={e => setFSai({ ...fSai, itemId: e.target.value })}>
              <option value="">Selecione o item...</option>
              {estoque.filter(i => i.quantidade > 0).map(i => <option key={i.id} value={i.id}>{i.nome} — {i.quantidade} {i.unidade} disponíveis</option>)}
            </Sel>
            <div className="form-grid-2">
              <Inp label="Quantidade" required type="number" min="1" value={fSai.quantidade} onChange={e => setFSai({ ...fSai, quantidade: e.target.value })} placeholder="Ex: 1" />
              <Inp label="Nome do beneficiário" value={fSai.beneficiario} onChange={e => setFSai({ ...fSai, beneficiario: e.target.value })} placeholder="Nome da família (opcional)" />
            </div>
            <Txta label="Observações" value={fSai.observacao} onChange={e => setFSai({ ...fSai, observacao: e.target.value })} placeholder="Motivo ou observações da distribuição..." />
            <hr className="divider" />
            <Btn variant="accent" size="lg" onClick={regSaida} style={{ alignSelf: "flex-start" }}>⬆ Confirmar saída</Btn>
          </div>}
      </div>}

      {tab === "metas" && <>
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ fontFamily: "var(--font-sans)", fontSize: 18, fontWeight: 800, marginBottom: 22 }}>🎯 Definir meta de arrecadação</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div className="form-grid-2">
              <Inp label="Item" required value={fMeta.itemNome} onChange={e => setFMeta({ ...fMeta, itemNome: e.target.value })} placeholder="Ex: Cesta básica" />
              <Sel label="Categoria" value={fMeta.categoria} onChange={e => setFMeta({ ...fMeta, categoria: e.target.value })}>{CATEGORIAS.map(c => <option key={c}>{c}</option>)}</Sel>
            </div>
            <div className="form-grid-2">
              <Inp label="Quantidade da meta" required type="number" min="1" value={fMeta.meta} onChange={e => setFMeta({ ...fMeta, meta: e.target.value })} placeholder="Ex: 100" />
              <Inp label="Unidade" value={fMeta.unidade} onChange={e => setFMeta({ ...fMeta, unidade: e.target.value })} placeholder="unidade, kg..." />
            </div>
            <Sel label="Mês de referência" value={fMeta.mesAno} onChange={e => setFMeta({ ...fMeta, mesAno: e.target.value })}>
              {Array.from({ length: 12 }, (_, i) => { const d = new Date(); d.setMonth(d.getMonth() + i - 2); const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; return <option key={ym} value={ym}>{ymLabel(ym)}</option>; })}
            </Sel>
            <hr className="divider" />
            <Btn variant="purple" size="lg" onClick={addMeta} style={{ alignSelf: "flex-start" }}>🎯 Salvar meta</Btn>
          </div>
        </div>
        {metas.length === 0 ? <Empty icon="🎯" title="Nenhuma meta definida" sub="Defina metas mensais de arrecadação acima para acompanhar o progresso." />
          : [...new Set(metas.map(m => m.mesAno))].sort().reverse().map(ym => (
            <div key={ym} style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <h3 style={{ fontFamily: "var(--font-sans)", fontSize: 16, fontWeight: 700 }}>{ymLabel(ym)}</h3>
                {ym === mes && <Badge color="green">mês atual</Badge>}
              </div>
              {metas.filter(m => m.mesAno === ym).map(m => {
                const atual = estoque.find(i => i.nome.toLowerCase() === m.itemNome.toLowerCase())?.quantidade || 0;
                const pct = Math.min(100, Math.round((atual / m.meta) * 100));
                return <div key={m.id} className="card" style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <div>
                      <p style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 16 }}>{m.itemNome}</p>
                      <Badge color="gray">{m.categoria}</Badge>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontFamily: "var(--font-sans)", fontSize: 30, fontWeight: 800, color: pct >= 100 ? "var(--green-700)" : pct >= 60 ? "var(--amber-700)" : "var(--red-700)", lineHeight: 1 }}>{pct}%</p>
                      <p style={{ fontSize: 12, color: "var(--gray-400)", marginTop: 3 }}>{atual} de {m.meta} {m.unidade}</p>
                    </div>
                  </div>
                  <Progress value={atual} max={m.meta} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                    {pct < 100 ? <p style={{ fontSize: 13, color: "var(--amber-700)", fontWeight: 600 }}>Faltam {m.meta - atual} {m.unidade} para a meta</p>
                      : <p style={{ fontSize: 13, color: "var(--green-700)", fontWeight: 700 }}>✅ Meta atingida!</p>}
                    <button onClick={() => delMeta(m.id)} style={{ background: "var(--red-50)", border: "1px solid var(--red-100)", cursor: "pointer", color: "var(--red-700)", fontSize: 13, padding: "5px 12px", borderRadius: "var(--radius-xs)", fontFamily: "var(--font-sans)", fontWeight: 600 }}>🗑 Remover</button>
                  </div>
                </div>;
              })}
            </div>
          ))}
      </>}

      {tab === "historico" && <>
        <div className="stats-grid" style={{ gridTemplateColumns: "repeat(3,1fr)", marginBottom: 20 }}>
          <StatCard label="Total de entradas" value={movs.filter(m => m.tipo === "entrada").reduce((s, m) => s + m.quantidade, 0)} color="green" />
          <StatCard label="Total de saídas" value={movs.filter(m => m.tipo === "saida").reduce((s, m) => s + m.quantidade, 0)} color="amber" />
          <StatCard label="Nº de registros" value={movs.length} color="blue" />
        </div>
        {movs.length === 0 ? <Empty icon="📋" title="Nenhuma movimentação" sub="O histórico de entradas e saídas aparecerá aqui." />
          : movs.slice(0, 60).map(m => (
            <div key={m.id} className="card" style={{ marginBottom: 10, display: "flex", alignItems: "flex-start", gap: 16 }}>
              <div className="mov-icon" style={{ background: m.tipo === "entrada" ? "var(--green-100)" : "var(--amber-100)" }}>{m.tipo === "entrada" ? "⬇" : "⬆"}</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14 }}>{m.itemNome} <span style={{ fontWeight: 500, color: "var(--gray-500)" }}>— {m.quantidade} {m.unidade}</span></p>
                <p style={{ fontSize: 13, color: "var(--gray-400)", marginTop: 3 }}>{m.tipo === "entrada" ? `Doador: ${m.doador || "anônimo"}` : `Para: ${m.beneficiario || "distribuição geral"}`} · {fDate(m.data)}</p>
                {m.observacao && <p style={{ marginTop: 6, fontSize: 13, color: "var(--gray-500)", background: "var(--gray-50)", padding: "6px 10px", borderRadius: "var(--radius-xs)" }}>{m.observacao}</p>}
              </div>
              <Badge color={m.tipo === "entrada" ? "green" : "amber"}>{m.tipo === "entrada" ? "Entrada" : "Saída"}</Badge>
            </div>
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
    setView("list"); alert("✅ Atendimento registrado com sucesso!");
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
      <FormSection step="1" title="Selecionar beneficiário">
        {benSel
          ? <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--green-50)", padding: "14px 18px", borderRadius: "var(--radius-xs)", border: "1.5px solid var(--green-100)" }}>
            <div>
              <p style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 16 }}>{benSel.nome}</p>
              <p style={{ fontSize: 13, color: "var(--gray-500)", marginTop: 2 }}>📍 {benSel.bairro}</p>
            </div>
            <Btn variant="ghost" size="sm" onClick={() => setBenSel(null)}>Trocar</Btn>
          </div>
          : <>
            <input className="field-input" value={busca} onChange={e => setBusca(e.target.value)} placeholder="🔍  Digite o nome da família para buscar..." style={{ marginBottom: 8 }} />
            {busca && <div className="autocomplete-list">
              {benFiltrados.slice(0, 5).map(b => <div key={b.id} className="autocomplete-item" onClick={() => { setBenSel(b); setBusca(""); }}>
                <p style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14 }}>{b.nome}</p>
                <p style={{ fontSize: 12, color: "var(--gray-400)", marginTop: 2 }}>📍 {b.bairro}</p>
              </div>)}
              {benFiltrados.length === 0 && <p style={{ padding: "14px 18px", fontSize: 14, color: "var(--gray-400)" }}>Nenhuma família encontrada.</p>}
            </div>}
            {beneficiarios.length === 0 && <div className="alert alert-amber" style={{ marginTop: 10, marginBottom: 0 }}>
              <span className="alert-icon">⚠️</span>
              <p style={{ fontSize: 13, color: "var(--amber-700)" }}>Nenhuma família cadastrada. Vá até <strong>Beneficiários</strong> primeiro.</p>
            </div>}
          </>}
      </FormSection>

      <FormSection step="2" title="Itens a distribuir">
        {itens.map((it, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 100px auto", gap: 12, marginBottom: 12, alignItems: "end" }}>
            <Sel label={i === 0 ? "Item do estoque" : undefined} value={it.itemId} onChange={e => updItem(i, "itemId", e.target.value)}>
              <option value="">Selecione o item...</option>
              {estoque.filter(e => e.quantidade > 0).map(e => <option key={e.id} value={e.id}>{e.nome} — {e.quantidade} disponíveis</option>)}
            </Sel>
            <Inp label={i === 0 ? "Quantidade" : undefined} type="number" min="1" value={it.quantidade} onChange={e => updItem(i, "quantidade", e.target.value)} placeholder="1" />
            {itens.length > 1 && <button onClick={() => setItens(itens.filter((_, idx) => idx !== i))} style={{ background: "var(--red-50)", border: "1px solid var(--red-100)", cursor: "pointer", color: "var(--red-700)", fontSize: 14, padding: "11px 14px", borderRadius: "var(--radius-xs)", alignSelf: "flex-end", fontWeight: 700 }}>✕</button>}
          </div>
        ))}
        <Btn variant="ghost-green" size="sm" onClick={() => setItens([...itens, { itemId: "", quantidade: "" }])} style={{ marginTop: 4 }}>+ Adicionar outro item</Btn>
      </FormSection>

      <FormSection step="3" title="Informações do atendimento">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Inp label="Voluntário responsável" value={voluntario} onChange={e => setVoluntario(e.target.value)} placeholder="Nome do voluntário (opcional)" />
          <Txta label="Observações" value={obs} onChange={e => setObs(e.target.value)} placeholder="Situação da família, observações do atendimento..." />
        </div>
      </FormSection>

      <div style={{ display: "flex", gap: 12 }}>
        <Btn variant="purple" size="lg" onClick={registrar}>📝 Registrar atendimento</Btn>
        <Btn variant="ghost" size="lg" onClick={() => setView("list")}>Cancelar</Btn>
      </div>
    </div>
  );

  return (
    <div>
      <div className="section-header">
        <div>
          <h2 className="section-title-lg">Atendimentos</h2>
          <p className="section-sub">Registro de cada atendimento realizado pela instituição</p>
        </div>
        <Btn variant="purple" size="lg" onClick={() => setView("form")}>+ Novo atendimento</Btn>
      </div>
      <div className="stats-grid" style={{ gridTemplateColumns: "1fr 1fr", marginBottom: 20 }}>
        <StatCard label="Total de atendimentos" value={atendimentos.length} color="purple" />
        <StatCard label="Atendimentos este mês" value={atendimentos.filter(a => a.data?.startsWith(nowYM())).length} color="green" />
      </div>
      {mesesDisp.length > 0 && <div className="filter-row">
        {["todos", ...mesesDisp].map(m => <button key={m} className={`filter-pill${filtroMes === m ? " active" : ""}`} onClick={() => setFiltroMes(m)}>{m === "todos" ? "Todos os meses" : ymLabel(m)}</button>)}
      </div>}
      {atFilt.length === 0
        ? <Empty icon="📝" title="Nenhum atendimento registrado" sub="Clique em '+ Novo atendimento' para registrar o primeiro atendimento." />
        : atFilt.map(a => (
          <div key={a.id} className="card card-accent-purple" style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <p style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 16 }}>{a.beneficiarioNome || "Beneficiário não identificado"}</p>
                <p style={{ fontSize: 13, color: "var(--gray-400)", marginTop: 3 }}>📅 {fDate(a.data)}{a.voluntario && `  ·  👤 ${a.voluntario}`}</p>
              </div>
              <Badge color="purple">{(a.itens || []).length} {(a.itens || []).length === 1 ? "item" : "itens"}</Badge>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {(a.itens || []).map((it, i) => <span key={i} className="item-tag">{it.quantidade} {it.unidade} de {it.itemNome}</span>)}
            </div>
            {a.observacoes && <p style={{ marginTop: 12, fontSize: 13, color: "var(--gray-500)", background: "var(--gray-50)", padding: "10px 14px", borderRadius: "var(--radius-xs)", lineHeight: 1.6 }}>{a.observacoes}</p>}
          </div>
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
      <div className="section-header">
        <div>
          <h2 className="section-title-lg">Relatórios</h2>
          <p className="section-sub">Resumo geral e exportação de documentos</p>
        </div>
      </div>
      <div className="summary-banner">
        <p style={{ fontSize: 12, fontWeight: 700, opacity: 0.65, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Painel de impacto social</p>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em" }}>🦋 Sistema Partilhar</p>
        <div className="summary-stats">
          {[[beneficiarios.length, "Famílias"], [totalPessoas, "Pessoas"], [totalDist, "Itens distribuídos"], [doadores, "Doadores"]].map(([v, l]) => (
            <div key={l} className="summary-stat"><div className="summary-stat-val">{v}</div><div className="summary-stat-label">{l}</div></div>
          ))}
        </div>
      </div>

      <h3 style={{ fontFamily: "var(--font-sans)", fontSize: 17, fontWeight: 700, marginBottom: 14 }}>📄 Exportar relatórios</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
        {[
          ["beneficiarios", "👥", "Lista de beneficiários", `${beneficiarios.length} famílias com nome, CPF, endereço e necessidades`],
          ["atendimentos", "📝", "Registro de atendimentos", `${atendimentos.length} atendimentos com itens, datas e voluntários`],
          ["estoque", "📦", "Histórico de doações", `${movs.length} movimentações com entradas e saídas`],
        ].map(([tipo, icon, titulo, desc]) => (
          <div key={tipo} className="rel-export-card">
            <div style={{ display: "flex", alignItems: "center", gap: 16, flex: 1 }}>
              <span className="rel-export-icon">{icon}</span>
              <div><p className="rel-export-title">{titulo}</p><p className="rel-export-desc">{desc}</p></div>
            </div>
            <Btn variant="info" size="md" onClick={() => gerarRelatorio(tipo, dados)}>🖨 Gerar PDF</Btn>
          </div>
        ))}
      </div>

      <h3 style={{ fontFamily: "var(--font-sans)", fontSize: 17, fontWeight: 700, marginBottom: 14 }}>📊 Atividade — {ymLabel(mes)}</h3>
      <div className="stats-grid" style={{ marginBottom: 32 }}>
        <StatCard label="Atendimentos no mês" value={atendimentos.filter(a => a.data?.startsWith(mes)).length} color="purple" />
        <StatCard label="Itens recebidos" value={movs.filter(m => m.tipo === "entrada" && m.data?.startsWith(mes)).reduce((s, m) => s + m.quantidade, 0)} color="green" />
        <StatCard label="Itens distribuídos" value={movs.filter(m => m.tipo === "saida" && m.data?.startsWith(mes)).reduce((s, m) => s + m.quantidade, 0)} color="amber" />
        <StatCard label="Doadores ativos" value={[...new Set(movs.filter(m => m.tipo === "entrada" && m.doador && m.data?.startsWith(mes)).map(m => m.doador))].length} color="blue" />
      </div>

      <h3 style={{ fontFamily: "var(--font-sans)", fontSize: 17, fontWeight: 700, marginBottom: 16 }}>🏘 Distribuição por bairro</h3>
      {beneficiarios.length === 0 ? <Empty icon="🗺" title="Nenhum dado disponível" sub="Os dados por bairro aparecerão conforme as famílias forem cadastradas." />
        : [...new Set(beneficiarios.map(b => b.bairro).filter(Boolean))].sort().map(bairro => {
          const count = beneficiarios.filter(b => b.bairro === bairro).length;
          const pct = Math.round((count / beneficiarios.length) * 100);
          return <div key={bairro} style={{ marginBottom: 14 }}>
            <div className="bairro-row">
              <span className="bairro-name">{bairro}</span>
              <span className="bairro-count">{count} família{count !== 1 ? "s" : ""} · {pct}%</span>
            </div>
            <Progress value={count} max={beneficiarios.length} />
          </div>;
        })}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// APP
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
    const style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    Promise.all([sGet("beneficiarios"), sGet("atendimentos"), sGet("estoque"), sGet("movimentacoes"), sGet("metas")])
      .then(([b, a, e, m, mt]) => {
        setBeneficiarios(b || []); setAtendimentos(a || []); setEstoque(e || []);
        setMovs(m || []); setMetas(mt || []); setReady(true);
      });
  }, []);

  return (
    <>
      <header className="app-header">
        <div className="header-stripe" />
        <div className="header-inner">
          <div className="header-logo-wrap">
            <img src="/icon-512.png" alt="Logo Partilhar" />
          </div>
          <div>
            <div className="header-title">Sistema Partilhar</div>
            <div className="header-subtitle">Grupo Partilhar · Recife · dados salvos localmente</div>
          </div>
          <div className="header-badges">
            <div className="header-badge">
              <div className="header-badge-val">{beneficiarios.length}</div>
              <div className="header-badge-label">famílias</div>
            </div>
            <div className="header-badge">
              <div className="header-badge-val">{atendimentos.length}</div>
              <div className="header-badge-label">atendimentos</div>
            </div>
          </div>
        </div>
      </header>

      <nav className="desktop-nav">
        <div className="desktop-nav-inner">
          {NAV.map(n => (
            <button key={n.id} className={`nav-tab${mod === n.id ? " active" : ""}`} onClick={() => setMod(n.id)}>
              <span>{n.icon}</span> {n.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="page-wrap">
        <div className="page-content">
          {!ready ? (
            <div className="loading-wrap">
              <div className="loading-spinner" />
              <p style={{ color: "var(--gray-500)", fontSize: 14 }}>Carregando dados...</p>
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

      <nav className="mobile-nav">
        <div className="mobile-nav-inner">
          {NAV.map(n => (
            <button key={n.id} className={`mobile-nav-btn${mod === n.id ? " active" : ""}`} onClick={() => setMod(n.id)}>
              <span className="m-icon">{n.icon}</span>
              <span>{n.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}
