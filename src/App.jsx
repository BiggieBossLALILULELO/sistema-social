import { useState, useEffect, useRef } from "react";
import db from "./db";

async function sGet(k) { try { const r = await db.kv.get(k); return r ? r.value : null; } catch { return null; } }
async function sSet(k, v) { try { await db.kv.put({ key: k, value: v }); } catch (e) { console.error(e); } }
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function fDate(iso) { return iso ? new Date(iso).toLocaleDateString("pt-BR") : "—"; }
function fCur(v) { return "R$ " + Number(v || 0).toFixed(2).replace(".", ","); }
function nowYM() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; }
function ymLabel(ym) { const [y, m] = ym.split("-"); return `${MESES[Number(m) - 1]} ${y}`; }
function haptic(strong = false) { if ("vibrate" in navigator) navigator.vibrate(strong ? 25 : 8); }

// ── Sistema de Modais ─────────────────────────────────────────────
let _setModal = null;
function showAlert(message, opts = {}) {
  return new Promise(resolve => {
    if (_setModal) _setModal({ type: "alert", message, title: opts.title, variant: opts.variant || "info", resolve });
    else { window.alert(message); resolve(); }
  });
}
function showConfirm(message, opts = {}) {
  return new Promise(resolve => {
    if (_setModal) _setModal({ type: "confirm", message, title: opts.title || "Confirmar", variant: opts.variant || "danger", confirmLabel: opts.confirmLabel || "Sim, confirmar", cancelLabel: opts.cancelLabel || "Cancelar", resolve });
    else resolve(window.confirm(message));
  });
}
function ModalRoot() {
  const [m, setM] = useState(null);
  useEffect(() => { _setModal = setM; return () => { _setModal = null; }; }, []);
  if (!m) return null;
  const close = r => { haptic(); m.resolve(r); setM(null); };
  const icons = { info: "ℹ️", success: "✅", warning: "⚠️", danger: "🗑️", question: "❓" };
  return (
    <div className="modal-backdrop" onClick={() => m.type === "alert" && close()}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-icon">{icons[m.variant] || icons.info}</div>
        {m.title && <h3 className="modal-title">{m.title}</h3>}
        <p className="modal-message">{m.message}</p>
        <div className="modal-actions">
          {m.type === "confirm" && <button className="btn btn-md btn-ghost" onClick={() => close(false)}>{m.cancelLabel}</button>}
          <button className={`btn btn-md btn-${m.variant === "danger" ? "danger" : "primary"}`} onClick={() => close(true)}>{m.type === "confirm" ? m.confirmLabel : "OK"}</button>
        </div>
      </div>
    </div>
  );
}

// ── Máscaras ──────────────────────────────────────────────────────
function mCPF(v) { return v.replace(/\D/g, "").slice(0, 11).replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2"); }
function vCPF(c) {
  const x = c.replace(/\D/g, "");
  if (x.length !== 11 || /^(\d)\1+$/.test(x)) return false;
  let s = 0; for (let i = 0; i < 9; i++) s += parseInt(x[i]) * (10 - i);
  let r = (s * 10) % 11; if (r >= 10) r = 0; if (r !== parseInt(x[9])) return false;
  s = 0; for (let i = 0; i < 10; i++) s += parseInt(x[i]) * (11 - i);
  r = (s * 10) % 11; if (r >= 10) r = 0; return r === parseInt(x[10]);
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
  const n = v.replace(/\D/g, "").slice(0, 11);
  if (n.length <= 3) return n;
  if (n.length <= 8) return n.slice(0,3) + "." + n.slice(3);
  if (n.length <= 10) return n.slice(0,3) + "." + n.slice(3,8) + "." + n.slice(8);
  return n.slice(0,3) + "." + n.slice(3,8) + "." + n.slice(8,10) + "-" + n.slice(10);
}
function vNIS(v) { return v.replace(/\D/g, "").length === 11; }
function mCNPJ(v) { return v.replace(/\D/g, "").slice(0, 14).replace(/(\d{2})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1/$2").replace(/(\d{4})(\d{1,2})$/, "$1-$2"); }

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
html { -webkit-text-size-adjust: 100%; touch-action: manipulation; }
body { font-family: var(--font-body); background: var(--bg); color: var(--gray-900); -webkit-font-smoothing: antialiased; font-size: 15px; line-height: 1.6; overscroll-behavior-y: contain; }
input, select, textarea, button { font-family: var(--font-body); }
button { -webkit-tap-highlight-color: transparent; }

/* HEADER */
.app-header { background: var(--green-800); position: sticky; top: 0; z-index: 200; box-shadow: 0 2px 20px rgba(0,0,0,0.2); transition: transform 0.3s cubic-bezier(0.4,0,0.2,1); padding-top: env(safe-area-inset-top); }
.app-header.hidden { transform: translateY(-100%); }
.header-stripe { height: 4px; background: linear-gradient(90deg, #F472B6, #FDE047, #F472B6); }
.header-inner { max-width: 1080px; margin: 0 auto; display: flex; align-items: center; gap: 18px; padding: 14px 24px; }
.header-logo-svg { height: 58px; flex-shrink: 0; }
.header-badges { display: flex; gap: 10px; margin-left: auto; }
.header-badge { background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2); border-radius: 12px; padding: 8px 16px; text-align: center; min-width: 72px; }
.header-badge-val { font-family: var(--font-sans); font-size: 20px; font-weight: 800; color: #fff; line-height: 1; }
.header-badge-label { font-size: 10px; color: rgba(255,255,255,0.65); margin-top: 3px; text-transform: uppercase; letter-spacing: 0.04em; }

.desktop-nav { background: var(--green-900); border-bottom: 1px solid rgba(255,255,255,0.08); }
.desktop-nav-inner { max-width: 1080px; margin: 0 auto; display: flex; padding: 0 24px; overflow-x: auto; -webkit-overflow-scrolling: touch; }
.nav-tab { padding: 14px 20px; border: none; background: none; cursor: pointer; font-family: var(--font-sans); font-weight: 600; font-size: 13.5px; color: rgba(255,255,255,0.55); border-bottom: 3px solid transparent; transition: all 0.2s; white-space: nowrap; display: flex; align-items: center; gap: 7px; }
.nav-tab:hover { color: rgba(255,255,255,0.85); background: rgba(255,255,255,0.05); }
.nav-tab.active { color: #fff; border-bottom-color: #F472B6; }

.mobile-nav { display: none; position: fixed; bottom: 0; left: 0; right: 0; z-index: 200; background: var(--white); border-top: 1px solid var(--border); box-shadow: 0 -4px 24px rgba(0,0,0,0.1); padding-bottom: env(safe-area-inset-bottom); }
.mobile-nav-inner { display: flex; }
.mobile-nav-btn { flex: 1; border: none; background: none; cursor: pointer; font-family: var(--font-sans); font-weight: 600; font-size: 10px; color: var(--gray-400); padding: 10px 2px 12px; display: flex; flex-direction: column; align-items: center; gap: 4px; position: relative; min-height: 56px; }
.mobile-nav-btn.active { color: var(--green-700); }
.mobile-nav-btn .m-icon { font-size: 22px; line-height: 1; }
.mobile-nav-btn::after { content: ''; position: absolute; top: 0; left: 20%; right: 20%; height: 3px; border-radius: 0 0 3px 3px; background: #F472B6; transform: scaleX(0); transition: transform 0.2s; }
.mobile-nav-btn.active::after { transform: scaleX(1); }

@media (max-width: 720px) {
  .desktop-nav { display: none; } .mobile-nav { display: block; }
  .header-inner { padding: 8px 14px; gap: 10px; }
  .header-logo-svg { height: 38px; }
  .header-badge { padding: 5px 9px; min-width: 46px; border-radius: 9px; }
  .header-badge-val { font-size: 15px; }
  .header-badge-label { font-size: 9px; margin-top: 1px; }
  body { font-size: 14.5px; }
}

.page-wrap { max-width: 1080px; margin: 0 auto; padding: 0 24px; }
.page-content { padding: 28px 0 110px; }
@media (max-width: 720px) { .page-wrap { padding: 0 14px; } .page-content { padding: 18px 0 95px; } }

.section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
.section-title-lg { font-family: var(--font-sans); font-size: 22px; font-weight: 800; color: var(--gray-900); letter-spacing: -0.02em; }
.section-sub { font-size: 14px; color: var(--gray-500); margin-top: 2px; }
@media (max-width: 720px) { .section-title-lg { font-size: 19px; } .section-sub { font-size: 13px; } }

.card { background: var(--white); border-radius: var(--radius); border: 1px solid var(--border); padding: 20px 22px; box-shadow: var(--shadow-sm); transition: box-shadow 0.2s, transform 0.2s; }
.card-hover { cursor: pointer; }
.card-hover:active { transform: scale(0.98); }
@media (min-width: 721px) { .card-hover:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); } }
.card-accent-green { border-left: 4px solid var(--green-600); }
.card-accent-purple { border-left: 4px solid var(--purple-700); }
.card-accent-pink { border-left: 4px solid #DB2777; }
@media (max-width: 720px) { .card { padding: 16px 18px; border-radius: 12px; } }

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
.stats-3 { grid-template-columns: repeat(3,1fr); }
@media (max-width: 720px) { .stats-3 { grid-template-columns: 1fr 1fr; } }
@media (max-width: 720px) { .stats-grid { grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 18px; } .stat-card { padding: 13px 14px; } .stat-value { font-size: 24px; } .stat-label { font-size: 10px; } }

.form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.form-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }
.form-grid-4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 12px; }
@media (max-width: 720px) { .form-grid-2, .form-grid-3, .form-grid-4 { grid-template-columns: 1fr; gap: 14px; } }

.field { display: flex; flex-direction: column; gap: 6px; }
.field-label { font-family: var(--font-sans); font-size: 12px; font-weight: 700; color: var(--gray-600); text-transform: uppercase; letter-spacing: 0.06em; }
.field-required { color: var(--red-700); margin-left: 2px; }
.field-hint { font-size: 11px; color: var(--gray-400); margin-top: 3px; }
.field-input { padding: 12px 14px; border-radius: var(--radius-xs); border: 1.5px solid var(--gray-300); font-size: 16px; color: var(--gray-900); background: var(--white); outline: none; width: 100%; transition: border-color 0.15s, box-shadow 0.15s; box-shadow: var(--shadow-xs); min-height: 46px; }
.field-input:focus { border-color: var(--green-600); box-shadow: 0 0 0 3px rgba(33,149,106,0.15); }
.field-input.error { border-color: var(--red-700); box-shadow: 0 0 0 3px rgba(185,28,28,0.1); }
.field-input::placeholder { color: var(--gray-400); }
.field-input:disabled { background: var(--gray-100); color: var(--gray-400); cursor: not-allowed; }
textarea.field-input { resize: vertical; min-height: 88px; line-height: 1.6; }
.field-error { font-size: 12px; color: var(--red-700); font-weight: 600; margin-top: 3px; display: flex; align-items: center; gap: 4px; }

.checkbox-row { display: flex; align-items: center; gap: 12px; cursor: pointer; user-select: none; padding: 14px 16px; background: var(--gray-50); border-radius: var(--radius-xs); border: 1.5px solid var(--gray-200); transition: all 0.15s; min-height: 56px; }
.checkbox-row:active { transform: scale(0.99); }
.checkbox-row.checked { background: var(--green-50); border-color: var(--green-600); }
.checkbox-row input { width: 22px; height: 22px; cursor: pointer; accent-color: var(--green-700); flex-shrink: 0; }
.checkbox-row label { font-size: 14.5px; font-weight: 600; color: var(--gray-700); cursor: pointer; flex: 1; }

.radio-group { display: flex; flex-wrap: wrap; gap: 8px; }
.radio-pill { padding: 10px 16px; border-radius: 99px; border: 1.5px solid var(--gray-300); background: var(--white); color: var(--gray-600); cursor: pointer; font-family: var(--font-sans); font-size: 13.5px; font-weight: 600; transition: all 0.15s; min-height: 40px; }
.radio-pill:active { transform: scale(0.96); }
.radio-pill.selected { background: var(--green-700); color: #fff; border-color: var(--green-700); box-shadow: 0 2px 8px rgba(26,122,80,0.25); }

.btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; border: none; border-radius: var(--radius-xs); cursor: pointer; font-family: var(--font-sans); font-weight: 700; transition: all 0.18s; white-space: nowrap; min-height: 44px; }
.btn:active { transform: scale(0.97); }
.btn-lg { padding: 14px 28px; font-size: 15px; border-radius: var(--radius-sm); min-height: 50px; }
.btn-md { padding: 11px 22px; font-size: 14px; min-height: 44px; }
.btn-sm { padding: 9px 16px; font-size: 13px; min-height: 38px; }
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
.btn-icon-action { width: 38px; height: 38px; min-height: 38px; padding: 0; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; }
@media (max-width: 720px) { .btn-icon-action { width: 42px; height: 42px; min-height: 42px; font-size: 16px; } }

.badge { display: inline-flex; align-items: center; gap: 4px; font-family: var(--font-sans); font-size: 11.5px; font-weight: 700; padding: 3px 10px; border-radius: 99px; white-space: nowrap; }
.badge-green { background: var(--green-100); color: var(--green-800); }
.badge-amber { background: var(--amber-100); color: var(--amber-700); }
.badge-red { background: var(--red-100); color: var(--red-700); }
.badge-blue { background: var(--blue-100); color: var(--blue-700); }
.badge-purple { background: var(--purple-100); color: var(--purple-700); }
.badge-gray { background: var(--gray-100); color: var(--gray-600); }
.badge-pink { background: var(--pink-100); color: var(--pink-600); }

.alert { border-radius: var(--radius-sm); padding: 14px 18px; display: flex; align-items: flex-start; gap: 12px; margin-bottom: 18px; border: 1px solid; }
.alert-icon { font-size: 20px; flex-shrink: 0; margin-top: 1px; }
.alert-red { background: var(--red-50); border-color: #FCA5A5; }
.alert-amber { background: var(--amber-50); border-color: #FCD34D; }
.alert-green { background: var(--green-50); border-color: var(--green-100); }

.progress-track { background: var(--gray-100); border-radius: 99px; height: 10px; overflow: hidden; }
.progress-fill { height: 100%; border-radius: 99px; transition: width 0.6s ease; }

.empty-state { text-align: center; padding: 56px 24px; background: var(--white); border-radius: var(--radius); border: 1.5px dashed var(--gray-300); }
.empty-icon { font-size: 52px; margin-bottom: 16px; opacity: 0.5; display: block; }
.empty-title { font-family: var(--font-sans); font-size: 16px; font-weight: 700; color: var(--gray-700); margin-bottom: 6px; }
.empty-sub { font-size: 14px; color: var(--gray-500); line-height: 1.6; }

.search-wrap { display: flex; gap: 12px; align-items: center; margin-bottom: 20px; flex-wrap: wrap; }
.search-input { flex: 1; min-width: 220px; padding: 13px 18px; border-radius: var(--radius-sm); border: 1.5px solid var(--gray-300); font-size: 16px; color: var(--gray-900); background: var(--white); outline: none; box-shadow: var(--shadow-sm); transition: all 0.15s; min-height: 48px; }
.search-input:focus { border-color: var(--green-600); box-shadow: 0 0 0 3px rgba(33,149,106,0.12); }

.inner-tabs { display: flex; gap: 4px; background: var(--gray-100); padding: 5px; border-radius: var(--radius-sm); margin-bottom: 22px; border: 1px solid var(--gray-200); overflow-x: auto; -webkit-overflow-scrolling: touch; }
.inner-tab { padding: 10px 16px; border-radius: var(--radius-xs); border: none; cursor: pointer; font-family: var(--font-sans); font-weight: 600; font-size: 13.5px; background: transparent; color: var(--gray-500); transition: all 0.15s; white-space: nowrap; min-height: 40px; flex-shrink: 0; }
.inner-tab.active { background: var(--white); color: var(--green-800); box-shadow: var(--shadow-sm); font-weight: 700; border: 1px solid var(--gray-200); }

.filter-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 18px; }
.filter-pill { padding: 8px 16px; border-radius: 99px; border: 1.5px solid var(--gray-300); background: var(--white); color: var(--gray-600); cursor: pointer; font-family: var(--font-sans); font-size: 13px; font-weight: 600; transition: all 0.15s; box-shadow: var(--shadow-xs); min-height: 36px; }
.filter-pill.active { background: var(--green-700); color: #fff; border-color: var(--green-700); }

.divider { border: none; border-top: 1px solid var(--gray-200); margin: 20px 0; }
.back-bar { display: flex; align-items: center; gap: 14px; margin-bottom: 22px; }
.back-bar h2 { font-family: var(--font-sans); font-size: 22px; font-weight: 800; color: var(--gray-900); letter-spacing: -0.02em; }
@media (max-width: 720px) { .back-bar h2 { font-size: 18px; } }

.item-tag { display: inline-block; font-size: 13px; font-weight: 600; background: var(--green-50); color: var(--green-800); border: 1px solid var(--green-100); padding: 4px 12px; border-radius: 99px; }
.ben-name { font-family: var(--font-sans); font-weight: 700; font-size: 16px; color: var(--gray-900); margin-bottom: 4px; }
.ben-meta { font-size: 13.5px; color: var(--gray-500); }
.ben-needs { margin-top: 12px; font-size: 13.5px; color: var(--gray-600); background: var(--gray-50); padding: 10px 14px; border-radius: var(--radius-xs); border-left: 3px solid var(--green-100); line-height: 1.5; }
.mov-icon { width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-bottom: 16px; }
.detail-key { font-family: var(--font-sans); font-size: 11px; font-weight: 700; color: var(--gray-400); text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 4px; }
.detail-val { font-size: 15px; color: var(--gray-800); font-weight: 500; }
@media (max-width: 720px) { .detail-grid { grid-template-columns: 1fr; gap: 12px; } }

.form-section { background: var(--white); border-radius: var(--radius); border: 1px solid var(--border); padding: 22px 24px; box-shadow: var(--shadow-sm); margin-bottom: 14px; scroll-margin-top: 100px; }
.form-section-header { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; }
.form-step-num { width: 32px; height: 32px; border-radius: 50%; background: var(--green-700); color: #fff; font-family: var(--font-sans); font-size: 14px; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.form-step-title { font-family: var(--font-sans); font-size: 15.5px; font-weight: 700; color: var(--gray-800); }
@media (max-width: 720px) { .form-section { padding: 18px 18px; } }

.summary-banner { background: linear-gradient(135deg, var(--green-900) 0%, var(--green-700) 60%, var(--green-600) 100%); border-radius: var(--radius-lg); padding: 28px 32px; color: #fff; margin-bottom: 28px; box-shadow: var(--shadow-lg); position: relative; overflow: hidden; }
.summary-banner::after { content: ''; position: absolute; top: -40px; right: -40px; width: 180px; height: 180px; background: rgba(255,255,255,0.05); border-radius: 50%; }
.summary-stats { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; margin-top: 20px; }
.summary-stat { background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.15); border-radius: var(--radius-sm); padding: 14px 16px; }
.summary-stat-val { font-family: var(--font-sans); font-size: 28px; font-weight: 800; color: #fff; line-height: 1; }
.summary-stat-label { font-size: 11px; color: rgba(255,255,255,0.7); margin-top: 4px; text-transform: uppercase; letter-spacing: 0.05em; }
@media (max-width: 720px) { .summary-banner { padding: 20px; border-radius: var(--radius); } .summary-stats { grid-template-columns: 1fr 1fr; } }

.autocomplete-list { background: var(--white); border: 1.5px solid var(--gray-200); border-radius: var(--radius-sm); overflow: hidden; box-shadow: var(--shadow-md); margin-top: 4px; }
.autocomplete-item { padding: 14px 16px; cursor: pointer; border-bottom: 1px solid var(--gray-100); min-height: 56px; }
.autocomplete-item:last-child { border-bottom: none; }
.autocomplete-item:active { background: var(--green-50); }

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

/* MODAL */
.modal-backdrop { position: fixed; inset: 0; background: rgba(15,23,42,0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; padding: 20px; z-index: 1000; animation: fadeIn 0.15s ease; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.modal-box { background: var(--white); border-radius: var(--radius); padding: 28px 24px 22px; max-width: 380px; width: 100%; box-shadow: var(--shadow-lg); text-align: center; animation: popIn 0.2s cubic-bezier(0.34,1.56,0.64,1); }
@keyframes popIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.modal-icon { font-size: 48px; margin-bottom: 14px; }
.modal-title { font-family: var(--font-sans); font-size: 18px; font-weight: 800; color: var(--gray-900); margin-bottom: 10px; }
.modal-message { font-size: 15px; color: var(--gray-600); line-height: 1.55; margin-bottom: 22px; }
.modal-actions { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
.modal-actions .btn { flex: 1; max-width: 180px; }

/* TABELA FAMÍLIAS */
.fam-table-wrap { background: var(--white); border-radius: var(--radius); border: 1px solid var(--border); overflow-x: auto; box-shadow: var(--shadow-sm); -webkit-overflow-scrolling: touch; }
.fam-table { width: 100%; border-collapse: collapse; min-width: 720px; }
.fam-table th { background: var(--green-700); color: #fff; padding: 12px 14px; text-align: left; font-family: var(--font-sans); font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; }
.fam-table td { padding: 12px 14px; border-bottom: 1px solid var(--gray-100); font-size: 13.5px; }
.fam-table .num-col { text-align: center; font-weight: 700; color: var(--gray-500); width: 40px; }
.fam-table .age-col { text-align: center; width: 60px; font-family: var(--font-sans); font-weight: 700; }
.fam-table .action-col { width: 110px; text-align: center; }

/* CARDS DE FAMÍLIA (MOBILE) */
.fam-card-list { display: none; }
@media (max-width: 720px) {
  .fam-table-wrap { display: none; }
  .fam-card-list { display: flex; flex-direction: column; gap: 12px; }
}
.fam-card { background: var(--white); border-radius: var(--radius); border: 1px solid var(--border); padding: 16px 18px; box-shadow: var(--shadow-sm); }
.fam-card-num { background: var(--green-700); color: #fff; font-family: var(--font-sans); font-weight: 800; font-size: 13px; padding: 3px 10px; border-radius: 99px; }
.fam-card-name { font-family: var(--font-sans); font-weight: 700; font-size: 16px; color: var(--gray-900); margin-top: 8px; }
.fam-card-info { font-size: 13px; color: var(--gray-500); margin-top: 4px; }
.fam-card-faixas { display: grid; grid-template-columns: repeat(5,1fr); gap: 6px; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--gray-100); }
.fam-card-faixa { text-align: center; padding: 6px 4px; background: var(--gray-50); border-radius: 6px; }
.fam-card-faixa-label { font-size: 9px; font-weight: 700; color: var(--gray-500); text-transform: uppercase; }
.fam-card-faixa-val { font-family: var(--font-sans); font-size: 15px; font-weight: 800; color: var(--gray-700); margin-top: 2px; }
.fam-card-actions { display: flex; gap: 8px; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--gray-100); }
.fam-card-actions button { flex: 1; min-height: 40px; }

::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-thumb { background: var(--gray-300); border-radius: 99px; }
`;

// ── Logo SVG ──────────────────────────────────────────────────────
function PartilharLogo() {
  return (
    <svg className="header-logo-svg" viewBox="0 0 340 90" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(8, 15)">
        <ellipse cx="20" cy="22" rx="20" ry="14" fill="#F472B6" stroke="#7F2A4D" strokeWidth="1.2" transform="rotate(-25 20 22)" />
        <ellipse cx="58" cy="22" rx="20" ry="14" fill="#F472B6" stroke="#7F2A4D" strokeWidth="1.2" transform="rotate(25 58 22)" />
        <ellipse cx="22" cy="46" rx="15" ry="11" fill="#F472B6" stroke="#7F2A4D" strokeWidth="1.2" transform="rotate(20 22 46)" />
        <ellipse cx="56" cy="46" rx="15" ry="11" fill="#F472B6" stroke="#7F2A4D" strokeWidth="1.2" transform="rotate(-20 56 46)" />
        <ellipse cx="20" cy="22" rx="11" ry="7" fill="#FDE047" transform="rotate(-25 20 22)" />
        <ellipse cx="58" cy="22" rx="11" ry="7" fill="#FDE047" transform="rotate(25 58 22)" />
        <ellipse cx="22" cy="46" rx="8" ry="6" fill="#FDE047" transform="rotate(20 22 46)" />
        <ellipse cx="56" cy="46" rx="8" ry="6" fill="#FDE047" transform="rotate(-20 56 46)" />
        <ellipse cx="39" cy="34" rx="2.5" ry="20" fill="#7F2A4D" />
        <circle cx="39" cy="14" r="2.8" fill="#7F2A4D" />
        <path d="M37 11 Q 32 4, 29 6" stroke="#7F2A4D" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        <path d="M41 11 Q 46 4, 49 6" stroke="#7F2A4D" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        <circle cx="29" cy="6" r="1" fill="#7F2A4D" />
        <circle cx="49" cy="6" r="1" fill="#7F2A4D" />
      </g>
      <text x="92" y="24" fontFamily="Inter, sans-serif" fontSize="14" fill="rgba(255,255,255,0.85)" fontWeight="700" letterSpacing="1.5">GRUPO</text>
      <text x="92" y="62" fontFamily="Quicksand, sans-serif" fontSize="38" fill="#A3D900" fontWeight="700">Partilhar</text>
      <text x="94" y="80" fontFamily="Inter, sans-serif" fontSize="11.5" fill="rgba(255,255,255,0.75)" letterSpacing="2" fontWeight="600">ILUMINANDO CAMINHOS</text>
    </svg>
  );
}

// ── Componentes base ──────────────────────────────────────────────
function Inp({ label, required, hint, error, inputMode, style: s, ...p }) {
  return (
    <div className="field">
      {label && <label className="field-label">{label}{required && <span className="field-required">*</span>}</label>}
      <input className={`field-input${error ? " error" : ""}`} style={s} inputMode={inputMode} {...p} />
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
        {options.map(o => <button key={o} type="button" className={`radio-pill${value === o ? " selected" : ""}`} onClick={() => { haptic(); onChange(o); }}>{o}</button>)}
      </div>
    </div>
  );
}
function Btn({ children, variant = "primary", size = "md", onClick, type = "button", style: s }) {
  return <button type={type} onClick={e => { haptic(); onClick && onClick(e); }} style={s} className={`btn btn-${size} btn-${variant}`}>{children}</button>;
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
  return <div className="inner-tabs">{tabs.map(([k, l]) => <button key={k} className={`inner-tab${active === k ? " active" : ""}`} onClick={() => { haptic(); onChange(k); }}>{l}</button>)}</div>;
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
    body = `<h2 style="margin:0 0 18px;font-size:18px">Beneficiários — ${beneficiarios.length}</h2>
      <table width="100%" cellspacing="0" style="border-collapse:collapse;border:1px solid #E5E7EB">
        <tr><th style="${th}">Nome</th><th style="${th}">CPF</th><th style="${th}">NIS</th><th style="${th}">Bairro</th><th style="${th}">Pessoas</th><th style="${th}">Renda</th><th style="${th}">Primeiro cadastro</th></tr>
        ${beneficiarios.map((b, i) => `<tr style="background:${i % 2 ? "#F9FAFB" : "#fff"}"><td style="${td}">${b.nome}</td><td style="${td}">${b.cpf || "—"}</td><td style="${td}">${b.temNIS && b.nis ? b.nis : "—"}</td><td style="${td}">${b.bairro || "—"}</td><td style="${td}">${b.numPessoas || "—"}</td><td style="${td}">${b.renda ? fCur(b.renda) : "—"}</td><td style="${td}">${b.dataRegistro ? new Date(b.dataRegistro).toLocaleDateString("pt-BR") : "—"}</td></tr>`).join("")}
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
    body = `<h2 style="margin:0 0 8px;font-size:18px">Histórico — ${movs.length}</h2>
      <p style="margin:0 0 18px;color:#6B7280">Entradas: <strong>${ent}</strong> · Saídas: <strong>${sai}</strong></p>
      <table width="100%" cellspacing="0" style="border-collapse:collapse;border:1px solid #E5E7EB">
        <tr><th style="${th}">Data</th><th style="${th}">Tipo</th><th style="${th}">Item</th><th style="${th}">Qtd</th><th style="${th}">Origem/Destino</th></tr>
        ${movs.map((m, i) => `<tr style="background:${i % 2 ? "#F9FAFB" : "#fff"}"><td style="${td}">${fDate(m.data)}</td><td style="${td};color:${m.tipo === "entrada" ? "#1A7A50" : "#B45309"};font-weight:700">${m.tipo === "entrada" ? "⬇ Entrada" : "⬆ Saída"}</td><td style="${td}">${m.itemNome}</td><td style="${td}">${m.quantidade} ${m.unidade}</td><td style="${td}">${m.tipo === "entrada" ? (m.doador || "anônimo") : (m.beneficiario || "geral")}</td></tr>`).join("")}
      </table>`;
  }
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Relatório</title><style>body{font-family:Georgia,serif;max-width:960px;margin:0 auto;padding:40px 32px;color:#111}@media print{.no-print{display:none}}</style></head><body>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:32px;padding-bottom:20px;border-bottom:3px solid #155E3E">
      <div><h1 style="margin:0;color:#155E3E;font-size:26px">🦋 Sistema Partilhar</h1><p style="margin:8px 0 0;font-size:14px;color:#6B7280">Gerado em ${now}</p></div>
      <button class="no-print" onclick="window.print()" style="background:#155E3E;color:#fff;border:none;padding:13px 26px;border-radius:10px;cursor:pointer;font-size:14px;font-weight:700">🖨 Imprimir / Salvar PDF</button>
    </div>${body}</body></html>`;
  const w = window.open("", "_blank");
  if (w) { w.document.write(html); w.document.close(); }
}

function gerarRelatorioFamilia(entidade, familias) {
  const now = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  const th = `background:#155E3E;color:#fff;padding:10px;text-align:left;font-size:12px;font-weight:600`;
  const td = `padding:8px 10px;border:1px solid #E5E7EB;font-size:12px;vertical-align:top`;
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Cadastro de Família</title><style>body{font-family:Arial,sans-serif;max-width:1100px;margin:0 auto;padding:30px;color:#111}@media print{.no-print{display:none}}</style></head><body>
    <div style="display:flex;justify-content:space-between;margin-bottom:24px"><h1 style="margin:0;font-size:22px;color:#155E3E">📋 CADASTRO DE FAMÍLIA</h1>
    <button class="no-print" onclick="window.print()" style="background:#155E3E;color:#fff;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;font-weight:700">🖨 Imprimir / Salvar PDF</button></div>
    <table width="100%" style="border-collapse:collapse;margin-bottom:20px">
      <tr><td style="padding:6px 0"><strong>Entidade:</strong> ${entidade.nome || "—"}</td><td style="padding:6px 0"><strong>CNPJ:</strong> ${entidade.cnpj || "—"}</td></tr>
      <tr><td style="padding:6px 0" colspan="2"><strong>Endereço:</strong> ${entidade.endereco || "—"}</td></tr>
      <tr><td style="padding:6px 0"><strong>Telefone:</strong> ${entidade.telefone || "—"}</td><td style="padding:6px 0"><strong>Responsável:</strong> ${entidade.responsavel || "—"}</td></tr>
      <tr><td style="padding:6px 0"><strong>CPF Responsável:</strong> ${entidade.cpfResp || "—"}</td><td style="padding:6px 0"><strong>Data:</strong> ${now}</td></tr>
    </table>
    <table width="100%" style="border-collapse:collapse;border:1px solid #E5E7EB">
      <tr><th style="${th}">Nº</th><th style="${th}">Chefe / CPF</th><th style="${th}">Mãe do chefe</th><th style="${th}">Endereço</th><th style="${th}">NIS</th><th style="${th}">Cadastro</th><th style="${th}">0-6</th><th style="${th}">7-14</th><th style="${th}">15-23</th><th style="${th}">24-65</th><th style="${th}">+65</th></tr>
      ${familias.map((f, i) => `<tr><td style="${td};text-align:center;font-weight:700">${i + 1}</td><td style="${td}"><strong>${f.chefeNome || "—"}</strong><br/><span style="color:#6B7280">CPF: ${f.chefeCPF || "—"}</span></td><td style="${td}">${f.maeNome || "—"}</td><td style="${td}">${f.endereco || "—"}</td><td style="${td}">${f.nis || "—"}</td><td style="${td}">${f.dataRegistro ? new Date(f.dataRegistro).toLocaleDateString("pt-BR") : "—"}</td><td style="${td}">${f.dataRegistro ? new Date(f.dataRegistro).toLocaleDateString("pt-BR") : "—"}</td><td style="${td};text-align:center">${/^\d+$/.test(String(f.faixa1 || "").trim()) ? f.faixa1 : ""}</td><td style="${td};text-align:center">${/^\d+$/.test(String(f.faixa2 || "").trim()) ? f.faixa2 : ""}</td><td style="${td};text-align:center">${/^\d+$/.test(String(f.faixa3 || "").trim()) ? f.faixa3 : ""}</td><td style="${td};text-align:center">${/^\d+$/.test(String(f.faixa4 || "").trim()) ? f.faixa4 : ""}</td><td style="${td};text-align:center">${/^\d+$/.test(String(f.faixa5 || "").trim()) ? f.faixa5 : ""}</td></tr>`).join("")}
    </table>
    <p style="font-size:11px;color:#6B7280;margin-top:8px">Pessoas/Idade — quantidade por faixa etária</p>
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
  const EF = { nome: "", dataNascimento: "", sexo: "", nomeMae: "", rg: "", cpf: "", temNIS: false, nis: "", escolaridade: "", religiao: "", telefone: "", cep: "", endereco: "", numero: "", complemento: "", bairro: "", pontoReferencia: "", numPessoas: "", idadesPessoas: "", composicaoFamiliar: "", relacionamentoFamiliar: "", profissao: "", ondeTrabalha: "", renda: "", pessoasDependem: "", beneficio: "", moradia: "", demanda: "", necessidades: "", interesseFormacao: "", parecerProfissional: "", encaminhamentos: "", profissionalResponsavel: "", observacoes: "", dataRegistro: "" };
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
    if (form.temNIS && form.nis && !vNIS(form.nis)) e.nis = "NIS inválido. 11 dígitos.";
    setErros(e); return Object.keys(e).length === 0;
  };

  const save = async d => { await sSet("beneficiarios", d); setBeneficiarios(d); };
  const submit = async () => {
    if (!validar()) {
      await showAlert("Há campos com erros. Verifique os campos marcados em vermelho.", { title: "Atenção", variant: "warning" });
      return;
    }
    await save([...beneficiarios, { ...form, id: uid(), dataRegistro: form.dataRegistro ? new Date(form.dataRegistro.split('/').reverse().join('-')).toISOString() : new Date().toISOString() }]);
    haptic(true);
    await showAlert("Beneficiário cadastrado com sucesso!", { title: "Tudo certo!", variant: "success" });
    setForm(EF); setErros({}); setView("list");
  };
  const del = async id => {
    if (!await showConfirm("Tem certeza que deseja remover este beneficiário?", { title: "Remover beneficiário", variant: "danger" })) return;
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
        <h2>Nova ficha</h2>
      </div>

      <FormSection step="1" title="Identificação pessoal">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Inp label="Nome completo" required value={form.nome} onChange={f("nome")} placeholder="Ex: Maria da Silva" autoComplete="name" error={erros.nome} />
          <Inp label="Data do primeiro cadastro" value={form.dataRegistro} onChange={f("dataRegistro")} placeholder="DD/MM/AAAA" hint="Deixe em branco para usar a data de hoje. Preencha se for um cadastro antigo." type="date" />
          <div style={{ background: "var(--green-50)", border: "1.5px solid var(--green-100)", borderRadius: "var(--radius-xs)", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 700, color: "var(--green-700)", textTransform: "uppercase", letterSpacing: "0.06em" }}>📅 Data do primeiro cadastro</span>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 15, fontWeight: 700, color: "var(--green-800)" }}>{new Date().toLocaleDateString("pt-BR")}</span>
          </div>
          <div className="form-grid-3">
            <Inp label="Data de nascimento" type="date" value={form.dataNascimento} onChange={f("dataNascimento")} />
            <Sel label="Sexo" value={form.sexo} onChange={f("sexo")}>
              <option value="">Selecione...</option>
              {SEXOS.map(s => <option key={s}>{s}</option>)}
            </Sel>
            <Inp label="Nome da mãe" value={form.nomeMae} onChange={f("nomeMae")} placeholder="Ana da Silva" autoComplete="off" />
          </div>
        </div>
      </FormSection>

      <FormSection step="2" title="Documentos">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="form-grid-2">
            <Inp label="RG" value={form.rg} onChange={f("rg")} placeholder="0.000.000" inputMode="numeric" />
            <Inp label="CPF" value={form.cpf} onChange={f("cpf")} placeholder="000.000.000-00" inputMode="numeric" hint="11 dígitos" error={erros.cpf} />
          </div>
          <div className={`checkbox-row${form.temNIS ? " checked" : ""}`} onClick={() => { haptic(); setForm({ ...form, temNIS: !form.temNIS, nis: !form.temNIS ? form.nis : "" }); }}>
            <input type="checkbox" checked={form.temNIS} onChange={() => { }} />
            <label>A família possui cadastro no NIS?</label>
          </div>
          {form.temNIS && <Inp label="Número do NIS" value={form.nis} onChange={f("nis")} placeholder="000.00000.00-0" inputMode="numeric" hint="11 dígitos" error={erros.nis} />}
        </div>
      </FormSection>

      <FormSection step="3" title="Educação e religião">
        <div className="form-grid-2">
          <Sel label="Escolaridade" value={form.escolaridade} onChange={f("escolaridade")}>
            <option value="">Selecione...</option>
            {ESCOLARIDADES.map(e => <option key={e}>{e}</option>)}
          </Sel>
          <Inp label="Religião" value={form.religiao} onChange={f("religiao")} placeholder="Católica, Evangélica..." />
        </div>
      </FormSection>

      <FormSection step="4" title="Contato e endereço">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Inp label="Telefone / WhatsApp" value={form.telefone} onChange={f("telefone")} placeholder="(81) 9 0000-0000" type="tel" inputMode="tel" autoComplete="tel" error={erros.telefone} />
          <div className="form-grid-2">
            <Inp label="CEP" value={form.cep} onChange={f("cep")} placeholder="00000-000" inputMode="numeric" autoComplete="postal-code" error={erros.cep} />
            <Sel label="Bairro" value={form.bairro} onChange={f("bairro")}>
              <option value="">Selecione...</option>
              {BAIRROS.map(b => <option key={b}>{b}</option>)}
            </Sel>
          </div>
          <div className="form-grid-3">
            <Inp label="Rua" value={form.endereco} onChange={f("endereco")} placeholder="Rua das Flores" autoComplete="address-line1" />
            <Inp label="Número" value={form.numero} onChange={f("numero")} placeholder="123" inputMode="numeric" />
            <Inp label="Complemento" value={form.complemento} onChange={f("complemento")} placeholder="Apto, casa..." />
          </div>
          <Inp label="Ponto de referência" value={form.pontoReferencia} onChange={f("pontoReferencia")} placeholder="Próximo à padaria..." />
        </div>
      </FormSection>

      <FormSection step="5" title="Composição familiar">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="form-grid-2">
            <Inp label="Quantas pessoas na casa?" type="number" min="1" inputMode="numeric" value={form.numPessoas} onChange={f("numPessoas")} placeholder="4" />
            <Inp label="Idades" value={form.idadesPessoas} onChange={f("idadesPessoas")} placeholder="32, 28, 8, 3" />
          </div>
          <Txta label="Composição familiar" value={form.composicaoFamiliar} onChange={f("composicaoFamiliar")} placeholder="Mãe, pai, dois filhos..." />
          <Txta label="Relacionamento familiar" value={form.relacionamentoFamiliar} onChange={f("relacionamentoFamiliar")} placeholder="Como é o relacionamento..." />
        </div>
      </FormSection>

      <FormSection step="6" title="Trabalho e renda">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="form-grid-2">
            <Inp label="Profissão" value={form.profissao} onChange={f("profissao")} placeholder="Doméstica, autônomo..." />
            <Inp label="Onde trabalha" value={form.ondeTrabalha} onChange={f("ondeTrabalha")} placeholder="Local de trabalho" />
          </div>
          <div className="form-grid-2">
            <Inp label="Renda familiar (R$)" type="number" min="0" inputMode="decimal" value={form.renda} onChange={f("renda")} placeholder="800" />
            <Inp label="Pessoas dependem dessa renda?" type="number" min="0" inputMode="numeric" value={form.pessoasDependem} onChange={f("pessoasDependem")} placeholder="4" />
          </div>
          <Inp label="Algum benefício ou ajuda?" value={form.beneficio} onChange={f("beneficio")} placeholder="Bolsa Família, BPC..." />
          <RadioGroup label="Moradia" value={form.moradia} options={MORADIAS} onChange={v => setForm({ ...form, moradia: v })} />
        </div>
      </FormSection>

      <FormSection step="7" title="Demanda e necessidades">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Txta label="Demanda principal" value={form.demanda} onChange={f("demanda")} placeholder="Por que a família procurou a instituição?" />
          <Txta label="Maiores necessidades" value={form.necessidades} onChange={f("necessidades")} placeholder="Cesta básica, fraldas..." />
          <Inp label="Interesse em formação" value={form.interesseFormacao} onChange={f("interesseFormacao")} placeholder="Corte e costura, informática..." />
        </div>
      </FormSection>

      <FormSection step="8" title="Avaliação profissional">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Txta label="Parecer profissional" value={form.parecerProfissional} onChange={f("parecerProfissional")} placeholder="Avaliação do caso..." />
          <Txta label="Encaminhamentos" value={form.encaminhamentos} onChange={f("encaminhamentos")} placeholder="Para onde foi encaminhada..." />
          <Inp label="Profissional responsável" value={form.profissionalResponsavel} onChange={f("profissionalResponsavel")} placeholder="Nome de quem preencheu" />
          <Txta label="Observações" value={form.observacoes} onChange={f("observacoes")} placeholder="Informações adicionais..." />
        </div>
      </FormSection>

      <div style={{ display: "flex", gap: 12, marginTop: 18, flexWrap: "wrap" }}>
        <Btn size="lg" onClick={submit}>💾 Salvar ficha</Btn>
        <Btn variant="ghost" size="lg" onClick={() => { setView("list"); setErros({}); setForm(EF); }}>Cancelar</Btn>
      </div>
    </div>
  );

  if (view === "detail" && sel) {
    const b = sel;
    const hists = atendimentos.filter(a => a.beneficiarioId === b.id);
    const endComp = [b.endereco, b.numero, b.complemento, b.cep, b.bairro].filter(Boolean).join(", ");
    const Section = ({ title, children }) => (<><hr className="divider" /><p style={{ fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 700, color: "var(--gray-400)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>{title}</p>{children}</>);
    return (
      <div>
        <div className="back-bar">
          <Btn variant="ghost" size="sm" onClick={() => setView("list")}>← Voltar</Btn>
          <h2>Ficha do beneficiário</h2>
        </div>
        <div className="card card-accent-green" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18, flexWrap: "wrap", gap: 8 }}>
            <div>
              <h3 style={{ fontFamily: "var(--font-sans)", fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>{b.nome}</h3>
              <p style={{ fontSize: 13, color: "var(--gray-400)", marginTop: 4 }}>Cadastrado em {fDate(b.dataRegistro)}</p>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <Badge color="green">✓ Ativo</Badge>
              {b.temNIS && <Badge color="pink">🔖 NIS prioritário</Badge>}
            </div>
          </div>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 700, color: "var(--gray-400)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Identificação</p>
          <div className="detail-grid">
            {b.dataNascimento && <div><p className="detail-key">Nascimento</p><p className="detail-val">{fDate(b.dataNascimento)}</p></div>}
            {b.sexo && <div><p className="detail-key">Sexo</p><p className="detail-val">{b.sexo}</p></div>}
            {b.nomeMae && <div><p className="detail-key">Nome da mãe</p><p className="detail-val">{b.nomeMae}</p></div>}
            {b.rg && <div><p className="detail-key">RG</p><p className="detail-val">{b.rg}</p></div>}
            {b.cpf && <div><p className="detail-key">CPF</p><p className="detail-val">{b.cpf}</p></div>}
            {b.temNIS && b.nis && <div><p className="detail-key">NIS</p><p className="detail-val">{b.nis}</p></div>}
            {b.escolaridade && <div><p className="detail-key">Escolaridade</p><p className="detail-val">{b.escolaridade}</p></div>}
            {b.religiao && <div><p className="detail-key">Religião</p><p className="detail-val">{b.religiao}</p></div>}
          </div>
          {(b.telefone || endComp || b.pontoReferencia) && <Section title="Contato e endereço">
            <div className="detail-grid">
              {b.telefone && <div><p className="detail-key">Telefone</p><p className="detail-val">{b.telefone}</p></div>}
              {endComp && <div style={{ gridColumn: "1/-1" }}><p className="detail-key">Endereço</p><p className="detail-val">{endComp}</p></div>}
              {b.pontoReferencia && <div style={{ gridColumn: "1/-1" }}><p className="detail-key">Referência</p><p className="detail-val">{b.pontoReferencia}</p></div>}
            </div>
          </Section>}
          {(b.numPessoas || b.composicaoFamiliar) && <Section title="Família">
            <div className="detail-grid">
              {b.numPessoas && <div><p className="detail-key">Pessoas</p><p className="detail-val">{b.numPessoas}</p></div>}
              {b.idadesPessoas && <div><p className="detail-key">Idades</p><p className="detail-val">{b.idadesPessoas}</p></div>}
            </div>
            {b.composicaoFamiliar && <p style={{ fontSize: 14, background: "var(--gray-50)", padding: "10px 14px", borderRadius: 6, marginTop: 8 }}>{b.composicaoFamiliar}</p>}
          </Section>}
          {(b.profissao || b.renda || b.moradia) && <Section title="Trabalho e renda">
            <div className="detail-grid">
              {b.profissao && <div><p className="detail-key">Profissão</p><p className="detail-val">{b.profissao}</p></div>}
              {b.ondeTrabalha && <div><p className="detail-key">Onde trabalha</p><p className="detail-val">{b.ondeTrabalha}</p></div>}
              {b.renda && <div><p className="detail-key">Renda</p><p className="detail-val">{fCur(b.renda)}</p></div>}
              {b.pessoasDependem && <div><p className="detail-key">Dependentes</p><p className="detail-val">{b.pessoasDependem}</p></div>}
              {b.beneficio && <div><p className="detail-key">Benefício</p><p className="detail-val">{b.beneficio}</p></div>}
              {b.moradia && <div><p className="detail-key">Moradia</p><p className="detail-val">{b.moradia}</p></div>}
            </div>
          </Section>}
          {(b.demanda || b.necessidades) && <Section title="Demanda e necessidades">
            {b.demanda && <p style={{ fontSize: 14, background: "var(--gray-50)", padding: "10px 14px", borderRadius: 6, marginBottom: 8 }}>{b.demanda}</p>}
            {b.necessidades && <p style={{ fontSize: 14, background: "var(--green-50)", padding: "10px 14px", borderRadius: 6, borderLeft: "3px solid var(--green-600)" }}>{b.necessidades}</p>}
            {b.interesseFormacao && <p style={{ fontSize: 13, color: "var(--gray-600)", marginTop: 8 }}>Interesse: {b.interesseFormacao}</p>}
          </Section>}
          {(b.parecerProfissional || b.profissionalResponsavel) && <Section title="Avaliação profissional">
            {b.parecerProfissional && <p style={{ fontSize: 14, background: "var(--gray-50)", padding: "10px 14px", borderRadius: 6, marginBottom: 8 }}>{b.parecerProfissional}</p>}
            {b.encaminhamentos && <p style={{ fontSize: 13, color: "var(--gray-600)" }}>📌 {b.encaminhamentos}</p>}
            {b.profissionalResponsavel && <p style={{ fontSize: 12, color: "var(--gray-400)", marginTop: 8 }}>Por: {b.profissionalResponsavel}</p>}
          </Section>}
          {b.observacoes && <Section title="Observações"><p style={{ fontSize: 14, background: "var(--gray-50)", padding: "10px 14px", borderRadius: 6 }}>{b.observacoes}</p></Section>}
          <hr className="divider" />
          <Btn variant="danger" size="md" onClick={() => del(b.id)}>🗑 Remover cadastro</Btn>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <h3 style={{ fontFamily: "var(--font-sans)", fontSize: 17, fontWeight: 700 }}>Histórico de atendimentos</h3>
          <Badge color="purple">{hists.length}</Badge>
        </div>
        {hists.length === 0 ? <p style={{ fontSize: 14, color: "var(--gray-500)", background: "var(--gray-50)", padding: "16px 20px", borderRadius: 6, border: "1px dashed var(--gray-300)" }}>Nenhum atendimento registrado.</p>
          : hists.map(a => (
            <div key={a.id} className="card" style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14 }}>📅 {fDate(a.data)}</span>
                {a.voluntario && <Badge color="gray">👤 {a.voluntario}</Badge>}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{(a.itens || []).map((it, i) => <span key={i} className="item-tag">{it.quantidade} {it.unidade} de {it.itemNome}</span>)}</div>
            </div>
          ))}
      </div>
    );
  }

  const comNIS = beneficiarios.filter(b => b.temNIS).length;
  return (
    <div>
      <div className="section-header">
        <div><h2 className="section-title-lg">Beneficiários</h2><p className="section-sub">Ficha de Serviço Social</p></div>
        <Btn size="lg" onClick={() => setView("form")}>+ Nova ficha</Btn>
      </div>
      <div className="stats-grid">
        <StatCard label="Famílias" value={beneficiarios.length} color="green" />
        <StatCard label="Com NIS" value={comNIS} color="pink" />
        <StatCard label="Bairros" value={[...new Set(beneficiarios.map(b => b.bairro).filter(Boolean))].length} color="amber" />
        <StatCard label="Pessoas" value={beneficiarios.reduce((s, b) => s + (Number(b.numPessoas) || 0), 0)} color="blue" />
      </div>
      <div className="search-wrap">
        <input className="search-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍  Buscar por nome, CPF, NIS ou bairro..." />
      </div>
      {filtered.length === 0
        ? <Empty icon="👥" title="Nenhum beneficiário encontrado" sub={beneficiarios.length === 0 ? "Clique em '+ Nova ficha' para começar." : "Tente outro termo de busca."} />
        : filtered.map(b => (
          <div key={b.id} className="card card-hover" style={{ marginBottom: 12 }} onClick={() => { haptic(); setSel(b); setView("detail"); }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <p className="ben-name">{b.nome}</p>
                <p className="ben-meta">{[b.bairro, b.numPessoas && `${b.numPessoas} pessoas`, b.renda && fCur(b.renda)].filter(Boolean).join("  ·  ")}</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, marginLeft: 12 }}>
                {b.temNIS && <Badge color="pink">NIS</Badge>}
                <Badge color="green">Ativo</Badge>
              </div>
            </div>
            {b.necessidades && <p className="ben-needs">📋 {b.necessidades.slice(0, 100)}{b.necessidades.length > 100 ? "..." : ""}</p>}
          </div>
        ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// FAMÍLIAS
// ══════════════════════════════════════════════════════════════════
function FamiliasModule({ entidade, setEntidade, familias, setFamilias }) {
  const [tab, setTab] = useState("lista");
  const [showFamForm, setShowFamForm] = useState(false);
  const [editFam, setEditFam] = useState(null);
  const EE = { nome: "", cnpj: "", endereco: "", telefone: "", responsavel: "", cpfResp: "" };
  const EF = { chefeNome: "", chefeCPF: "", maeNome: "", endereco: "", nis: "", faixa1: "", faixa2: "", faixa3: "", faixa4: "", faixa5: "", dataRegistro: "" };
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
    haptic(true);
    await showAlert("Dados da entidade salvos com sucesso!", { title: "Salvo!", variant: "success" });
  };
  const salvarFamilia = async () => {
    const e = {};
    if (!fFam.chefeNome.trim()) e.chefeNome = "Obrigatório.";
    if (fFam.chefeCPF && !vCPF(fFam.chefeCPF)) e.chefeCPF = "CPF inválido.";
    if (fFam.nis && !vNIS(fFam.nis)) e.nis = "NIS inválido.";
    setErros(e);
    if (Object.keys(e).length > 0) {
      await showAlert("Verifique os campos com erro.", { title: "Atenção", variant: "warning" });
      return;
    }
    if (editFam) {
      const novas = familias.map(f => f.id === editFam.id ? { ...fFam, id: editFam.id, dataRegistro: f.dataRegistro || new Date().toISOString() } : f);
      await sSet("familias", novas); setFamilias(novas);
    } else {
      const novas = [...familias, { ...fFam, id: uid(), dataRegistro: fFam.dataRegistro ? new Date(fFam.dataRegistro).toISOString() : new Date().toISOString() }];
      await sSet("familias", novas); setFamilias(novas);
    }
    haptic(true);
    setFFam(EF); setEditFam(null); setShowFamForm(false); setErros({}); setTab("lista");
  };
  const removerFamilia = async id => {
    if (!await showConfirm("Remover esta família da lista?", { title: "Remover família", variant: "danger" })) return;
    await sSet("familias", familias.filter(f => f.id !== id));
    setFamilias(familias.filter(f => f.id !== id));
  };
  const editarFamilia = f => { setFFam({ ...f }); setEditFam(f); setShowFamForm(true); setTab("nova"); };

  const totalPessoas = familias.reduce((s, f) => s + ["faixa1", "faixa2", "faixa3", "faixa4", "faixa5"].reduce((a, k) => a + (Number(f[k]) || 0), 0), 0);
  const comNIS = familias.filter(f => f.nis).length;

  return (
    <div>
      <div className="section-header">
        <div><h2 className="section-title-lg">Cadastro de Família</h2><p className="section-sub">Documento consolidado de famílias atendidas</p></div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Btn variant="info" size="md" onClick={() => gerarRelatorioFamilia(fEnt, familias)}>🖨 Imprimir</Btn>
          <Btn variant="pink" size="md" onClick={() => { setEditFam(null); setFFam(EF); setShowFamForm(true); setTab("nova"); }}>+ Nova família</Btn>
        </div>
      </div>

      <InnerTabs active={tab} onChange={setTab} tabs={[["lista", "📋 Lista"], ["entidade", "🏢 Entidade"], ["nova", showFamForm ? (editFam ? "✏ Editando" : "➕ Adicionar") : "➕ Adicionar"]]} />

      {tab === "entidade" && <div className="card">
        <h3 style={{ fontFamily: "var(--font-sans)", fontSize: 17, fontWeight: 800, marginBottom: 18 }}>🏢 Dados da entidade</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="form-grid-2">
            <Inp label="Nome da entidade" required value={fEnt.nome} onChange={fEnt_h("nome")} placeholder="Grupo Partilhar" />
            <Inp label="CNPJ" value={fEnt.cnpj} onChange={fEnt_h("cnpj")} placeholder="00.000.000/0000-00" inputMode="numeric" />
          </div>
          <Inp label="Endereço da entidade" value={fEnt.endereco} onChange={fEnt_h("endereco")} placeholder="Endereço completo" />
          <div className="form-grid-2">
            <Inp label="Telefone" value={fEnt.telefone} onChange={fEnt_h("telefone")} placeholder="(81) 9 0000-0000" type="tel" inputMode="tel" />
            <Inp label="Responsável legal" value={fEnt.responsavel} onChange={fEnt_h("responsavel")} placeholder="Nome" />
          </div>
          <Inp label="CPF do responsável" value={fEnt.cpfResp} onChange={fEnt_h("cpfResp")} placeholder="000.000.000-00" inputMode="numeric" />
          <hr className="divider" />
          <Btn size="lg" onClick={salvarEntidade} style={{ alignSelf: "flex-start" }}>💾 Salvar dados</Btn>
        </div>
      </div>}

      {tab === "nova" && showFamForm && <div className="card">
        <h3 style={{ fontFamily: "var(--font-sans)", fontSize: 17, fontWeight: 800, marginBottom: 18 }}>{editFam ? "✏ Editar" : "➕ Nova"} família</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Inp label="Nome do chefe de família" required value={fFam.chefeNome} onChange={fFam_h("chefeNome")} placeholder="João da Silva" error={erros.chefeNome} />
          <div className="form-grid-2">
            <Inp label="CPF do chefe" value={fFam.chefeCPF} onChange={fFam_h("chefeCPF")} placeholder="000.000.000-00" inputMode="numeric" error={erros.chefeCPF} />
            <Inp label="NIS" value={fFam.nis} onChange={fFam_h("nis")} placeholder="000.00000.00-0" inputMode="numeric" hint="Opcional" error={erros.nis} />
          </div>
          <Inp label="Nome da mãe do chefe" value={fFam.maeNome} onChange={fFam_h("maeNome")} placeholder="Nome da mãe" />
          <Inp label="Endereço completo" value={fFam.endereco} onChange={fFam_h("endereco")} placeholder="Rua, número, bairro" />
          <div className="field">
            <label className="field-label">Data do primeiro cadastro</label>
            <input className="field-input" type="date" value={fFam.dataRegistro} onChange={e => setFFam({ ...fFam, dataRegistro: e.target.value })} />
            <span className="field-hint">Deixe em branco para usar a data de hoje. Preencha se for um cadastro antigo.</span>
          </div>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 700, color: "var(--gray-500)", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 6 }}>Pessoas por faixa etária</p>
          <div className="form-grid-4" style={{ gridTemplateColumns: "repeat(5,1fr)" }}>
            <Inp label="0-6" type="number" min="0" inputMode="numeric" value={fFam.faixa1} onChange={fFam_h("faixa1")} placeholder="0" />
            <Inp label="7-14" type="number" min="0" inputMode="numeric" value={fFam.faixa2} onChange={fFam_h("faixa2")} placeholder="0" />
            <Inp label="15-23" type="number" min="0" inputMode="numeric" value={fFam.faixa3} onChange={fFam_h("faixa3")} placeholder="0" />
            <Inp label="24-65" type="number" min="0" inputMode="numeric" value={fFam.faixa4} onChange={fFam_h("faixa4")} placeholder="0" />
            <Inp label="+65" type="number" min="0" inputMode="numeric" value={fFam.faixa5} onChange={fFam_h("faixa5")} placeholder="0" />
          </div>
          <hr className="divider" />
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Btn size="lg" onClick={salvarFamilia}>{editFam ? "💾 Atualizar" : "➕ Adicionar"}</Btn>
            <Btn variant="ghost" size="lg" onClick={() => { setFFam(EF); setEditFam(null); setShowFamForm(false); setErros({}); setTab("lista"); }}>Cancelar</Btn>
          </div>
        </div>
      </div>}

      {tab === "lista" && <>
        <div className="stats-grid stats-3">
          <StatCard label="Famílias" value={familias.length} color="green" />
          <StatCard label="Pessoas" value={totalPessoas} color="blue" />
          <StatCard label="Com NIS" value={comNIS} color="pink" />
        </div>
        {!entidade?.nome && <div className="alert alert-amber">
          <span className="alert-icon">ℹ️</span>
          <div>
            <p style={{ fontFamily: "var(--font-sans)", fontWeight: 700, color: "var(--amber-700)" }}>Dados da entidade não preenchidos</p>
            <p style={{ fontSize: 13, color: "var(--amber-700)" }}>Vá em <strong>"Entidade"</strong> e preencha antes de imprimir.</p>
          </div>
        </div>}
        {familias.length === 0
          ? <Empty icon="📋" title="Nenhuma família adicionada" sub="Clique em '+ Nova família'." />
          : <>
            <div className="fam-table-wrap">
              <table className="fam-table">
                <thead><tr>
                  <th className="num-col">Nº</th><th>Chefe / CPF</th><th>Mãe</th><th>Endereço</th><th>NIS</th>
                  <th className="age-col">0-6</th><th className="age-col">7-14</th><th className="age-col">15-23</th><th className="age-col">24-65</th><th className="age-col">+65</th><th className="action-col"></th>
                </tr></thead>
                <tbody>
                  {familias.map((f, i) => (
                    <tr key={f.id}>
                      <td className="num-col">{i + 1}</td>
                      <td><div style={{ fontWeight: 700 }}>{f.chefeNome}</div><div style={{ fontSize: 12, color: "var(--gray-500)" }}>CPF: {f.chefeCPF || "—"}</div></td>
                      <td>{f.maeNome || "—"}</td>
                      <td style={{ maxWidth: 200 }}>{f.endereco || "—"}</td>
                      <td>{f.nis ? <Badge color="pink">{f.nis}</Badge> : "—"}</td>
                      <td className="age-col">{parseInt(f.faixa1) || "—"}</td>
                      <td className="age-col">{parseInt(f.faixa2) || "—"}</td>
                      <td className="age-col">{parseInt(f.faixa3) || "—"}</td>
                      <td className="age-col">{parseInt(f.faixa4) || "—"}</td>
                      <td className="age-col">{parseInt(f.faixa5) || "—"}</td>
                      <td className="action-col"><div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                        <button className="btn btn-sm btn-info btn-icon-action" onClick={() => editarFamilia(f)}>✏</button>
                        <button className="btn btn-sm btn-danger btn-icon-action" onClick={() => removerFamilia(f.id)}>🗑</button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="fam-card-list">
              {familias.map((f, i) => (
                <div key={f.id} className="fam-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                    <span className="fam-card-num">Nº {i + 1}</span>
                    {f.nis && <Badge color="pink">🔖 NIS</Badge>}
                  </div>
                  <p className="fam-card-name">{f.chefeNome}</p>
                  {f.chefeCPF && <p className="fam-card-info">CPF: {f.chefeCPF}</p>}
                  {f.maeNome && <p className="fam-card-info">👤 Mãe: {f.maeNome}</p>}
                  {f.endereco && <p className="fam-card-info">📍 {f.endereco}</p>}
                  {f.nis && <p className="fam-card-info">🔖 NIS: {f.nis}</p>}
                  <div className="fam-card-faixas">
                    {[["0-6", f.faixa1], ["7-14", f.faixa2], ["15-23", f.faixa3], ["24-65", f.faixa4], ["+65", f.faixa5]].map(([l, v]) => (
                      <div key={l} className="fam-card-faixa"><div className="fam-card-faixa-label">{l}</div><div className="fam-card-faixa-val">{v || "—"}</div></div>
                    ))}
                  </div>
                  <div className="fam-card-actions">
                    <button className="btn btn-md btn-info" onClick={() => editarFamilia(f)}>✏ Editar</button>
                    <button className="btn btn-md btn-danger" onClick={() => removerFamilia(f.id)}>🗑 Remover</button>
                  </div>
                </div>
              ))}
            </div>
          </>}
      </>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// DOAÇÕES
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
    if (!fEnt.itemNome.trim() || !fEnt.quantidade) { await showAlert("Preencha nome e quantidade.", { variant: "warning", title: "Atenção" }); return; }
    const qtd = Number(fEnt.quantidade);
    const idx = estoque.findIndex(i => i.nome.toLowerCase() === fEnt.itemNome.toLowerCase() && i.categoria === fEnt.categoria);
    const ne = [...estoque];
    if (idx >= 0) ne[idx] = { ...ne[idx], quantidade: ne[idx].quantidade + qtd };
    else ne.push({ id: uid(), nome: fEnt.itemNome, categoria: fEnt.categoria, quantidade: qtd, unidade: fEnt.unidade });
    await saveE(ne);
    await saveM([{ id: uid(), tipo: "entrada", itemNome: fEnt.itemNome, categoria: fEnt.categoria, quantidade: qtd, unidade: fEnt.unidade, doador: fEnt.doador, observacao: fEnt.observacao, data: new Date().toISOString() }, ...movs]);
    setFEnt(EE); haptic(true); await showAlert("Doação registrada!", { variant: "success", title: "Sucesso" });
  };
  const regSaida = async () => {
    if (!fSai.itemId || !fSai.quantidade) { await showAlert("Selecione o item e a quantidade.", { variant: "warning", title: "Atenção" }); return; }
    const item = estoque.find(i => i.id === fSai.itemId);
    const qtd = Number(fSai.quantidade);
    if (qtd > item.quantidade) { await showAlert(`Estoque insuficiente! Disponível: ${item.quantidade} ${item.unidade}.`, { variant: "warning", title: "Estoque insuficiente" }); return; }
    await saveE(estoque.map(i => i.id === item.id ? { ...i, quantidade: i.quantidade - qtd } : i));
    await saveM([{ id: uid(), tipo: "saida", itemNome: item.nome, categoria: item.categoria, quantidade: qtd, unidade: item.unidade, beneficiario: fSai.beneficiario, observacao: fSai.observacao, data: new Date().toISOString() }, ...movs]);
    setFSai(ES); haptic(true); await showAlert("Saída registrada!", { variant: "success", title: "Sucesso" });
  };
  const addMeta = async () => {
    if (!fMeta.itemNome.trim() || !fMeta.meta) { await showAlert("Preencha item e meta.", { variant: "warning" }); return; }
    const idx = metas.findIndex(m => m.itemNome.toLowerCase() === fMeta.itemNome.toLowerCase() && m.mesAno === fMeta.mesAno);
    const nm = [...metas];
    if (idx >= 0) nm[idx] = { ...nm[idx], meta: Number(fMeta.meta), unidade: fMeta.unidade, categoria: fMeta.categoria };
    else nm.push({ id: uid(), ...fMeta, meta: Number(fMeta.meta) });
    await saveMt(nm); setFMeta(EM); haptic(true); await showAlert("Meta salva!", { variant: "success" });
  };
  const delMeta = async id => { if (!await showConfirm("Remover meta?", { variant: "danger" })) return; await saveMt(metas.filter(m => m.id !== id)); };

  const baixo = estoque.filter(i => i.quantidade <= 5);
  const mes = nowYM();
  const metasMes = metas.filter(m => m.mesAno === mes);

  return (
    <div>
      <div className="section-header">
        <div><h2 className="section-title-lg">Doações & Estoque</h2><p className="section-sub">Controle de entradas, saídas e metas</p></div>
      </div>
      <InnerTabs active={tab} onChange={setTab} tabs={[["estoque", "📦 Estoque"], ["entrada", "⬇ Entrada"], ["saida", "⬆ Saída"], ["metas", "🎯 Metas"], ["historico", "📋 Histórico"]]} />

      {tab === "estoque" && <>
        <div className="stats-grid stats-3">
          <StatCard label="Tipos" value={estoque.length} color="green" />
          <StatCard label="Unidades" value={estoque.reduce((s, i) => s + i.quantidade, 0)} color="blue" />
          <StatCard label="Baixo estoque" value={baixo.length} color={baixo.length > 0 ? "red" : "green"} />
        </div>
        {baixo.length > 0 && <div className="alert alert-red"><span className="alert-icon">⚠️</span><div>
          <p style={{ fontFamily: "var(--font-sans)", fontWeight: 700, color: "var(--red-700)" }}>Estoque baixo</p>
          <p style={{ fontSize: 13, color: "var(--red-700)" }}>{baixo.map(i => i.nome).join(", ")}</p>
        </div></div>}
        {estoque.length === 0 ? <Empty icon="📦" title="Estoque vazio" sub="Registre uma entrada para começar." />
          : CATEGORIAS.filter(c => estoque.some(i => i.categoria === c)).map(cat => (
            <div key={cat} style={{ marginBottom: 24 }}>
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
                      <p style={{ fontFamily: "var(--font-sans)", fontSize: 30, fontWeight: 800, color: item.quantidade <= 5 ? "var(--red-700)" : "var(--green-700)", lineHeight: 1 }}>{item.quantidade}</p>
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
        <h3 style={{ fontFamily: "var(--font-sans)", fontSize: 17, fontWeight: 800, marginBottom: 18 }}>Registrar doação</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="form-grid-2">
            <Inp label="Nome do item" required value={fEnt.itemNome} onChange={e => setFEnt({ ...fEnt, itemNome: e.target.value })} placeholder="Cesta básica" />
            <Sel label="Categoria" value={fEnt.categoria} onChange={e => setFEnt({ ...fEnt, categoria: e.target.value })}>{CATEGORIAS.map(c => <option key={c}>{c}</option>)}</Sel>
          </div>
          <div className="form-grid-2">
            <Inp label="Quantidade" required type="number" min="1" inputMode="numeric" value={fEnt.quantidade} onChange={e => setFEnt({ ...fEnt, quantidade: e.target.value })} placeholder="10" />
            <Inp label="Unidade" value={fEnt.unidade} onChange={e => setFEnt({ ...fEnt, unidade: e.target.value })} placeholder="unidade, kg..." />
          </div>
          <Inp label="Nome do doador" value={fEnt.doador} onChange={e => setFEnt({ ...fEnt, doador: e.target.value })} placeholder="Nome ou empresa (opcional)" />
          <Txta label="Observações" value={fEnt.observacao} onChange={e => setFEnt({ ...fEnt, observacao: e.target.value })} placeholder="Validade, condições..." />
          <hr className="divider" />
          <Btn size="lg" onClick={regEntrada} style={{ alignSelf: "flex-start" }}>⬇ Confirmar entrada</Btn>
        </div>
      </div>}

      {tab === "saida" && <div className="card">
        <h3 style={{ fontFamily: "var(--font-sans)", fontSize: 17, fontWeight: 800, marginBottom: 18 }}>Registrar distribuição</h3>
        {estoque.filter(i => i.quantidade > 0).length === 0 ? <Empty icon="📦" title="Estoque vazio" sub="Registre uma entrada antes." />
          : <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Sel label="Item" required value={fSai.itemId} onChange={e => setFSai({ ...fSai, itemId: e.target.value })}>
              <option value="">Selecione...</option>
              {estoque.filter(i => i.quantidade > 0).map(i => <option key={i.id} value={i.id}>{i.nome} — {i.quantidade} {i.unidade}</option>)}
            </Sel>
            <div className="form-grid-2">
              <Inp label="Quantidade" required type="number" min="1" inputMode="numeric" value={fSai.quantidade} onChange={e => setFSai({ ...fSai, quantidade: e.target.value })} />
              <Inp label="Beneficiário" value={fSai.beneficiario} onChange={e => setFSai({ ...fSai, beneficiario: e.target.value })} placeholder="Nome da família" />
            </div>
            <Txta label="Observações" value={fSai.observacao} onChange={e => setFSai({ ...fSai, observacao: e.target.value })} />
            <hr className="divider" />
            <Btn variant="accent" size="lg" onClick={regSaida} style={{ alignSelf: "flex-start" }}>⬆ Confirmar saída</Btn>
          </div>}
      </div>}

      {tab === "metas" && <>
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ fontFamily: "var(--font-sans)", fontSize: 17, fontWeight: 800, marginBottom: 18 }}>🎯 Definir meta</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="form-grid-2">
              <Inp label="Item" required value={fMeta.itemNome} onChange={e => setFMeta({ ...fMeta, itemNome: e.target.value })} placeholder="Cesta básica" />
              <Sel label="Categoria" value={fMeta.categoria} onChange={e => setFMeta({ ...fMeta, categoria: e.target.value })}>{CATEGORIAS.map(c => <option key={c}>{c}</option>)}</Sel>
            </div>
            <div className="form-grid-2">
              <Inp label="Quantidade meta" required type="number" min="1" inputMode="numeric" value={fMeta.meta} onChange={e => setFMeta({ ...fMeta, meta: e.target.value })} placeholder="100" />
              <Inp label="Unidade" value={fMeta.unidade} onChange={e => setFMeta({ ...fMeta, unidade: e.target.value })} />
            </div>
            <Sel label="Mês" value={fMeta.mesAno} onChange={e => setFMeta({ ...fMeta, mesAno: e.target.value })}>
              {Array.from({ length: 12 }, (_, i) => { const d = new Date(); d.setMonth(d.getMonth() + i - 2); const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; return <option key={ym} value={ym}>{ymLabel(ym)}</option>; })}
            </Sel>
            <hr className="divider" />
            <Btn variant="purple" size="lg" onClick={addMeta} style={{ alignSelf: "flex-start" }}>🎯 Salvar meta</Btn>
          </div>
        </div>
        {metas.length === 0 ? <Empty icon="🎯" title="Nenhuma meta" sub="Defina metas mensais acima." />
          : [...new Set(metas.map(m => m.mesAno))].sort().reverse().map(ym => (
            <div key={ym} style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <h3 style={{ fontFamily: "var(--font-sans)", fontSize: 15, fontWeight: 700 }}>{ymLabel(ym)}</h3>
                {ym === mes && <Badge color="green">mês atual</Badge>}
              </div>
              {metas.filter(m => m.mesAno === ym).map(m => {
                const atual = estoque.find(i => i.nome.toLowerCase() === m.itemNome.toLowerCase())?.quantidade || 0;
                const pct = Math.min(100, Math.round((atual / m.meta) * 100));
                return <div key={m.id} className="card" style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div><p style={{ fontFamily: "var(--font-sans)", fontWeight: 700 }}>{m.itemNome}</p><Badge color="gray">{m.categoria}</Badge></div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontFamily: "var(--font-sans)", fontSize: 26, fontWeight: 800, color: pct >= 100 ? "var(--green-700)" : pct >= 60 ? "var(--amber-700)" : "var(--red-700)" }}>{pct}%</p>
                      <p style={{ fontSize: 12, color: "var(--gray-400)" }}>{atual}/{m.meta} {m.unidade}</p>
                    </div>
                  </div>
                  <Progress value={atual} max={m.meta} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                    {pct < 100 ? <p style={{ fontSize: 12, color: "var(--amber-700)", fontWeight: 600 }}>Faltam {m.meta - atual} {m.unidade}</p>
                      : <p style={{ fontSize: 12, color: "var(--green-700)", fontWeight: 700 }}>✅ Meta atingida!</p>}
                    <button className="btn btn-sm btn-danger" onClick={() => delMeta(m.id)}>🗑 Remover</button>
                  </div>
                </div>;
              })}
            </div>
          ))}
      </>}

      {tab === "historico" && <>
        <div className="stats-grid stats-3" style={{ marginBottom: 18 }}>
          <StatCard label="Entradas" value={movs.filter(m => m.tipo === "entrada").reduce((s, m) => s + m.quantidade, 0)} color="green" />
          <StatCard label="Saídas" value={movs.filter(m => m.tipo === "saida").reduce((s, m) => s + m.quantidade, 0)} color="amber" />
          <StatCard label="Registros" value={movs.length} color="blue" />
        </div>
        {movs.length === 0 ? <Empty icon="📋" title="Nenhuma movimentação" sub="O histórico aparecerá aqui." />
          : movs.slice(0, 60).map(m => (
            <div key={m.id} className="card" style={{ marginBottom: 10, display: "flex", alignItems: "flex-start", gap: 14 }}>
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
    if (!benSel) { await showAlert("Selecione um beneficiário.", { variant: "warning", title: "Atenção" }); return; }
    const valid = itens.filter(it => it.itemId && it.quantidade);
    if (valid.length === 0) { await showAlert("Adicione pelo menos um item.", { variant: "warning" }); return; }
    for (const it of valid) { const e = estoque.find(e => e.id === it.itemId); if (Number(it.quantidade) > e.quantidade) { await showAlert(`Estoque insuficiente para ${e.nome}!`, { variant: "warning" }); return; } }
    const itFmt = valid.map(it => { const e = estoque.find(e => e.id === it.itemId); return { itemId: it.itemId, itemNome: e.nome, quantidade: Number(it.quantidade), unidade: e.unidade }; });
    const novoEst = estoque.map(e => { const it = valid.find(i => i.itemId === e.id); return it ? { ...e, quantidade: e.quantidade - Number(it.quantidade) } : e; });
    const novasMov = valid.map(it => { const e = estoque.find(e => e.id === it.itemId); return { id: uid(), tipo: "saida", itemNome: e.nome, categoria: e.categoria, quantidade: Number(it.quantidade), unidade: e.unidade, beneficiario: benSel.nome, data: new Date().toISOString() }; });
    const novoAt = [{ id: uid(), beneficiarioId: benSel.id, beneficiarioNome: benSel.nome, itens: itFmt, voluntario, observacoes: obs, data: new Date().toISOString() }, ...atendimentos];
    await sSet("atendimentos", novoAt); setAtendimentos(novoAt);
    await sSet("estoque", novoEst); setEstoque(novoEst);
    await sSet("movimentacoes", [...novasMov, ...movs]); setMovs([...novasMov, ...movs]);
    setBenSel(null); setItens([{ itemId: "", quantidade: "" }]); setVoluntario(""); setObs("");
    haptic(true);
    await showAlert("Atendimento registrado!", { variant: "success", title: "Sucesso" });
    setView("list");
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
      <FormSection step="1" title="Beneficiário">
        {benSel ? <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--green-50)", padding: "12px 16px", borderRadius: 6, border: "1.5px solid var(--green-100)", flexWrap: "wrap", gap: 8 }}>
          <div><p style={{ fontFamily: "var(--font-sans)", fontWeight: 700 }}>{benSel.nome}</p><p style={{ fontSize: 13, color: "var(--gray-500)" }}>📍 {benSel.bairro}</p></div>
          <Btn variant="ghost" size="sm" onClick={() => setBenSel(null)}>Trocar</Btn>
        </div> : <>
          <input className="field-input" value={busca} onChange={e => setBusca(e.target.value)} placeholder="🔍 Digite o nome..." style={{ marginBottom: 8 }} />
          {busca && <div className="autocomplete-list">
            {benFiltrados.slice(0, 5).map(b => <div key={b.id} className="autocomplete-item" onClick={() => { haptic(); setBenSel(b); setBusca(""); }}>
              <p style={{ fontFamily: "var(--font-sans)", fontWeight: 700 }}>{b.nome}</p>
              <p style={{ fontSize: 12, color: "var(--gray-400)" }}>📍 {b.bairro}</p>
            </div>)}
            {benFiltrados.length === 0 && <p style={{ padding: "14px 18px", color: "var(--gray-400)" }}>Nenhum resultado.</p>}
          </div>}
        </>}
      </FormSection>
      <FormSection step="2" title="Itens distribuídos">
        {itens.map((it, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 90px 42px", gap: 10, marginBottom: 10, alignItems: "end" }}>
            <Sel label={i === 0 ? "Item" : undefined} value={it.itemId} onChange={e => updItem(i, "itemId", e.target.value)}>
              <option value="">Selecione...</option>
              {estoque.filter(e => e.quantidade > 0).map(e => <option key={e.id} value={e.id}>{e.nome} — {e.quantidade}</option>)}
            </Sel>
            <Inp label={i === 0 ? "Qtd" : undefined} type="number" min="1" inputMode="numeric" value={it.quantidade} onChange={e => updItem(i, "quantidade", e.target.value)} placeholder="1" />
            {itens.length > 1 && <button className="btn btn-md btn-danger btn-icon-action" onClick={() => setItens(itens.filter((_, idx) => idx !== i))}>✕</button>}
          </div>
        ))}
        <Btn variant="ghost-green" size="sm" onClick={() => setItens([...itens, { itemId: "", quantidade: "" }])}>+ Adicionar item</Btn>
      </FormSection>
      <FormSection step="3" title="Informações">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Inp label="Voluntário responsável" value={voluntario} onChange={e => setVoluntario(e.target.value)} placeholder="Nome (opcional)" />
          <Txta label="Observações" value={obs} onChange={e => setObs(e.target.value)} />
        </div>
      </FormSection>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Btn variant="purple" size="lg" onClick={registrar}>📝 Registrar</Btn>
        <Btn variant="ghost" size="lg" onClick={() => setView("list")}>Cancelar</Btn>
      </div>
    </div>
  );

  return (
    <div>
      <div className="section-header">
        <div><h2 className="section-title-lg">Atendimentos</h2><p className="section-sub">Registro de cada atendimento</p></div>
        <Btn variant="purple" size="lg" onClick={() => setView("form")}>+ Novo</Btn>
      </div>
      <div className="stats-grid" style={{ gridTemplateColumns: "1fr 1fr", marginBottom: 18 }}>
        <StatCard label="Total" value={atendimentos.length} color="purple" />
        <StatCard label="Este mês" value={atendimentos.filter(a => a.data?.startsWith(nowYM())).length} color="green" />
      </div>
      {mesesDisp.length > 0 && <div className="filter-row">
        {["todos", ...mesesDisp].map(m => <button key={m} className={`filter-pill${filtroMes === m ? " active" : ""}`} onClick={() => { haptic(); setFiltroMes(m); }}>{m === "todos" ? "Todos" : ymLabel(m)}</button>)}
      </div>}
      {atFilt.length === 0 ? <Empty icon="📝" title="Nenhum atendimento" sub="Clique em '+ Novo'." />
        : atFilt.map(a => (
          <div key={a.id} className="card card-accent-purple" style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, gap: 8 }}>
              <div>
                <p style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 15 }}>{a.beneficiarioNome}</p>
                <p style={{ fontSize: 12, color: "var(--gray-400)" }}>📅 {fDate(a.data)}{a.voluntario && ` · 👤 ${a.voluntario}`}</p>
              </div>
              <Badge color="purple">{(a.itens || []).length} {(a.itens || []).length === 1 ? "item" : "itens"}</Badge>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
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
      <div className="section-header"><div><h2 className="section-title-lg">Relatórios</h2><p className="section-sub">Resumo geral e exportação</p></div></div>
      <div className="summary-banner">
        <p style={{ fontSize: 12, fontWeight: 700, opacity: 0.65, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Painel de impacto</p>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em" }}>🦋 Sistema Partilhar</p>
        <div className="summary-stats">
          {[[beneficiarios.length, "Famílias"], [totalPessoas, "Pessoas"], [totalDist, "Distribuídos"], [doadores, "Doadores"]].map(([v, l]) => (
            <div key={l} className="summary-stat"><div className="summary-stat-val">{v}</div><div className="summary-stat-label">{l}</div></div>
          ))}
        </div>
      </div>
      <h3 style={{ fontFamily: "var(--font-sans)", fontSize: 16, fontWeight: 700, marginBottom: 12 }}>📄 Exportar relatórios</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
        {[["beneficiarios", "👥", "Lista de beneficiários", `${beneficiarios.length} famílias`],
        ["atendimentos", "📝", "Registro de atendimentos", `${atendimentos.length} atendimentos`],
        ["estoque", "📦", "Histórico de doações", `${movs.length} movimentações`]].map(([tipo, icon, titulo, desc]) => (
          <div key={tipo} className="rel-export-card">
            <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1 }}>
              <span className="rel-export-icon">{icon}</span>
              <div><p className="rel-export-title">{titulo}</p><p className="rel-export-desc">{desc}</p></div>
            </div>
            <Btn variant="info" size="md" onClick={() => gerarRelatorio(tipo, dados)}>🖨 PDF</Btn>
          </div>
        ))}
      </div>
      <h3 style={{ fontFamily: "var(--font-sans)", fontSize: 16, fontWeight: 700, marginBottom: 12 }}>📊 {ymLabel(mes)}</h3>
      <div className="stats-grid" style={{ marginBottom: 28 }}>
        <StatCard label="Atendimentos" value={atendimentos.filter(a => a.data?.startsWith(mes)).length} color="purple" />
        <StatCard label="Recebidos" value={movs.filter(m => m.tipo === "entrada" && m.data?.startsWith(mes)).reduce((s, m) => s + m.quantidade, 0)} color="green" />
        <StatCard label="Distribuídos" value={movs.filter(m => m.tipo === "saida" && m.data?.startsWith(mes)).reduce((s, m) => s + m.quantidade, 0)} color="amber" />
        <StatCard label="Doadores" value={[...new Set(movs.filter(m => m.tipo === "entrada" && m.doador && m.data?.startsWith(mes)).map(m => m.doador))].length} color="blue" />
      </div>
      <h3 style={{ fontFamily: "var(--font-sans)", fontSize: 16, fontWeight: 700, marginBottom: 14 }}>🏘 Por bairro</h3>
      {beneficiarios.length === 0 ? <Empty icon="🗺" title="Nenhum dado" sub="Os dados aparecerão conforme cadastrar." />
        : [...new Set(beneficiarios.map(b => b.bairro).filter(Boolean))].sort().map(bairro => {
          const count = beneficiarios.filter(b => b.bairro === bairro).length;
          const pct = Math.round((count / beneficiarios.length) * 100);
          return <div key={bairro} style={{ marginBottom: 12 }}>
            <div className="bairro-row"><span className="bairro-name">{bairro}</span><span className="bairro-count">{count} · {pct}%</span></div>
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
  const [headerHidden, setHeaderHidden] = useState(false);
  const lastScroll = useRef(0);

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

  useEffect(() => {
    const onScroll = () => {
      const cur = window.scrollY;
      if (window.innerWidth > 720) { setHeaderHidden(false); lastScroll.current = cur; return; }
      if (cur > lastScroll.current && cur > 100) setHeaderHidden(true);
      else if (cur < lastScroll.current) setHeaderHidden(false);
      lastScroll.current = cur;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const goTo = id => { haptic(); setMod(id); window.scrollTo({ top: 0, behavior: "smooth" }); };

  return (
    <>
      <header className={`app-header${headerHidden ? " hidden" : ""}`}>
        <div className="header-stripe" />
        <div className="header-inner">
          <PartilharLogo />
          <div className="header-badges">
            <div className="header-badge"><div className="header-badge-val">{beneficiarios.length}</div><div className="header-badge-label">famílias</div></div>
            <div className="header-badge"><div className="header-badge-val">{atendimentos.length}</div><div className="header-badge-label">atend.</div></div>
          </div>
        </div>
      </header>

      <nav className="desktop-nav">
        <div className="desktop-nav-inner">
          {NAV.map(n => <button key={n.id} className={`nav-tab${mod === n.id ? " active" : ""}`} onClick={() => goTo(n.id)}><span>{n.icon}</span> {n.label}</button>)}
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
          {NAV.map(n => <button key={n.id} className={`mobile-nav-btn${mod === n.id ? " active" : ""}`} onClick={() => goTo(n.id)}><span className="m-icon">{n.icon}</span><span>{n.label}</span></button>)}
        </div>
      </nav>

      <ModalRoot />
    </>
  );
}
