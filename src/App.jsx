import { useState, useEffect } from "react";
import db from "./db";

async function sGet(k) { try { const r = await db.kv.get(k); return r ? r.value : null; } catch { return null; } }
async function sSet(k, v) { try { await db.kv.put({ key: k, value: v }); } catch (e) { console.error(e); } }
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function fDate(iso) { return iso ? new Date(iso).toLocaleDateString("pt-BR") : "—"; }
function fCur(v) { return "R$ " + Number(v || 0).toFixed(2).replace(".", ","); }
function nowYM() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; }
function ymLabel(ym) { const [y, m] = ym.split("-"); return `${MESES[Number(m) - 1]} ${y}`; }

// ── Máscaras e validações ─────────────────────────────────────────
function mCPF(v) {
  return v.replace(/\D/g, "").slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}
function vCPF(c) {
  const x = c.replace(/\D/g, "");
  if (x.length !== 11 || /^(\d)\1+$/.test(x)) return false;
  let s = 0; for (let i = 0; i < 9; i++) s += parseInt(x[i]) * (10 - i);
  let r = (s * 10) % 11; if (r >= 10) r = 0;
  if (r !== parseInt(x[9])) return false;
  s = 0; for (let i = 0; i < 10; i++) s += parseInt(x[i]) * (11 - i);
  r = (s * 10) % 11; if (r >= 10) r = 0;
  return r === parseInt(x[10]);
}
function mTel(v) {
  const n = v.replace(/\D/g, "").slice(0, 11);
  if (n.length <= 10) return n.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").replace(/-$/, "");
  return n.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").replace(/-$/, "");
}
function vTel(v) { return v.replace(/\D/g, "").length >= 10; }
function mCEP(v) { return v.replace(/\D/g, "").slice(0, 8).replace(/(\d{5})(\d{0,3})/, "$1-$2").replace(/-$/, ""); }
function vCEP(v) { return v.replace(/\D/g, "").length === 8; }
function mNIS(v) {
  return v.replace(/\D/g, "").slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{5})(\d)/, "$1.$2")
    .replace(/(\d{2})(\d)/, "$1-$2");
}
function vNIS(v) { return v.replace(/\D/g, "").length === 11; }
function mCNPJ(v) {
  return v.replace(/\D/g, "").slice(0, 14)
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

const CATEGORIAS = ["Alimento", "Roupa", "Higiene", "Medicamento", "Brinquedo", "Móvel", "Outro"];
const BAIRROS = ["Afogados", "Boa Viagem", "Boa Vista", "Brasília Teimosa", "Cajueiro Seco", "Casa Amarela", "Casa Forte", "Cordeiro", "Derby", "Encruzilhada", "Espinheiro", "Graças", "Ibura", "Imbiribeira", "Iputinga", "Jardim São Paulo", "Madalena", "Mustardinha", "Pina", "Recife (Bairro)", "Santo Amaro", "Santo Antônio", "Sancho", "Torrões", "Várzea", "Outro"];
const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const ESCOLARIDADES = ["Não alfabetizado", "Fundamental incompleto", "Fundamental completo", "Médio incompleto", "Médio completo", "Superior incompleto", "Superior completo", "Pós-graduação"];
const MORADIAS = ["Própria", "Alugada", "De parentes", "Em situação de rua", "Cedida", "Outro"];
const SEXOS = ["Feminino", "Masculino", "Outro", "Prefere não informar"];

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Lato:wght@400;700&family=Quicksand:wght@500;600;700&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --green-900:#0F3D25; --green-800:#155E3E; --green-700:#1A7A50; --green-600:#21956A; --green-500:#A3D900; --green-100:#DCFCE7; --green-50:#F0FDF4;
  --amber-700:#B45309; --amber-100:#FEF3C7; --amber-50:#FFFBEB;
  --red-700:#B91C1C; --red-100:#FEE2E2; --red-50:#FFF5F5;
  --blue-700:#1D4ED8; --blue-100:#DBEAFE; --blue-50:#EFF6FF;
  --purple-700:#6D28D9; --purple-100:#EDE9FE; --purple-50:#F5F3FF;
  --pink-600:#DB2777; --pink-100:#FCE7F3; --pink-50:#FDF2F8;
  --gray-900:#111827; --gray-800:#1F2937; --gray-700:#374151; --gray-600:#4B5563; --gray-500:#6B7280; --gray-400:#9CA3AF; --gray-300:#D1D5DB; --gray-200:#E5E7EB; --gray-100:#F3F4F6; --gray-50:#F9FAFB; --white:#FFFFFF;
  --bg:#F1F3F5; --border:#E2E8F0;
  --font-sans:'Inter','Segoe UI',sans-serif; --font-body:'Lato','Segoe UI',sans-serif;
  --radius-xs:6px; --radius-sm:10px; --radius:14px; --radius-lg:20px;
  --shadow-xs:0 1px 2px rgba(0,0,0,0.05);
  --shadow-sm:0 1px 3px rgba(0,0,0,0.07),0 1px 2px rgba(0,0,0,0.05);
  --shadow:0 4px 16px rgba(0,0,0,0.08),0 1px 4px rgba(0,0,0,0.04);
  --shadow-md:0 8px 24px rgba(0,0,0,0.10),0 2px 6px rgba(0,0,0,0.05);
  --shadow-lg:0 16px 48px rgba(0,0,0,0.12),0 4px 12px rgba(0,0,0,0.06);
}
body { font-family: var(--font-body); background: var(--bg); color: var(--gray-900); -webkit-font-smoothing: antialiased; font-size: 15px; line-height: 1.6; }
input, select, textarea, button { font-family: var(--font-body); }

/* HEADER */
.app-header { background: var(--green-800); position: sticky; top: 0; z-index: 200; box-shadow: 0 2px 20px rgba(0,0,0,0.2); }
.header-stripe { height: 4px; background: linear-gradient(90deg, #F472B6, #FDE047, #F472B6); }
.header-inner { max-width: 1080px; margin: 0 auto; display: flex; align-items: center; gap: 18px; padding: 14px 24px; }
.header-logo-svg { height: 60px; flex-shrink: 0; }
.header-badges { display: flex; gap: 10px; margin-left: auto; }
.header-badge { background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2); border-radius: 12px; padding: 8px 16px; text-align: center; min-width: 72px; }
.header-badge-val { font-family: var(--font-sans); font-size: 20px; font-weight: 800; color: #fff; line-height: 1; }
.header-badge-label { font-size: 10px; color: rgba(255,255,255,0.65); margin-top: 3px; text-transform: uppercase; letter-spacing: 0.04em; }

/* NAV */
.desktop-nav { background: var(--green-900); border-bottom: 1px solid rgba(255,255,255,0.08); }
.desktop-nav-inner { max-width: 1080px; margin: 0 auto; display: flex; padding: 0 24px; overflow-x: auto; }
.nav-tab { padding: 14px 20px; border: none; background: none; cursor: pointer; font-family: var(--font-sans); font-weight: 600; font-size: 13.5px; color: rgba(255,255,255,0.55); border-bottom: 3px solid transparent; transition: all 0.2s; white-space: nowrap; display: flex; align-items: center; gap: 7px; }
.nav-tab:hover { color: rgba(255,255,255,0.85); background: rgba(255,255,255,0.05); }
.nav-tab.active { color: #fff; border-bottom-color: #F472B6; }

.mobile-nav { display: none; position: fixed; bottom: 0; left: 0; right: 0; z-index: 200; background: var(--white); border-top: 1px solid var(--border); box-shadow: 0 -4px 24px rgba(0,0,0,0.1); padding-bottom: env(safe-area-inset-bottom); }
.mobile-nav-inner { display: flex; }
.mobile-nav-btn { flex: 1; border: none; background: none; cursor: pointer; font-family: var(--font-sans); font-weight: 600; font-size: 9.5px; color: var(--gray-400); padding: 9px 2px 11px; display: flex; flex-direction: column; align-items: center; gap: 4px; position: relative; }
.mobile-nav-btn.active { color: var(--green-700); }
.mobile-nav-btn .m-icon { font-size: 20px; line-height: 1; }
.mobile-nav-btn::after { content: ''; position: absolute; top: 0; left: 20%; right: 20%; height: 3px; border-radius: 0 0 3px 3px; background: #F472B6; transform: scaleX(0); transition: transform 0.2s; }
.mobile-nav-btn.active::after { transform: scaleX(1); }

@media (max-width: 720px) {
  .desktop-nav { display: none; } .mobile-nav { display: block; }
  .header-inner { padding: 10px 14px; gap: 12px; }
  .header-logo-svg { height: 44px; }
  .header-badge { padding: 6px 10px; min-width: 50px; } .header-badge-val { font-size: 16px; }
}

/* LAYOUT */
.page-wrap { max-width: 1080px; margin: 0 auto; padding: 0 24px; }
.page-content { padding: 28px 0 110px; }
@media (max-width: 720px) { .page-wrap { padding: 0 14px; } .page-content { padding: 18px 0 95px; } }

/* SECTION */
.section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
.section-title-lg { font-family: var(--font-sans); font-size: 22px; font-weight: 800; color: var(--gray-900); letter-spacing: -0.02em; }
.section-sub { font-size: 14px; color: var(--gray-500); margin-top: 2px; }

/* CARDS */
.card { background: var(--white); border-radius: var(--radius); border: 1px solid var(--border); padding: 20px 22px; box-shadow: var(--shadow-sm); transition: box-shadow 0.2s, transform 0.2s; }
.card-hover { cursor: pointer; }
.card-hover:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
.card-accent-green { border-left: 4px solid var(--green-600); }
.card-accent-purple { border-left: 4px solid var(--purple-700); }
.card-accent-pink { border-left: 4px solid #DB2777; }

/* STATS */
.stats-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; margin-bottom: 24px; }
.stat-card { background: var(--white); border-radius: var(--radius-sm); border: 1px solid var(--border); padding: 18px 20px; box-shadow: var(--shadow-sm); position: relative; overflow: hidden; }
.stat-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; }
.stat-card.green::before { background: var(--green-600); }
.stat-card.amber::before { background: var(--amber-700); }
.stat-card.blue::before { background: var(--blue-700); }
.stat-card.purple::before { background: var(--purple-700); }
.stat-card.red::before { background: var(--red-700); }
.stat-card.pink::before { background: #DB2777; }
.stat-label { font-family: var(--font-sans); font-size: 11px; font-weight: 700; color: var(--gray-500); text-transform: uppercase; letter-spacing: 0.07em; }
.stat-value { font-family: var(--font-sans); font-size: 32px; font-weight: 800; line-height: 1.1; margin-top: 6px; }
.stat-card.green .stat-value { color: var(--green-700); }
.stat-card.amber .stat-value { color: var(--amber-700); }
.stat-card.blue .stat-value { color: var(--blue-700); }
.stat-card.purple .stat-value { color: var(--purple-700); }
.stat-card.red .stat-value { color: var(--red-700); }
.stat-card.pink .stat-value { color: #DB2777; }
@media (max-width: 720px) { .stats-grid { grid-template-columns: 1fr 1fr; } .stat-value { font-size: 26px; } }

/* FORMS */
.form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.form-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }
.form-grid-4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 12px; }
@media (max-width: 720px) { .form-grid-2, .form-grid-3, .form-grid-4 { grid-template-columns: 1fr; } }

.field { display: flex; flex-direction: column; gap: 6px; }
.field-label { font-family: var(--font-sans); font-size: 12px; font-weight: 700; color: var(--gray-600); text-transform: uppercase; letter-spacing: 0.06em; }
.field-required { color: var(--red-700); margin-left: 2px; }
.field-hint { font-size: 11px; color: var(--gray-400); margin-top: 3px; }
.field-input { padding: 11px 14px; border-radius: var(--radius-xs); border: 1.5px solid var(--gray-300); font-size: 15px; color: var(--gray-900); background: var(--white); outline: none; width: 100%; transition: border-color 0.15s, box-shadow 0.15s; box-shadow: var(--shadow-xs); }
.field-input:focus { border-color: var(--green-600); box-shadow: 0 0 0 3px rgba(33,149,106,0.15); }
.field-input.error { border-color: var(--red-700); box-shadow: 0 0 0 3px rgba(185,28,28,0.1); }
.field-input::placeholder { color: var(--gray-400); }
.field-input:disabled { background: var(--gray-100); color: var(--gray-400); cursor: not-allowed; }
textarea.field-input { resize: vertical; min-height: 80px; line-height: 1.6; }
.field-error { font-size: 12px; color: var(--red-700); font-weight: 600; margin-top: 3px; display: flex; align-items: center; gap: 4px; }

/* CHECKBOX */
.checkbox-row { display: flex; align-items: center; gap: 10px; cursor: pointer; user-select: none; padding: 10px 14px; background: var(--gray-50); border-radius: var(--radius-xs); border: 1.5px solid var(--gray-200); transition: all 0.15s; }
.checkbox-row:hover { background: var(--green-50); border-color: var(--green-100); }
.checkbox-row.checked { background: var(--green-50); border-color: var(--green-600); }
.checkbox-row input { width: 18px; height: 18px; cursor: pointer; accent-color: var(--green-700); }
.checkbox-row label { font-size: 14px; font-weight: 600; color: var(--gray-700); cursor: pointer; flex: 1; }

/* RADIO group */
.radio-group { display: flex; flex-wrap: wrap; gap: 8px; }
.radio-pill { padding: 8px 14px; border-radius: 99px; border: 1.5px solid var(--gray-300); background: var(--white); color: var(--gray-600); cursor: pointer; font-family: var(--font-sans); font-size: 13px; font-weight: 600; transition: all 0.15s; }
.radio-pill:hover { border-color: var(--green-600); color: var(--green-700); }
.radio-pill.selected { background: var(--green-700); color: #fff; border-color: var(--green-700); }

/* BTN */
.btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; border: none; border-radius: var(--radius-xs); cursor: pointer; font-family: var(--font-sans); font-weight: 700; transition: all 0.18s; white-space: nowrap; }
.btn:active { transform: scale(0.97); }
.btn-lg { padding: 13px 28px; font-size: 15px; border-radius: var(--radius-sm); }
.btn-md { padding: 10px 22px; font-size: 14px; }
.btn-sm { padding: 7px 16px; font-size: 13px; }
.btn-primary { background: var(--green-700); color: #fff; box-shadow: 0 2px 8px rgba(26,122,80,0.3); }
.btn-primary:hover { background: var(--green-800); }
.btn-accent { background: var(--amber-700); color: #fff; }
.btn-accent:hover { background: #92400E; }
.btn-danger { background: var(--red-700); color: #fff; }
.btn-info { background: var(--blue-700); color: #fff; }
.btn-purple { background: var(--purple-700); color: #fff; box-shadow: 0 2px 8px rgba(109,40,217,0.3); }
.btn-purple:hover { background: #5B21B6; }
.btn-pink { background: #DB2777; color: #fff; box-shadow: 0 2px 8px rgba(219,39,119,0.3); }
.btn-pink:hover { background: #BE185D; }
.btn-ghost { background: var(--white); color: var(--gray-600); border: 1.5px solid var(--gray-300); box-shadow: var(--shadow-xs); }
.btn-ghost:hover { background: var(--gray-50); color: var(--gray-900); }
.btn-ghost-green { background: var(--green-50); color: var(--green-700); border: 1.5px solid var(--green-100); }
.btn-ghost-green:hover { background: var(--green-100); }

/* BADGES */
.badge { display: inline-flex; align-items: center; gap: 4px; font-family: var(--font-sans); font-size: 11.5px; font-weight: 700; padding: 3px 10px; border-radius: 99px; white-space: nowrap; }
.badge-green { background: var(--green-100); color: var(--green-800); }
.badge-amber { background: var(--amber-100); color: var(--amber-700); }
.badge-red { background: var(--red-100); color: var(--red-700); }
.badge-blue { background: var(--blue-100); color: var(--blue-700); }
.badge-purple { background: var(--purple-100); color: var(--purple-700); }
.badge-gray { background: var(--gray-100); color: var(--gray-600); }
.badge-pink { background: var(--pink-100); color: var(--pink-600); }

/* ALERT */
.alert { border-radius: var(--radius-sm); padding: 14px 18px; display: flex; align-items: flex-start; gap: 12px; margin-bottom: 18px; border: 1px solid; }
.alert-icon { font-size: 20px; flex-shrink: 0; margin-top: 1px; }
.alert-red { background: var(--red-50); border-color: #FCA5A5; }
.alert-amber { background: var(--amber-50); border-color: #FCD34D; }
.alert-green { background: var(--green-50); border-color: var(--green-100); }

/* PROGRESS */
.progress-track { background: var(--gray-100); border-radius: 99px; height: 10px; overflow: hidden; }
.progress-fill { height: 100%; border-radius: 99px; transition: width 0.6s ease; }

/* EMPTY */
.empty-state { text-align: center; padding: 64px 24px; background: var(--white); border-radius: var(--radius); border: 1.5px dashed var(--gray-300); }
.empty-icon { font-size: 52px; margin-bottom: 16px; opacity: 0.5; display: block; }
.empty-title { font-family: var(--font-sans); font-size: 16px; font-weight: 700; color: var(--gray-700); margin-bottom: 6px; }
.empty-sub { font-size: 14px; color: var(--gray-500); line-height: 1.6; }

/* SEARCH & TABS */
.search-wrap { display: flex; gap: 12px; align-items: center; margin-bottom: 20px; flex-wrap: wrap; }
.search-input { flex: 1; min-width: 220px; padding: 12px 18px; border-radius: var(--radius-sm); border: 1.5px solid var(--gray-300); font-size: 15px; color: var(--gray-900); background: var(--white); outline: none; box-shadow: var(--shadow-sm); transition: all 0.15s; }
.search-input:focus { border-color: var(--green-600); box-shadow: 0 0 0 3px rgba(33,149,106,0.12); }

.inner-tabs { display: flex; gap: 4px; background: var(--gray-100); padding: 5px; border-radius: var(--radius-sm); flex-wrap: wrap; margin-bottom: 22px; border: 1px solid var(--gray-200); }
.inner-tab { padding: 9px 16px; border-radius: var(--radius-xs); border: none; cursor: pointer; font-family: var(--font-sans); font-weight: 600; font-size: 13.5px; background: transparent; color: var(--gray-500); transition: all 0.15s; white-space: nowrap; }
.inner-tab:hover:not(.active) { background: var(--white); color: var(--gray-800); }
.inner-tab.active { background: var(--white); color: var(--green-800); box-shadow: var(--shadow-sm); font-weight: 700; border: 1px solid var(--gray-200); }

.filter-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 18px; }
.filter-pill { padding: 6px 16px; border-radius: 99px; border: 1.5px solid var(--gray-300); background: var(--white); color: var(--gray-600); cursor: pointer; font-family: var(--font-sans); font-size: 13px; font-weight: 600; transition: all 0.15s; box-shadow: var(--shadow-xs); }
.filter-pill:hover { border-color: var(--green-600); color: var(--green-700); }
.filter-pill.active { background: var(--green-700); color: #fff; border-color: var(--green-700); }

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
@media (max-width: 720px) { .detail-grid { grid-template-columns: 1fr; } }

/* FORM SECTION */
.form-section { background: var(--white); border-radius: var(--radius); border: 1px solid var(--border); padding: 22px 24px; box-shadow: var(--shadow-sm); margin-bottom: 14px; }
.form-section-header { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; }
.form-step-num { width: 30px; height: 30px; border-radius: 50%; background: var(--green-700); color: #fff; font-family: var(--font-sans); font-size: 14px; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.form-step-title { font-family: var(--font-sans); font-size: 15px; font-weight: 700; color: var(--gray-800); }

/* BANNER */
.summary-banner { background: linear-gradient(135deg, var(--green-900) 0%, var(--green-700) 60%, var(--green-600) 100%); border-radius: var(--radius-lg); padding: 28px 32px; color: #fff; margin-bottom: 28px; box-shadow: var(--shadow-lg); position: relative; overflow: hidden; }
.summary-banner::after { content: ''; position: absolute; top: -40px; right: -40px; width: 180px; height: 180px; background: rgba(255,255,255,0.05); border-radius: 50%; }
.summary-stats { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; margin-top: 20px; }
.summary-stat { background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.15); border-radius: var(--radius-sm); padding: 14px 16px; }
.summary-stat-val { font-family: var(--font-sans); font-size: 28px; font-weight: 800; color: #fff; line-height: 1; }
.summary-stat-label { font-size: 11px; color: rgba(255,255,255,0.7); margin-top: 4px; text-transform: uppercase; letter-spacing: 0.05em; }
@media (max-width: 720px) { .summary-banner { padding: 20px; border-radius: var(--radius); } .summary-stats { grid-template-columns: 1fr 1fr; } }

.autocomplete-list { background: var(--white); border: 1.5px solid var(--gray-200); border-radius: var(--radius-sm); overflow: hidden; box-shadow: var(--shadow-md); margin-top: 4px; }
.autocomplete-item { padding: 13px 16px; cursor: pointer; border-bottom: 1px solid var(--gray-100); }
.autocomplete-item:last-child { border-bottom: none; }
.autocomplete-item:hover { background: var(--green-50); }

.rel-export-card { background: var(--white); border-radius: var(--radius-sm); border: 1px solid var(--border); padding: 18px 22px; display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; box-shadow: var(--shadow-sm); }
.rel-export-icon { font-size: 28px; flex-shrink: 0; }
.rel-export-title { font-family: var(--font-sans); font-size: 15px; font-weight: 700; color: var(--gray-900); }
.rel-export-desc { font-size: 13px; color: var(--gray-500); margin-top: 2px; }

.bairro-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.bairro-name { font-size: 14px; font-weight: 600; color: var(--gray-700); }
.bairro-count { font-size: 13px; color: var(--gray-500); }

.loading-wrap { text-align: center; padding: 80px 24px; }
.loading-spinner { width: 40px; height: 40px; border-radius: 50%; border: 3px solid var(--gray-200); border-top-color: var(--green-600); animation: spin 0.8s linear infinite; margin: 0 auto 16px; }
@keyframes spin { to { transform: rotate(360deg); } }

/* TABLE - Famílias */
.fam-table-wrap { background: var(--white); border-radius: var(--radius); border: 1px solid var(--border); overflow-x: auto; box-shadow: var(--shadow-sm); }
.fam-table { width: 100%; border-collapse: collapse; min-width: 720px; }
.fam-table th { background: var(--green-700); color: #fff; padding: 12px 14px; text-align: left; font-family: var(--font-sans); font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; }
.fam-table td { padding: 12px 14px; border-bottom: 1px solid var(--gray-100); font-size: 13.5px; }
.fam-table tr:hover td { background: var(--gray-50); }
.fam-table .num-col { text-align: center; font-weight: 700; color: var(--gray-500); width: 40px; }
.fam-table .age-col { text-align: center; width: 60px; font-family: var(--font-sans); font-weight: 700; }
.fam-table .action-col { width: 50px; text-align: center; }

::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-thumb { background: var(--gray-300); border-radius: 99px; }
`;

// ── Logo SVG (Partilhar) ──────────────────────────────────────────
function PartilharLogo() {
  return (
    <svg className="header-logo-svg" viewBox="0 0 340 90" xmlns="http://www.w3.org/2000/svg">
      {/* Butterfly */}
      <g transform="translate(8, 15)">
        {/* Top wings - pink */}
        <ellipse cx="20" cy="22" rx="20" ry="14" fill="#F472B6" stroke="#7F2A4D" strokeWidth="1.2" transform="rotate(-25 20 22)" />
        <ellipse cx="58" cy="22" rx="20" ry="14" fill="#F472B6" stroke="#7F2A4D" strokeWidth="1.2" transform="rotate(25 58 22)" />
        {/* Bottom wings - pink */}
        <ellipse cx="22" cy="46" rx="15" ry="11" fill="#F472B6" stroke="#7F2A4D" strokeWidth="1.2" transform="rotate(20 22 46)" />
        <ellipse cx="56" cy="46" rx="15" ry="11" fill="#F472B6" stroke="#7F2A4D" strokeWidth="1.2" transform="rotate(-20 56 46)" />
        {/* Yellow spots */}
        <ellipse cx="20" cy="22" rx="11" ry="7" fill="#FDE047" transform="rotate(-25 20 22)" />
        <ellipse cx="58" cy="22" rx="11" ry="7" fill="#FDE047" transform="rotate(25 58 22)" />
        <ellipse cx="22" cy="46" rx="8" ry="6" fill="#FDE047" transform="rotate(20 22 46)" />
        <ellipse cx="56" cy="46" rx="8" ry="6" fill="#FDE047" transform="rotate(-20 56 46)" />
        {/* Body */}
        <ellipse cx="39" cy="34" rx="2.5" ry="20" fill="#7F2A4D" />
        <circle cx="39" cy="14" r="2.8" fill="#7F2A4D" />
        {/* Antennae */}
        <path d="M37 11 Q 32 4, 29 6" stroke="#7F2A4D" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        <path d="M41 11 Q 46 4, 49 6" stroke="#7F2A4D" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        <circle cx="29" cy="6" r="1" fill="#7F2A4D" />
        <circle cx="49" cy="6" r="1" fill="#7F2A4D" />
      </g>
      {/* Text */}
      <text x="92" y="24" fontFamily="Inter, sans-serif" fontSize="11" fill="rgba(255,255,255,0.7)" fontWeight="600" letterSpacing="1.5">GRUPO</text>
      <text x="92" y="62" fontFamily="Quicksand, sans-serif" fontSize="38" fill="#A3D900" fontWeight="700">Partilhar</text>
      <text x="94" y="80" fontFamily="Inter, sans-serif" fontSize="9" fill="rgba(255,255,255,0.6)" letterSpacing="2.5" fontWeight="500">ILUMINANDO CAMINHOS</text>
    </svg>
  );
}

// ── Componentes base ──────────────────────────────────────────────
function Inp({ label, required, hint, error, style: s, ...p }) {
  return (
    <div className="field">
      {label && <label className="field-label">{label}{required && <span className="field-required">*</span>}</label>}
      <input className={`field-input${error ? " error" : ""}`} style={s} {...p} />
      {hint && !error && <span className="field-hint">{hint}</span>}
      {error && <span className="field-error">⚠ {error}</span>}
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
function RadioGroup({ label, value, options, onChange }) {
  return (
    <div className="field">
      {label && <label className="field-label">{label}</label>}
      <div className="radio-group">
        {options.map(o => (
          <button key={o} type="button" className={`radio-pill${value === o ? " selected" : ""}`} onClick={() => onChange(o)}>{o}</button>
        ))}
      </div>
    </div>
  );
}
function Btn({ children, variant = "primary", size = "md", onClick, type = "button", style: s }) {
  return <button type={type} onClick={onClick} style={s} className={`btn btn-${size} btn-${variant}`}>{children}</button>;
}
function StatCard({ label, value, color = "green" }) {
  return <div className={`stat-card ${color}`}><div className="stat-label">{label}</div><div className="stat-value">{value}</div></div>;
}
function Badge({ children, color = "green" }) { return <span className={`badge badge-${color}`}>{children}</span>; }
function Empty({ icon, title, sub }) {
  return <div className="empty-state"><span className="empty-icon">{icon}</span><p className="empty-title">{title}</p>{sub && <p className="empty-sub">{sub}</p>}</div>;
}
function Progress({ value, max }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const col = pct >= 100 ? "var(--green-600)" : pct >= 60 ? "var(--green-700)" : pct >= 30 ? "var(--amber-700)" : "var(--red-700)";
  return <div className="progress-track"><div className="progress-fill" style={{ width: `${pct}%`, background: col }} /></div>;
}
function InnerTabs({ tabs, active, onChange }) {
  return <div className="inner-tabs">{tabs.map(([k, l]) => <button key={k} className={`inner-tab${active === k ? " active" : ""}`} onClick={() => onChange(k)}>{l}</button>)}</div>;
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

// ── Relatórios ────────────────────────────────────────────────────
function gerarRelatorio(tipo, dados) {
  const { beneficiarios = [], atendimentos = [], movs = [] } = dados;
  const now = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  const th = `background:#155E3E;color:#fff;padding:11px 14px;text-align:left;font-size:13px;font-weight:600`;
  const td = `padding:11px 14px;border-bottom:1px solid #F3F4F6;font-size:13px;vertical-align:top`;
  let body = "";
  if (tipo === "beneficiarios") {
    body = `<h2 style="margin:0 0 18px;font-size:18px">Beneficiários — ${beneficiarios.length} famílias</h2>
      <table width="100%" cellspacing="0" style="border-collapse:collapse;border:1px solid #E5E7EB">
        <tr><th style="${th}">Nome</th><th style="${th}">CPF</th><th style="${th}">NIS</th><th style="${th}">Bairro</th><th style="${th}">Pessoas</th><th style="${th}">Renda</th><th style="${th}">Necessidades</th></tr>
        ${beneficiarios.map((b, i) => `<tr style="background:${i % 2 ? "#F9FAFB" : "#fff"}"><td style="${td}">${b.nome}</td><td style="${td}">${b.cpf || "—"}</td><td style="${td}">${b.temNIS && b.nis ? b.nis : "—"}</td><td style="${td}">${b.bairro || "—"}</td><td style="${td}">${b.numPessoas || "—"}</td><td style="${td}">${b.renda ? fCur(b.renda) : "—"}</td><td style="${td}">${b.necessidades || "—"}</td></tr>`).join("")}
      </table>`;
  } else if (tipo === "atendimentos") {
    body = `<h2 style="margin:0 0 18px;font-size:18px">Atendimentos — ${atendimentos.length}</h2>
      <table width="100%" cellspacing="0" style="border-collapse:collapse;border:1px solid #E5E7EB">
        <tr><th style="${th}">Data</th><th style="${th}">Beneficiário</th><th style="${th}">Itens</th><th style="${th}">Voluntário</th></tr>
        ${atendimentos.map((a, i) => `<tr style="background:${i % 2 ? "#F9FAFB" : "#fff"}"><td style="${td}">${fDate(a.data)}</td><td style="${td}">${a.beneficiarioNome || "—"}</td><td style="${td}">${(a.itens || []).map(x => `${x.quantidade} ${x.unidade} de ${x.itemNome}`).join(", ")}</td><td style="${td}">${a.voluntario || "—"}</td></tr>`).join("")}
      </table>`;
  } else {
    const ent = movs.filter(m => m.tipo === "entrada").reduce((s, m) => s + m.quantidade, 0);
    const sai = movs.filter(m => m.tipo === "saida").reduce((s, m) => s + m.quantidade, 0);
    body = `<h2 style="margin:0 0 8px;font-size:18px">Histórico de doações — ${movs.length}</h2>
      <p style="margin:0 0 18px;color:#6B7280">Entradas: <strong>${ent}</strong> · Saídas: <strong>${sai}</strong></p>
      <table width="100%" cellspacing="0" style="border-collapse:collapse;border:1px solid #E5E7EB">
        <tr><th style="${th}">Data</th><th style="${th}">Tipo</th><th style="${th}">Item</th><th style="${th}">Qtd</th><th style="${th}">Origem/Destino</th></tr>
        ${movs.map((m, i) => `<tr style="background:${i % 2 ? "#F9FAFB" : "#fff"}"><td style="${td}">${fDate(m.data)}</td><td style="${td};color:${m.tipo === "entrada" ? "#1A7A50" : "#B45309"};font-weight:700">${m.tipo === "entrada" ? "⬇ Entrada" : "⬆ Saída"}</td><td style="${td}">${m.itemNome}</td><td style="${td}">${m.quantidade} ${m.unidade}</td><td style="${td}">${m.tipo === "entrada" ? (m.doador || "anônimo") : (m.beneficiario || "geral")}</td></tr>`).join("")}
      </table>`;
  }
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Relatório · Sistema Partilhar</title>
    <style>body{font-family:Georgia,serif;max-width:960px;margin:0 auto;padding:40px 32px;color:#111827}@media print{.no-print{display:none}}</style></head><body>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:32px;padding-bottom:20px;border-bottom:3px solid #155E3E">
      <div><h1 style="margin:0;color:#155E3E;font-size:26px">🦋 Sistema Partilhar</h1><p style="margin:8px 0 0;font-size:14px;color:#6B7280">Relatório gerado em ${now}</p></div>
      <button class="no-print" onclick="window.print()" style="background:#155E3E;color:#fff;border:none;padding:13px 26px;border-radius:10px;cursor:pointer;font-size:14px;font-weight:700">🖨 Imprimir / Salvar PDF</button>
    </div>${body}</body></html>`;
  const w = window.open("", "_blank");
  if (w) { w.document.write(html); w.document.close(); }
}

function gerarRelatorioFamilia(entidade, familias) {
  const now = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  const th = `background:#155E3E;color:#fff;padding:10px;text-align:left;font-size:12px;font-weight:600`;
  const td = `padding:8px 10px;border:1px solid #E5E7EB;font-size:12px;vertical-align:top`;
  const total = (f, faixa) => Number(f[faixa] || 0);
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Cadastro de Família</title>
    <style>body{font-family:Arial,sans-serif;max-width:1100px;margin:0 auto;padding:30px;color:#111}@media print{.no-print{display:none}}</style></head><body>
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px">
      <h1 style="margin:0;font-size:22px;color:#155E3E">📋 CADASTRO DE FAMÍLIA</h1>
      <button class="no-print" onclick="window.print()" style="background:#155E3E;color:#fff;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:700">🖨 Imprimir / Salvar PDF</button>
    </div>
    <table width="100%" style="border-collapse:collapse;margin-bottom:20px">
      <tr><td style="padding:6px 0;font-size:13px"><strong>Nome da Entidade:</strong> ${entidade.nome || "—"}</td><td style="padding:6px 0;font-size:13px"><strong>CNPJ:</strong> ${entidade.cnpj || "—"}</td></tr>
      <tr><td style="padding:6px 0;font-size:13px" colspan="2"><strong>Endereço:</strong> ${entidade.endereco || "—"}</td></tr>
      <tr><td style="padding:6px 0;font-size:13px"><strong>Telefone:</strong> ${entidade.telefone || "—"}</td><td style="padding:6px 0;font-size:13px"><strong>Responsável Legal:</strong> ${entidade.responsavel || "—"}</td></tr>
      <tr><td style="padding:6px 0;font-size:13px"><strong>CPF do Responsável:</strong> ${entidade.cpfResp || "—"}</td><td style="padding:6px 0;font-size:13px"><strong>Data:</strong> ${now}</td></tr>
    </table>
    <table width="100%" style="border-collapse:collapse;border:1px solid #E5E7EB">
      <tr>
        <th style="${th}">Nº</th>
        <th style="${th}">Nome do Chefe de Família / CPF</th>
        <th style="${th}">Nome da Mãe do Chefe</th>
        <th style="${th}">Endereço</th>
        <th style="${th}">NIS</th>
        <th style="${th}">0-6</th><th style="${th}">7-14</th><th style="${th}">15-23</th><th style="${th}">24-65</th><th style="${th}">+65</th>
      </tr>
      ${familias.map((f, i) => `<tr>
        <td style="${td};text-align:center;font-weight:700">${i + 1}</td>
        <td style="${td}"><strong>${f.chefeNome || "—"}</strong><br/><span style="color:#6B7280">CPF: ${f.chefeCPF || "—"}</span></td>
        <td style="${td}">${f.maeNome || "—"}</td>
        <td style="${td}">${f.endereco || "—"}</td>
        <td style="${td}">${f.nis || "—"}</td>
        <td style="${td};text-align:center">${total(f, "faixa1") || ""}</td>
        <td style="${td};text-align:center">${total(f, "faixa2") || ""}</td>
        <td style="${td};text-align:center">${total(f, "faixa3") || ""}</td>
        <td style="${td};text-align:center">${total(f, "faixa4") || ""}</td>
        <td style="${td};text-align:center">${total(f, "faixa5") || ""}</td>
      </tr>`).join("")}
    </table>
    <p style="font-size:11px;color:#6B7280;margin-top:8px">Obs: Pessoas / Idade — informar a quantidade por faixa etária</p>
    </body></html>`;
  const w = window.open("", "_blank");
  if (w) { w.document.write(html); w.document.close(); }
}

// ══════════════════════════════════════════════════════════════════
// BENEFICIÁRIOS — Ficha de Serviço Social expandida
// ══════════════════════════════════════════════════════════════════
function BeneficiariosModule({ beneficiarios, setBeneficiarios, atendimentos }) {
  const [view, setView] = useState("list");
  const [sel, setSel] = useState(null);
  const [search, setSearch] = useState("");
  const EF = {
    // Identificação
    nome: "", dataNascimento: "", sexo: "", nomeMae: "",
    // Documentos
    rg: "", cpf: "", temNIS: false, nis: "",
    // Educação
    escolaridade: "", religiao: "",
    // Contato e endereço
    telefone: "", cep: "", endereco: "", numero: "", complemento: "", bairro: "", pontoReferencia: "",
    // Família
    numPessoas: "", idadesPessoas: "", composicaoFamiliar: "", relacionamentoFamiliar: "",
    // Trabalho e renda
    profissao: "", ondeTrabalha: "", renda: "", pessoasDependem: "", beneficio: "", moradia: "",
    // Demanda
    demanda: "", necessidades: "", interesseFormacao: "",
    // Profissional
    parecerProfissional: "", encaminhamentos: "", profissionalResponsavel: "",
    observacoes: "",
  };
  const [form, setForm] = useState(EF);
  const [erros, setErros] = useState({});

  const f = k => e => {
    let val = e.target.value;
    if (k === "cpf") val = mCPF(val);
    if (k === "telefone") val = mTel(val);
    if (k === "cep") val = mCEP(val);
    if (k === "nis") val = mNIS(val);
    setForm({ ...form, [k]: val });
    if (erros[k]) setErros({ ...erros, [k]: "" });
  };

  const validar = () => {
    const e = {};
    if (!form.nome.trim()) e.nome = "Nome é obrigatório.";
    if (form.cpf && !vCPF(form.cpf)) e.cpf = "CPF inválido.";
    if (form.telefone && !vTel(form.telefone)) e.telefone = "Telefone inválido.";
    if (form.cep && !vCEP(form.cep)) e.cep = "CEP inválido.";
    if (form.temNIS && form.nis && !vNIS(form.nis)) e.nis = "NIS inválido. Deve ter 11 dígitos.";
    setErros(e); return Object.keys(e).length === 0;
  };

  const save = async d => { await sSet("beneficiarios", d); setBeneficiarios(d); };
  const submit = async () => {
    if (!validar()) {
      alert("Há campos com erros. Verifique os campos marcados em vermelho.");
      return;
    }
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
    (b.cpf || "").includes(search) ||
    (b.nis || "").includes(search)
  );

  if (view === "form") return (
    <div>
      <div className="back-bar">
        <Btn variant="ghost" size="sm" onClick={() => { setView("list"); setErros({}); setForm(EF); }}>← Voltar</Btn>
        <h2>Nova ficha de beneficiário</h2>
      </div>

      <FormSection step="1" title="Identificação pessoal">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Inp label="Nome completo" required value={form.nome} onChange={f("nome")} placeholder="Ex: Maria da Silva" error={erros.nome} />
          <div className="form-grid-3">
            <Inp label="Data de nascimento" type="date" value={form.dataNascimento} onChange={f("dataNascimento")} />
            <Sel label="Sexo" value={form.sexo} onChange={f("sexo")}>
              <option value="">Selecione...</option>
              {SEXOS.map(s => <option key={s}>{s}</option>)}
            </Sel>
            <Inp label="Nome da mãe" value={form.nomeMae} onChange={f("nomeMae")} placeholder="Ex: Ana da Silva" />
          </div>
        </div>
      </FormSection>

      <FormSection step="2" title="Documentos">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="form-grid-2">
            <Inp label="RG" value={form.rg} onChange={f("rg")} placeholder="0.000.000" />
            <Inp label="CPF" value={form.cpf} onChange={f("cpf")} placeholder="000.000.000-00" hint="Formato: 000.000.000-00" error={erros.cpf} />
          </div>
          <div className={`checkbox-row${form.temNIS ? " checked" : ""}`} onClick={() => setForm({ ...form, temNIS: !form.temNIS, nis: !form.temNIS ? form.nis : "" })}>
            <input type="checkbox" checked={form.temNIS} onChange={() => { }} />
            <label>A família possui cadastro no NIS (Número de Identificação Social)?</label>
          </div>
          {form.temNIS && (
            <Inp label="Número do NIS" value={form.nis} onChange={f("nis")} placeholder="000.00000.00-0" hint="Formato: 000.00000.00-0 (11 dígitos)" error={erros.nis} />
          )}
        </div>
      </FormSection>

      <FormSection step="3" title="Educação e religião">
        <div className="form-grid-2">
          <Sel label="Escolaridade" value={form.escolaridade} onChange={f("escolaridade")}>
            <option value="">Selecione...</option>
            {ESCOLARIDADES.map(e => <option key={e}>{e}</option>)}
          </Sel>
          <Inp label="Religião" value={form.religiao} onChange={f("religiao")} placeholder="Ex: Católica, Evangélica..." />
        </div>
      </FormSection>

      <FormSection step="4" title="Contato e endereço">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Inp label="Telefone / WhatsApp" value={form.telefone} onChange={f("telefone")} placeholder="(81) 9 0000-0000" hint="Formato: (DDD) número" error={erros.telefone} />
          <div className="form-grid-2">
            <Inp label="CEP" value={form.cep} onChange={f("cep")} placeholder="00000-000" hint="Formato: 00000-000" error={erros.cep} />
            <Sel label="Bairro" value={form.bairro} onChange={f("bairro")}>
              <option value="">Selecione...</option>
              {BAIRROS.map(b => <option key={b}>{b}</option>)}
            </Sel>
          </div>
          <div className="form-grid-3">
            <Inp label="Rua / Logradouro" value={form.endereco} onChange={f("endereco")} placeholder="Ex: Rua das Flores" />
            <Inp label="Número" value={form.numero} onChange={f("numero")} placeholder="Ex: 123" />
            <Inp label="Complemento" value={form.complemento} onChange={f("complemento")} placeholder="Apto, casa..." />
          </div>
          <Inp label="Ponto de referência" value={form.pontoReferencia} onChange={f("pontoReferencia")} placeholder="Ex: Próximo à padaria do Zé" />
        </div>
      </FormSection>

      <FormSection step="5" title="Composição familiar">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="form-grid-2">
            <Inp label="Quantas pessoas moram na casa?" type="number" min="1" value={form.numPessoas} onChange={f("numPessoas")} placeholder="Ex: 4" />
            <Inp label="Idades dessas pessoas" value={form.idadesPessoas} onChange={f("idadesPessoas")} placeholder="Ex: 32, 28, 8, 3" />
          </div>
          <Txta label="Composição familiar" value={form.composicaoFamiliar} onChange={f("composicaoFamiliar")} placeholder="Ex: Mãe, pai, dois filhos..." />
          <Txta label="Relacionamento familiar" value={form.relacionamentoFamiliar} onChange={f("relacionamentoFamiliar")} placeholder="Como é o relacionamento entre os familiares..." />
        </div>
      </FormSection>

      <FormSection step="6" title="Trabalho e renda">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="form-grid-2">
            <Inp label="Profissão / Ocupação" value={form.profissao} onChange={f("profissao")} placeholder="Ex: Doméstica, autônomo..." />
            <Inp label="Onde trabalha" value={form.ondeTrabalha} onChange={f("ondeTrabalha")} placeholder="Local de trabalho" />
          </div>
          <div className="form-grid-2">
            <Inp label="Renda familiar (R$)" type="number" min="0" value={form.renda} onChange={f("renda")} placeholder="Ex: 800" />
            <Inp label="Quantas pessoas dependem desta renda?" type="number" min="0" value={form.pessoasDependem} onChange={f("pessoasDependem")} placeholder="Ex: 4" />
          </div>
          <Inp label="Algum benefício ou ajuda?" value={form.beneficio} onChange={f("beneficio")} placeholder="Ex: Bolsa Família, BPC, auxílio..." />
          <RadioGroup label="Moradia" value={form.moradia} options={MORADIAS} onChange={v => setForm({ ...form, moradia: v })} />
        </div>
      </FormSection>

      <FormSection step="7" title="Demanda e necessidades">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Txta label="Demanda principal / motivação" value={form.demanda} onChange={f("demanda")} placeholder="Por que a família procurou a instituição?" />
          <Txta label="Maiores necessidades" value={form.necessidades} onChange={f("necessidades")} placeholder="Ex: cesta básica, fraldas, medicamentos..." />
          <Inp label="Interesse em formação (curso ou oficina)" value={form.interesseFormacao} onChange={f("interesseFormacao")} placeholder="Ex: corte e costura, informática..." />
        </div>
      </FormSection>

      <FormSection step="8" title="Avaliação profissional">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Txta label="Parecer profissional" value={form.parecerProfissional} onChange={f("parecerProfissional")} placeholder="Avaliação do caso pelo profissional..." />
          <Txta label="Encaminhamentos" value={form.encaminhamentos} onChange={f("encaminhamentos")} placeholder="Para onde a família foi encaminhada..." />
          <Inp label="Profissional responsável" value={form.profissionalResponsavel} onChange={f("profissionalResponsavel")} placeholder="Nome de quem preencheu a ficha" />
          <Txta label="Observações" value={form.observacoes} onChange={f("observacoes")} placeholder="Informações adicionais..." />
        </div>
      </FormSection>

      <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
        <Btn size="lg" onClick={submit}>💾 Salvar ficha</Btn>
        <Btn variant="ghost" size="lg" onClick={() => { setView("list"); setErros({}); setForm(EF); }}>Cancelar</Btn>
      </div>
    </div>
  );

  if (view === "detail" && sel) {
    const b = sel;
    const hists = atendimentos.filter(a => a.beneficiarioId === b.id);
    const enderecoCompleto = [b.endereco, b.numero, b.complemento, b.cep, b.bairro].filter(Boolean).join(", ");
    return (
      <div>
        <div className="back-bar">
          <Btn variant="ghost" size="sm" onClick={() => setView("list")}>← Voltar</Btn>
          <h2>Ficha do beneficiário</h2>
        </div>

        <div className="card card-accent-green" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
            <div>
              <h3 style={{ fontFamily: "var(--font-sans)", fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em" }}>{b.nome}</h3>
              <p style={{ fontSize: 13, color: "var(--gray-400)", marginTop: 4 }}>Cadastrado em {fDate(b.dataRegistro)}</p>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Badge color="green">✓ Ativo</Badge>
              {b.temNIS && <Badge color="pink">🔖 NIS prioritário</Badge>}
            </div>
          </div>

          <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 700, color: "var(--gray-400)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10, marginTop: 6 }}>Identificação</p>
          <div className="detail-grid">
            {b.dataNascimento && <div><p className="detail-key">Data de nascimento</p><p className="detail-val">{fDate(b.dataNascimento)}</p></div>}
            {b.sexo && <div><p className="detail-key">Sexo</p><p className="detail-val">{b.sexo}</p></div>}
            {b.nomeMae && <div><p className="detail-key">Nome da mãe</p><p className="detail-val">{b.nomeMae}</p></div>}
            {b.rg && <div><p className="detail-key">RG</p><p className="detail-val">{b.rg}</p></div>}
            {b.cpf && <div><p className="detail-key">CPF</p><p className="detail-val">{b.cpf}</p></div>}
            {b.temNIS && b.nis && <div><p className="detail-key">NIS</p><p className="detail-val">{b.nis}</p></div>}
            {b.escolaridade && <div><p className="detail-key">Escolaridade</p><p className="detail-val">{b.escolaridade}</p></div>}
            {b.religiao && <div><p className="detail-key">Religião</p><p className="detail-val">{b.religiao}</p></div>}
          </div>

          {(b.telefone || enderecoCompleto || b.pontoReferencia) && <>
            <hr className="divider" />
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 700, color: "var(--gray-400)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Contato e endereço</p>
            <div className="detail-grid">
              {b.telefone && <div><p className="detail-key">Telefone</p><p className="detail-val">{b.telefone}</p></div>}
              {enderecoCompleto && <div style={{ gridColumn: "1/-1" }}><p className="detail-key">Endereço</p><p className="detail-val">{enderecoCompleto}</p></div>}
              {b.pontoReferencia && <div style={{ gridColumn: "1/-1" }}><p className="detail-key">Ponto de referência</p><p className="detail-val">{b.pontoReferencia}</p></div>}
            </div>
          </>}

          {(b.numPessoas || b.composicaoFamiliar || b.relacionamentoFamiliar) && <>
            <hr className="divider" />
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 700, color: "var(--gray-400)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Família</p>
            <div className="detail-grid">
              {b.numPessoas && <div><p className="detail-key">Pessoas na casa</p><p className="detail-val">{b.numPessoas}</p></div>}
              {b.idadesPessoas && <div><p className="detail-key">Idades</p><p className="detail-val">{b.idadesPessoas}</p></div>}
            </div>
            {b.composicaoFamiliar && <div style={{ marginTop: 10 }}><p className="detail-key">Composição familiar</p><p style={{ fontSize: 14, background: "var(--gray-50)", padding: "10px 14px", borderRadius: "var(--radius-xs)", marginTop: 4 }}>{b.composicaoFamiliar}</p></div>}
            {b.relacionamentoFamiliar && <div style={{ marginTop: 10 }}><p className="detail-key">Relacionamento familiar</p><p style={{ fontSize: 14, background: "var(--gray-50)", padding: "10px 14px", borderRadius: "var(--radius-xs)", marginTop: 4 }}>{b.relacionamentoFamiliar}</p></div>}
          </>}

          {(b.profissao || b.renda || b.moradia) && <>
            <hr className="divider" />
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 700, color: "var(--gray-400)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Trabalho e renda</p>
            <div className="detail-grid">
              {b.profissao && <div><p className="detail-key">Profissão</p><p className="detail-val">{b.profissao}</p></div>}
              {b.ondeTrabalha && <div><p className="detail-key">Onde trabalha</p><p className="detail-val">{b.ondeTrabalha}</p></div>}
              {b.renda && <div><p className="detail-key">Renda familiar</p><p className="detail-val">{fCur(b.renda)}</p></div>}
              {b.pessoasDependem && <div><p className="detail-key">Dependentes</p><p className="detail-val">{b.pessoasDependem}</p></div>}
              {b.beneficio && <div><p className="detail-key">Benefício / ajuda</p><p className="detail-val">{b.beneficio}</p></div>}
              {b.moradia && <div><p className="detail-key">Moradia</p><p className="detail-val">{b.moradia}</p></div>}
            </div>
          </>}

          {(b.demanda || b.necessidades || b.interesseFormacao) && <>
            <hr className="divider" />
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 700, color: "var(--gray-400)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Demanda e necessidades</p>
            {b.demanda && <div style={{ marginBottom: 10 }}><p className="detail-key">Demanda principal</p><p style={{ fontSize: 14, background: "var(--gray-50)", padding: "10px 14px", borderRadius: "var(--radius-xs)", marginTop: 4 }}>{b.demanda}</p></div>}
            {b.necessidades && <div style={{ marginBottom: 10 }}><p className="detail-key">Maiores necessidades</p><p style={{ fontSize: 14, background: "var(--green-50)", padding: "10px 14px", borderRadius: "var(--radius-xs)", borderLeft: "3px solid var(--green-600)", marginTop: 4 }}>{b.necessidades}</p></div>}
            {b.interesseFormacao && <div><p className="detail-key">Interesse em formação</p><p style={{ fontSize: 14, background: "var(--gray-50)", padding: "10px 14px", borderRadius: "var(--radius-xs)", marginTop: 4 }}>{b.interesseFormacao}</p></div>}
          </>}

          {(b.parecerProfissional || b.encaminhamentos || b.profissionalResponsavel) && <>
            <hr className="divider" />
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 700, color: "var(--gray-400)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Avaliação profissional</p>
            {b.parecerProfissional && <div style={{ marginBottom: 10 }}><p className="detail-key">Parecer</p><p style={{ fontSize: 14, background: "var(--gray-50)", padding: "10px 14px", borderRadius: "var(--radius-xs)", marginTop: 4 }}>{b.parecerProfissional}</p></div>}
            {b.encaminhamentos && <div style={{ marginBottom: 10 }}><p className="detail-key">Encaminhamentos</p><p style={{ fontSize: 14, background: "var(--gray-50)", padding: "10px 14px", borderRadius: "var(--radius-xs)", marginTop: 4 }}>{b.encaminhamentos}</p></div>}
            {b.profissionalResponsavel && <div><p className="detail-key">Profissional responsável</p><p className="detail-val">{b.profissionalResponsavel}</p></div>}
          </>}

          {b.observacoes && <>
            <hr className="divider" />
            <p className="detail-key" style={{ marginBottom: 6 }}>Observações</p>
            <p style={{ fontSize: 14, background: "var(--gray-50)", padding: "10px 14px", borderRadius: "var(--radius-xs)" }}>{b.observacoes}</p>
          </>}

          <hr className="divider" />
          <Btn variant="danger" size="sm" onClick={() => del(b.id)}>🗑 Remover cadastro</Btn>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <h3 style={{ fontFamily: "var(--font-sans)", fontSize: 17, fontWeight: 700 }}>Histórico de atendimentos</h3>
          <Badge color="purple">{hists.length} registro{hists.length !== 1 ? "s" : ""}</Badge>
        </div>
        {hists.length === 0
          ? <p style={{ fontSize: 14, color: "var(--gray-500)", background: "var(--gray-50)", padding: "16px 20px", borderRadius: "var(--radius-xs)", border: "1px dashed var(--gray-300)" }}>Nenhum atendimento registrado ainda.</p>
          : hists.map(a => (
            <div key={a.id} className="card" style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14 }}>📅 {fDate(a.data)}</span>
                {a.voluntario && <Badge color="gray">👤 {a.voluntario}</Badge>}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {(a.itens || []).map((it, i) => <span key={i} className="item-tag">{it.quantidade} {it.unidade} de {it.itemNome}</span>)}
              </div>
            </div>
          ))}
      </div>
    );
  }

  const comNIS = beneficiarios.filter(b => b.temNIS).length;

  return (
    <div>
      <div className="section-header">
        <div>
          <h2 className="section-title-lg">Beneficiários</h2>
          <p className="section-sub">Ficha de Serviço Social — famílias atendidas pela instituição</p>
        </div>
        <Btn size="lg" onClick={() => setView("form")}>+ Nova ficha</Btn>
      </div>

      <div className="stats-grid">
        <StatCard label="Famílias cadastradas" value={beneficiarios.length} color="green" />
        <StatCard label="Com NIS (prioridade)" value={comNIS} color="pink" />
        <StatCard label="Bairros atendidos" value={[...new Set(beneficiarios.map(b => b.bairro).filter(Boolean))].length} color="amber" />
        <StatCard label="Pessoas atendidas" value={beneficiarios.reduce((s, b) => s + (Number(b.numPessoas) || 0), 0)} color="blue" />
      </div>

      <div className="search-wrap">
        <input className="search-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍  Buscar por nome, CPF, NIS ou bairro..." />
      </div>

      {filtered.length === 0
        ? <Empty icon="👥" title="Nenhum beneficiário encontrado" sub={beneficiarios.length === 0 ? "Clique em '+ Nova ficha' para começar." : "Tente buscar por outro termo."} />
        : filtered.map(b => (
          <div key={b.id} className="card card-hover" style={{ marginBottom: 12 }} onClick={() => { setSel(b); setView("detail"); }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <p className="ben-name">{b.nome}</p>
                <p className="ben-meta">{[b.bairro, b.numPessoas && `${b.numPessoas} pessoas`, b.renda && fCur(b.renda)].filter(Boolean).join("  ·  ")}</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, marginLeft: 16 }}>
                {b.temNIS && <Badge color="pink">NIS</Badge>}
                <Badge color="green">Ativo</Badge>
                <span style={{ fontSize: 11, color: "var(--gray-400)" }}>{fDate(b.dataRegistro)}</span>
              </div>
            </div>
            {b.necessidades && <p className="ben-needs">📋 {b.necessidades.slice(0, 100)}{b.necessidades.length > 100 ? "..." : ""}</p>}
          </div>
        ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// FAMÍLIAS — Cadastro estilo SESC
// ══════════════════════════════════════════════════════════════════
function FamiliasModule({ entidade, setEntidade, familias, setFamilias }) {
  const [tab, setTab] = useState("lista");
  const [showFamForm, setShowFamForm] = useState(false);
  const [editFam, setEditFam] = useState(null);

  const EE = { nome: "", cnpj: "", endereco: "", telefone: "", responsavel: "", cpfResp: "" };
  const EF = { chefeNome: "", chefeCPF: "", maeNome: "", endereco: "", nis: "", faixa1: "", faixa2: "", faixa3: "", faixa4: "", faixa5: "" };
  const [fEnt, setFEnt] = useState(entidade || EE);
  const [fFam, setFFam] = useState(EF);
  const [erros, setErros] = useState({});

  useEffect(() => { setFEnt(entidade || EE); }, [entidade]);

  const fEnt_h = k => e => {
    let val = e.target.value;
    if (k === "cnpj") val = mCNPJ(val);
    if (k === "cpfResp") val = mCPF(val);
    if (k === "telefone") val = mTel(val);
    setFEnt({ ...fEnt, [k]: val });
  };

  const fFam_h = k => e => {
    let val = e.target.value;
    if (k === "chefeCPF") val = mCPF(val);
    if (k === "nis") val = mNIS(val);
    setFFam({ ...fFam, [k]: val });
    if (erros[k]) setErros({ ...erros, [k]: "" });
  };

  const salvarEntidade = async () => {
    await sSet("entidade", fEnt); setEntidade(fEnt);
    alert("✅ Dados da entidade salvos!");
  };

  const salvarFamilia = async () => {
    const e = {};
    if (!fFam.chefeNome.trim()) e.chefeNome = "Obrigatório.";
    if (fFam.chefeCPF && !vCPF(fFam.chefeCPF)) e.chefeCPF = "CPF inválido.";
    if (fFam.nis && !vNIS(fFam.nis)) e.nis = "NIS inválido.";
    setErros(e);
    if (Object.keys(e).length > 0) return;

    if (editFam) {
      const novas = familias.map(f => f.id === editFam.id ? { ...fFam, id: editFam.id } : f);
      await sSet("familias", novas); setFamilias(novas);
    } else {
      const novas = [...familias, { ...fFam, id: uid() }];
      await sSet("familias", novas); setFamilias(novas);
    }
    setFFam(EF); setEditFam(null); setShowFamForm(false); setErros({});
  };

  const removerFamilia = async id => {
    if (!confirm("Remover esta família da lista?")) return;
    await sSet("familias", familias.filter(f => f.id !== id));
    setFamilias(familias.filter(f => f.id !== id));
  };

  const editarFamilia = f => {
    setFFam({ ...f }); setEditFam(f); setShowFamForm(true); setTab("nova");
  };

  const totalPessoas = familias.reduce((s, f) => s + ["faixa1", "faixa2", "faixa3", "faixa4", "faixa5"].reduce((a, k) => a + (Number(f[k]) || 0), 0), 0);
  const comNIS = familias.filter(f => f.nis).length;

  return (
    <div>
      <div className="section-header">
        <div>
          <h2 className="section-title-lg">Cadastro de Família</h2>
          <p className="section-sub">Documento consolidado de famílias atendidas pela entidade</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="info" size="md" onClick={() => gerarRelatorioFamilia(fEnt, familias)}>🖨 Imprimir PDF</Btn>
          <Btn variant="pink" size="md" onClick={() => { setEditFam(null); setFFam(EF); setShowFamForm(true); setTab("nova"); }}>+ Nova família</Btn>
        </div>
      </div>

      <InnerTabs active={tab} onChange={setTab} tabs={[["lista", "📋 Lista de famílias"], ["entidade", "🏢 Dados da entidade"], ["nova", showFamForm ? (editFam ? "✏ Editando família" : "➕ Nova família") : "➕ Adicionar família"]]} />

      {tab === "entidade" && (
        <div className="card">
          <h3 style={{ fontFamily: "var(--font-sans)", fontSize: 17, fontWeight: 800, marginBottom: 18 }}>🏢 Dados da entidade responsável</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="form-grid-2">
              <Inp label="Nome da entidade" required value={fEnt.nome} onChange={fEnt_h("nome")} placeholder="Ex: Grupo Partilhar" />
              <Inp label="CNPJ" value={fEnt.cnpj} onChange={fEnt_h("cnpj")} placeholder="00.000.000/0000-00" />
            </div>
            <Inp label="Endereço da entidade" value={fEnt.endereco} onChange={fEnt_h("endereco")} placeholder="Endereço completo" />
            <div className="form-grid-2">
              <Inp label="Telefone" value={fEnt.telefone} onChange={fEnt_h("telefone")} placeholder="(81) 9 0000-0000" />
              <Inp label="Responsável legal" value={fEnt.responsavel} onChange={fEnt_h("responsavel")} placeholder="Nome do responsável" />
            </div>
            <Inp label="CPF do responsável" value={fEnt.cpfResp} onChange={fEnt_h("cpfResp")} placeholder="000.000.000-00" />
            <hr className="divider" />
            <Btn size="lg" onClick={salvarEntidade} style={{ alignSelf: "flex-start" }}>💾 Salvar dados da entidade</Btn>
          </div>
        </div>
      )}

      {tab === "nova" && showFamForm && (
        <div className="card">
          <h3 style={{ fontFamily: "var(--font-sans)", fontSize: 17, fontWeight: 800, marginBottom: 18 }}>{editFam ? "✏ Editar família" : "➕ Nova família"}</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Inp label="Nome do chefe de família" required value={fFam.chefeNome} onChange={fFam_h("chefeNome")} placeholder="Ex: João da Silva" error={erros.chefeNome} />
            <div className="form-grid-2">
              <Inp label="CPF do chefe de família" value={fFam.chefeCPF} onChange={fFam_h("chefeCPF")} placeholder="000.000.000-00" error={erros.chefeCPF} />
              <Inp label="NIS" value={fFam.nis} onChange={fFam_h("nis")} placeholder="000.00000.00-0" hint="Opcional — 11 dígitos" error={erros.nis} />
            </div>
            <Inp label="Nome da mãe do chefe de família" value={fFam.maeNome} onChange={fFam_h("maeNome")} placeholder="Nome da mãe" />
            <Inp label="Endereço completo" value={fFam.endereco} onChange={fFam_h("endereco")} placeholder="Rua, número, bairro, cidade" />

            <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 700, color: "var(--gray-500)", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 8 }}>Nº de pessoas por faixa etária</p>
            <div className="form-grid-4" style={{ gridTemplateColumns: "repeat(5,1fr)" }}>
              <Inp label="0 a 6" type="number" min="0" value={fFam.faixa1} onChange={fFam_h("faixa1")} placeholder="0" />
              <Inp label="7 a 14" type="number" min="0" value={fFam.faixa2} onChange={fFam_h("faixa2")} placeholder="0" />
              <Inp label="15 a 23" type="number" min="0" value={fFam.faixa3} onChange={fFam_h("faixa3")} placeholder="0" />
              <Inp label="24 a 65" type="number" min="0" value={fFam.faixa4} onChange={fFam_h("faixa4")} placeholder="0" />
              <Inp label="+65" type="number" min="0" value={fFam.faixa5} onChange={fFam_h("faixa5")} placeholder="0" />
            </div>

            <hr className="divider" />
            <div style={{ display: "flex", gap: 10 }}>
              <Btn size="lg" onClick={salvarFamilia}>{editFam ? "💾 Atualizar família" : "➕ Adicionar família"}</Btn>
              <Btn variant="ghost" size="lg" onClick={() => { setFFam(EF); setEditFam(null); setShowFamForm(false); setErros({}); setTab("lista"); }}>Cancelar</Btn>
            </div>
          </div>
        </div>
      )}

      {tab === "lista" && (<>
        <div className="stats-grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
          <StatCard label="Famílias na lista" value={familias.length} color="green" />
          <StatCard label="Total de pessoas" value={totalPessoas} color="blue" />
          <StatCard label="Com NIS" value={comNIS} color="pink" />
        </div>

        {!entidade?.nome && (
          <div className="alert alert-amber">
            <span className="alert-icon">ℹ️</span>
            <div>
              <p style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14, color: "var(--amber-700)" }}>Dados da entidade não preenchidos</p>
              <p style={{ fontSize: 13, color: "var(--amber-700)", marginTop: 2 }}>Vá em <strong>"Dados da entidade"</strong> e preencha as informações antes de imprimir o documento.</p>
            </div>
          </div>
        )}

        {familias.length === 0
          ? <Empty icon="📋" title="Nenhuma família adicionada" sub="Clique em '+ Nova família' para adicionar a primeira família à lista." />
          : <div className="fam-table-wrap">
            <table className="fam-table">
              <thead>
                <tr>
                  <th className="num-col">Nº</th>
                  <th>Chefe de família / CPF</th>
                  <th>Mãe do chefe</th>
                  <th>Endereço</th>
                  <th>NIS</th>
                  <th className="age-col">0-6</th>
                  <th className="age-col">7-14</th>
                  <th className="age-col">15-23</th>
                  <th className="age-col">24-65</th>
                  <th className="age-col">+65</th>
                  <th className="action-col"></th>
                </tr>
              </thead>
              <tbody>
                {familias.map((f, i) => (
                  <tr key={f.id}>
                    <td className="num-col">{i + 1}</td>
                    <td>
                      <div style={{ fontWeight: 700, color: "var(--gray-900)" }}>{f.chefeNome}</div>
                      <div style={{ fontSize: 12, color: "var(--gray-500)", marginTop: 2 }}>CPF: {f.chefeCPF || "—"}</div>
                    </td>
                    <td>{f.maeNome || "—"}</td>
                    <td style={{ maxWidth: 200 }}>{f.endereco || "—"}</td>
                    <td>{f.nis ? <Badge color="pink">{f.nis}</Badge> : "—"}</td>
                    <td className="age-col">{f.faixa1 || ""}</td>
                    <td className="age-col">{f.faixa2 || ""}</td>
                    <td className="age-col">{f.faixa3 || ""}</td>
                    <td className="age-col">{f.faixa4 || ""}</td>
                    <td className="age-col">{f.faixa5 || ""}</td>
                    <td className="action-col">
                      <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                        <button onClick={() => editarFamilia(f)} style={{ background: "var(--blue-50)", border: "1px solid var(--blue-100)", cursor: "pointer", color: "var(--blue-700)", fontSize: 12, padding: "4px 8px", borderRadius: 6, fontWeight: 700 }}>✏</button>
                        <button onClick={() => removerFamilia(f.id)} style={{ background: "var(--red-50)", border: "1px solid var(--red-100)", cursor: "pointer", color: "var(--red-700)", fontSize: 12, padding: "4px 8px", borderRadius: 6, fontWeight: 700 }}>🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>}
      </>)}
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
    setFEnt(EE); alert("✅ Doação registrada!");
  };
  const regSaida = async () => {
    if (!fSai.itemId || !fSai.quantidade) return alert("Selecione o item e a quantidade.");
    const item = estoque.find(i => i.id === fSai.itemId);
    const qtd = Number(fSai.quantidade);
    if (qtd > item.quantidade) return alert(`Estoque insuficiente! Disponível: ${item.quantidade} ${item.unidade}.`);
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
      <div className="section-header">
        <div>
          <h2 className="section-title-lg">Doações & Estoque</h2>
          <p className="section-sub">Controle de entradas, saídas e metas</p>
        </div>
      </div>
      <InnerTabs active={tab} onChange={setTab} tabs={[["estoque", "📦 Estoque"], ["entrada", "⬇ Entrada"], ["saida", "⬆ Saída"], ["metas", "🎯 Metas"], ["historico", "📋 Histórico"]]} />

      {tab === "estoque" && <>
        <div className="stats-grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
          <StatCard label="Tipos de item" value={estoque.length} color="green" />
          <StatCard label="Unidades no estoque" value={estoque.reduce((s, i) => s + i.quantidade, 0)} color="blue" />
          <StatCard label="Estoque baixo" value={baixo.length} color={baixo.length > 0 ? "red" : "green"} />
        </div>
        {baixo.length > 0 && <div className="alert alert-red">
          <span className="alert-icon">⚠️</span>
          <div>
            <p style={{ fontFamily: "var(--font-sans)", fontWeight: 700, color: "var(--red-700)" }}>Atenção — estoque baixo</p>
            <p style={{ fontSize: 13, color: "var(--red-700)" }}>{baixo.map(i => i.nome).join(", ")}</p>
          </div>
        </div>}
        {estoque.length === 0 ? <Empty icon="📦" title="Estoque vazio" sub="Registre uma entrada para começar." />
          : CATEGORIAS.filter(c => estoque.some(i => i.categoria === c)).map(cat => (
            <div key={cat} style={{ marginBottom: 28 }}>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 700, color: "var(--gray-400)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>{cat}</p>
              {estoque.filter(i => i.categoria === cat).map(item => {
                const meta = metasMes.find(m => m.itemNome.toLowerCase() === item.nome.toLowerCase());
                return <div key={item.id} className="card" style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: meta ? 14 : 0 }}>
                    <div>
                      <p style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 16 }}>{item.nome}</p>
                      <p style={{ fontSize: 13, color: "var(--gray-400)" }}>{item.unidade}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontFamily: "var(--font-sans)", fontSize: 34, fontWeight: 800, color: item.quantidade <= 5 ? "var(--red-700)" : "var(--green-700)", lineHeight: 1 }}>{item.quantidade}</p>
                      <p style={{ fontSize: 12, color: "var(--gray-400)" }}>disponíveis</p>
                    </div>
                  </div>
                  {meta && <>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: "var(--gray-500)" }}>Meta: {meta.meta} {meta.unidade}</span>
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
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="form-grid-2">
            <Inp label="Nome do item" required value={fEnt.itemNome} onChange={e => setFEnt({ ...fEnt, itemNome: e.target.value })} placeholder="Ex: Cesta básica" />
            <Sel label="Categoria" value={fEnt.categoria} onChange={e => setFEnt({ ...fEnt, categoria: e.target.value })}>{CATEGORIAS.map(c => <option key={c}>{c}</option>)}</Sel>
          </div>
          <div className="form-grid-2">
            <Inp label="Quantidade" required type="number" min="1" value={fEnt.quantidade} onChange={e => setFEnt({ ...fEnt, quantidade: e.target.value })} placeholder="10" />
            <Inp label="Unidade" value={fEnt.unidade} onChange={e => setFEnt({ ...fEnt, unidade: e.target.value })} placeholder="unidade, kg, litro..." />
          </div>
          <Inp label="Nome do doador" value={fEnt.doador} onChange={e => setFEnt({ ...fEnt, doador: e.target.value })} placeholder="Nome ou empresa (opcional)" />
          <Txta label="Observações" value={fEnt.observacao} onChange={e => setFEnt({ ...fEnt, observacao: e.target.value })} placeholder="Validade, condições..." />
          <hr className="divider" />
          <Btn size="lg" onClick={regEntrada} style={{ alignSelf: "flex-start" }}>⬇ Confirmar entrada</Btn>
        </div>
      </div>}

      {tab === "saida" && <div className="card">
        <h3 style={{ fontFamily: "var(--font-sans)", fontSize: 18, fontWeight: 800, marginBottom: 22 }}>Registrar distribuição</h3>
        {estoque.filter(i => i.quantidade > 0).length === 0 ? <Empty icon="📦" title="Estoque vazio" sub="Registre uma entrada antes." />
          : <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Sel label="Item" required value={fSai.itemId} onChange={e => setFSai({ ...fSai, itemId: e.target.value })}>
              <option value="">Selecione...</option>
              {estoque.filter(i => i.quantidade > 0).map(i => <option key={i.id} value={i.id}>{i.nome} — {i.quantidade} {i.unidade}</option>)}
            </Sel>
            <div className="form-grid-2">
              <Inp label="Quantidade" required type="number" min="1" value={fSai.quantidade} onChange={e => setFSai({ ...fSai, quantidade: e.target.value })} />
              <Inp label="Beneficiário" value={fSai.beneficiario} onChange={e => setFSai({ ...fSai, beneficiario: e.target.value })} placeholder="Nome da família (opcional)" />
            </div>
            <Txta label="Observações" value={fSai.observacao} onChange={e => setFSai({ ...fSai, observacao: e.target.value })} />
            <hr className="divider" />
            <Btn variant="accent" size="lg" onClick={regSaida} style={{ alignSelf: "flex-start" }}>⬆ Confirmar saída</Btn>
          </div>}
      </div>}

      {tab === "metas" && <>
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ fontFamily: "var(--font-sans)", fontSize: 18, fontWeight: 800, marginBottom: 22 }}>🎯 Definir meta</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="form-grid-2">
              <Inp label="Item" required value={fMeta.itemNome} onChange={e => setFMeta({ ...fMeta, itemNome: e.target.value })} placeholder="Ex: Cesta básica" />
              <Sel label="Categoria" value={fMeta.categoria} onChange={e => setFMeta({ ...fMeta, categoria: e.target.value })}>{CATEGORIAS.map(c => <option key={c}>{c}</option>)}</Sel>
            </div>
            <div className="form-grid-2">
              <Inp label="Quantidade meta" required type="number" min="1" value={fMeta.meta} onChange={e => setFMeta({ ...fMeta, meta: e.target.value })} placeholder="100" />
              <Inp label="Unidade" value={fMeta.unidade} onChange={e => setFMeta({ ...fMeta, unidade: e.target.value })} />
            </div>
            <Sel label="Mês" value={fMeta.mesAno} onChange={e => setFMeta({ ...fMeta, mesAno: e.target.value })}>
              {Array.from({ length: 12 }, (_, i) => { const d = new Date(); d.setMonth(d.getMonth() + i - 2); const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; return <option key={ym} value={ym}>{ymLabel(ym)}</option>; })}
            </Sel>
            <hr className="divider" />
            <Btn variant="purple" size="lg" onClick={addMeta} style={{ alignSelf: "flex-start" }}>🎯 Salvar meta</Btn>
          </div>
        </div>
        {metas.length === 0 ? <Empty icon="🎯" title="Nenhuma meta" sub="Defina metas acima para acompanhar." />
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
                    <div><p style={{ fontFamily: "var(--font-sans)", fontWeight: 700 }}>{m.itemNome}</p><Badge color="gray">{m.categoria}</Badge></div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontFamily: "var(--font-sans)", fontSize: 30, fontWeight: 800, color: pct >= 100 ? "var(--green-700)" : pct >= 60 ? "var(--amber-700)" : "var(--red-700)" }}>{pct}%</p>
                      <p style={{ fontSize: 12, color: "var(--gray-400)" }}>{atual} de {m.meta} {m.unidade}</p>
                    </div>
                  </div>
                  <Progress value={atual} max={m.meta} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                    {pct < 100 ? <p style={{ fontSize: 13, color: "var(--amber-700)", fontWeight: 600 }}>Faltam {m.meta - atual} {m.unidade}</p>
                      : <p style={{ fontSize: 13, color: "var(--green-700)", fontWeight: 700 }}>✅ Meta atingida!</p>}
                    <button onClick={() => delMeta(m.id)} style={{ background: "var(--red-50)", border: "1px solid var(--red-100)", cursor: "pointer", color: "var(--red-700)", fontSize: 13, padding: "5px 12px", borderRadius: 6, fontWeight: 600 }}>🗑 Remover</button>
                  </div>
                </div>;
              })}
            </div>
          ))}
      </>}

      {tab === "historico" && <>
        <div className="stats-grid" style={{ gridTemplateColumns: "repeat(3,1fr)", marginBottom: 20 }}>
          <StatCard label="Entradas" value={movs.filter(m => m.tipo === "entrada").reduce((s, m) => s + m.quantidade, 0)} color="green" />
          <StatCard label="Saídas" value={movs.filter(m => m.tipo === "saida").reduce((s, m) => s + m.quantidade, 0)} color="amber" />
          <StatCard label="Registros" value={movs.length} color="blue" />
        </div>
        {movs.length === 0 ? <Empty icon="📋" title="Nenhuma movimentação" sub="O histórico aparecerá aqui." />
          : movs.slice(0, 60).map(m => (
            <div key={m.id} className="card" style={{ marginBottom: 10, display: "flex", alignItems: "flex-start", gap: 16 }}>
              <div className="mov-icon" style={{ background: m.tipo === "entrada" ? "var(--green-100)" : "var(--amber-100)" }}>{m.tipo === "entrada" ? "⬇" : "⬆"}</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: "var(--font-sans)", fontWeight: 700 }}>{m.itemNome} <span style={{ fontWeight: 500, color: "var(--gray-500)" }}>— {m.quantidade} {m.unidade}</span></p>
                <p style={{ fontSize: 13, color: "var(--gray-400)" }}>{m.tipo === "entrada" ? `Doador: ${m.doador || "anônimo"}` : `Para: ${m.beneficiario || "geral"}`} · {fDate(m.data)}</p>
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

  const updItem = (i, k, v) => setItens(itens.map((it, idx) => idx === i ? { ...it, [k]: v } : it));

  const registrar = async () => {
    if (!benSel) return alert("Selecione um beneficiário.");
    const valid = itens.filter(it => it.itemId && it.quantidade);
    if (valid.length === 0) return alert("Adicione pelo menos um item.");
    for (const it of valid) { const e = estoque.find(e => e.id === it.itemId); if (Number(it.quantidade) > e.quantidade) return alert(`Estoque insuficiente para ${e.nome}!`); }
    const itFmt = valid.map(it => { const e = estoque.find(e => e.id === it.itemId); return { itemId: it.itemId, itemNome: e.nome, quantidade: Number(it.quantidade), unidade: e.unidade }; });
    const novoEst = estoque.map(e => { const it = valid.find(i => i.itemId === e.id); return it ? { ...e, quantidade: e.quantidade - Number(it.quantidade) } : e; });
    const novasMov = valid.map(it => { const e = estoque.find(e => e.id === it.itemId); return { id: uid(), tipo: "saida", itemNome: e.nome, categoria: e.categoria, quantidade: Number(it.quantidade), unidade: e.unidade, beneficiario: benSel.nome, data: new Date().toISOString() }; });
    await sSet("atendimentos", [{ id: uid(), beneficiarioId: benSel.id, beneficiarioNome: benSel.nome, itens: itFmt, voluntario, observacoes: obs, data: new Date().toISOString() }, ...atendimentos]);
    setAtendimentos([{ id: uid(), beneficiarioId: benSel.id, beneficiarioNome: benSel.nome, itens: itFmt, voluntario, observacoes: obs, data: new Date().toISOString() }, ...atendimentos]);
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
      <FormSection step="1" title="Selecionar beneficiário">
        {benSel ? <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--green-50)", padding: "14px 18px", borderRadius: "var(--radius-xs)", border: "1.5px solid var(--green-100)" }}>
          <div><p style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 16 }}>{benSel.nome}</p><p style={{ fontSize: 13, color: "var(--gray-500)" }}>📍 {benSel.bairro}</p></div>
          <Btn variant="ghost" size="sm" onClick={() => setBenSel(null)}>Trocar</Btn>
        </div> : <>
          <input className="field-input" value={busca} onChange={e => setBusca(e.target.value)} placeholder="🔍 Digite o nome..." style={{ marginBottom: 8 }} />
          {busca && <div className="autocomplete-list">
            {benFiltrados.slice(0, 5).map(b => <div key={b.id} className="autocomplete-item" onClick={() => { setBenSel(b); setBusca(""); }}>
              <p style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14 }}>{b.nome}</p>
              <p style={{ fontSize: 12, color: "var(--gray-400)" }}>📍 {b.bairro}</p>
            </div>)}
            {benFiltrados.length === 0 && <p style={{ padding: "14px 18px", fontSize: 14, color: "var(--gray-400)" }}>Nenhuma família encontrada.</p>}
          </div>}
        </>}
      </FormSection>
      <FormSection step="2" title="Itens distribuídos">
        {itens.map((it, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 100px auto", gap: 12, marginBottom: 12, alignItems: "end" }}>
            <Sel label={i === 0 ? "Item" : undefined} value={it.itemId} onChange={e => updItem(i, "itemId", e.target.value)}>
              <option value="">Selecione...</option>
              {estoque.filter(e => e.quantidade > 0).map(e => <option key={e.id} value={e.id}>{e.nome} — {e.quantidade}</option>)}
            </Sel>
            <Inp label={i === 0 ? "Qtd" : undefined} type="number" min="1" value={it.quantidade} onChange={e => updItem(i, "quantidade", e.target.value)} placeholder="1" />
            {itens.length > 1 && <button onClick={() => setItens(itens.filter((_, idx) => idx !== i))} style={{ background: "var(--red-50)", border: "1px solid var(--red-100)", cursor: "pointer", color: "var(--red-700)", padding: "11px 14px", borderRadius: 6, fontWeight: 700 }}>✕</button>}
          </div>
        ))}
        <Btn variant="ghost-green" size="sm" onClick={() => setItens([...itens, { itemId: "", quantidade: "" }])}>+ Adicionar item</Btn>
      </FormSection>
      <FormSection step="3" title="Informações">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Inp label="Voluntário responsável" value={voluntario} onChange={e => setVoluntario(e.target.value)} placeholder="Nome (opcional)" />
          <Txta label="Observações" value={obs} onChange={e => setObs(e.target.value)} />
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
        <div><h2 className="section-title-lg">Atendimentos</h2><p className="section-sub">Registro de cada atendimento</p></div>
        <Btn variant="purple" size="lg" onClick={() => setView("form")}>+ Novo atendimento</Btn>
      </div>
      <div className="stats-grid" style={{ gridTemplateColumns: "1fr 1fr", marginBottom: 20 }}>
        <StatCard label="Total" value={atendimentos.length} color="purple" />
        <StatCard label="Este mês" value={atendimentos.filter(a => a.data?.startsWith(nowYM())).length} color="green" />
      </div>
      {mesesDisp.length > 0 && <div className="filter-row">
        {["todos", ...mesesDisp].map(m => <button key={m} className={`filter-pill${filtroMes === m ? " active" : ""}`} onClick={() => setFiltroMes(m)}>{m === "todos" ? "Todos" : ymLabel(m)}</button>)}
      </div>}
      {atFilt.length === 0 ? <Empty icon="📝" title="Nenhum atendimento" sub="Clique em '+ Novo atendimento'." />
        : atFilt.map(a => (
          <div key={a.id} className="card card-accent-purple" style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <p style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 16 }}>{a.beneficiarioNome}</p>
                <p style={{ fontSize: 13, color: "var(--gray-400)" }}>📅 {fDate(a.data)}{a.voluntario && ` · 👤 ${a.voluntario}`}</p>
              </div>
              <Badge color="purple">{(a.itens || []).length} {(a.itens || []).length === 1 ? "item" : "itens"}</Badge>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {(a.itens || []).map((it, i) => <span key={i} className="item-tag">{it.quantidade} {it.unidade} de {it.itemNome}</span>)}
            </div>
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
        <div><h2 className="section-title-lg">Relatórios</h2><p className="section-sub">Resumo geral e exportação</p></div>
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
        {[["beneficiarios", "👥", "Lista de beneficiários", `${beneficiarios.length} famílias com dados completos`],
        ["atendimentos", "📝", "Registro de atendimentos", `${atendimentos.length} atendimentos`],
        ["estoque", "📦", "Histórico de doações", `${movs.length} movimentações`]].map(([tipo, icon, titulo, desc]) => (
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
        <StatCard label="Atendimentos" value={atendimentos.filter(a => a.data?.startsWith(mes)).length} color="purple" />
        <StatCard label="Itens recebidos" value={movs.filter(m => m.tipo === "entrada" && m.data?.startsWith(mes)).reduce((s, m) => s + m.quantidade, 0)} color="green" />
        <StatCard label="Itens distribuídos" value={movs.filter(m => m.tipo === "saida" && m.data?.startsWith(mes)).reduce((s, m) => s + m.quantidade, 0)} color="amber" />
        <StatCard label="Doadores ativos" value={[...new Set(movs.filter(m => m.tipo === "entrada" && m.doador && m.data?.startsWith(mes)).map(m => m.doador))].length} color="blue" />
      </div>
      <h3 style={{ fontFamily: "var(--font-sans)", fontSize: 17, fontWeight: 700, marginBottom: 16 }}>🏘 Famílias por bairro</h3>
      {beneficiarios.length === 0 ? <Empty icon="🗺" title="Nenhum dado" sub="Os dados aparecerão conforme cadastrar." />
        : [...new Set(beneficiarios.map(b => b.bairro).filter(Boolean))].sort().map(bairro => {
          const count = beneficiarios.filter(b => b.bairro === bairro).length;
          const pct = Math.round((count / beneficiarios.length) * 100);
          return <div key={bairro} style={{ marginBottom: 14 }}>
            <div className="bairro-row"><span className="bairro-name">{bairro}</span><span className="bairro-count">{count} família{count !== 1 ? "s" : ""} · {pct}%</span></div>
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
  { id: "familias", icon: "📋", label: "Famílias" },
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
  const [entidade, setEntidade] = useState(null);
  const [familias, setFamilias] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st);
    return () => document.head.removeChild(st);
  }, []);

  useEffect(() => {
    Promise.all([sGet("beneficiarios"), sGet("atendimentos"), sGet("estoque"), sGet("movimentacoes"), sGet("metas"), sGet("entidade"), sGet("familias")])
      .then(([b, a, e, m, mt, en, fa]) => {
        setBeneficiarios(b || []); setAtendimentos(a || []); setEstoque(e || []);
        setMovs(m || []); setMetas(mt || []); setEntidade(en); setFamilias(fa || []);
        setReady(true);
      });
  }, []);

  return (
    <>
      <header className="app-header">
        <div className="header-stripe" />
        <div className="header-inner">
          <PartilharLogo />
          <div className="header-badges">
            <div className="header-badge"><div className="header-badge-val">{beneficiarios.length}</div><div className="header-badge-label">famílias</div></div>
            <div className="header-badge"><div className="header-badge-val">{atendimentos.length}</div><div className="header-badge-label">atendimentos</div></div>
          </div>
        </div>
      </header>

      <nav className="desktop-nav">
        <div className="desktop-nav-inner">
          {NAV.map(n => <button key={n.id} className={`nav-tab${mod === n.id ? " active" : ""}`} onClick={() => setMod(n.id)}><span>{n.icon}</span> {n.label}</button>)}
        </div>
      </nav>

      <main className="page-wrap">
        <div className="page-content">
          {!ready ? <div className="loading-wrap"><div className="loading-spinner" /><p style={{ color: "var(--gray-500)" }}>Carregando...</p></div>
            : <>
              {mod === "beneficiarios" && <BeneficiariosModule beneficiarios={beneficiarios} setBeneficiarios={setBeneficiarios} atendimentos={atendimentos} />}
              {mod === "familias" && <FamiliasModule entidade={entidade} setEntidade={setEntidade} familias={familias} setFamilias={setFamilias} />}
              {mod === "doacoes" && <DoacoesModule estoque={estoque} setEstoque={setEstoque} movs={movs} setMovs={setMovs} metas={metas} setMetas={setMetas} />}
              {mod === "atendimentos" && <AtendimentosModule atendimentos={atendimentos} setAtendimentos={setAtendimentos} beneficiarios={beneficiarios} estoque={estoque} setEstoque={setEstoque} movs={movs} setMovs={setMovs} />}
              {mod === "relatorios" && <RelatoriosModule beneficiarios={beneficiarios} atendimentos={atendimentos} estoque={estoque} movs={movs} />}
            </>}
        </div>
      </main>

      <nav className="mobile-nav">
        <div className="mobile-nav-inner">
          {NAV.map(n => <button key={n.id} className={`mobile-nav-btn${mod === n.id ? " active" : ""}`} onClick={() => setMod(n.id)}><span className="m-icon">{n.icon}</span><span>{n.label}</span></button>)}
        </div>
      </nav>
    </>
  );
}
