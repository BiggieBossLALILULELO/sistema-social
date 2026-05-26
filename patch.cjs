const fs = require('fs');
const path = require('path');

const filePath = path.join(process.env.HOME, 'sistema-social/src/App.jsx');
let code = fs.readFileSync(filePath, 'utf8');

// ── Fix 1: Máscara NIS correta (123.45678.90-1) ──────────────────
const nisOld = `function mNIS(v) { return v.replace(/\\D/g, "").slice(0, 11).replace(/(\\d{3})(\\d)/, "$1.$2").replace(/(\\d{5})(\\d)/, "$1.$2").replace(/(\\d{2})(\\d)/, "$1-$2"); }`;
const nisNew = `function mNIS(v) {
  const n = v.replace(/\\D/g, "").slice(0, 11);
  if (n.length <= 3) return n;
  if (n.length <= 8) return n.slice(0,3) + "." + n.slice(3);
  if (n.length <= 10) return n.slice(0,3) + "." + n.slice(3,8) + "." + n.slice(8);
  return n.slice(0,3) + "." + n.slice(3,8) + "." + n.slice(8,10) + "-" + n.slice(10);
}`;

if (code.includes(nisOld)) {
  code = code.replace(nisOld, nisNew);
  console.log("✅ Fix 1: Máscara NIS corrigida");
} else {
  console.log("⚠️  Fix 1: Padrão NIS não encontrado — verifique manualmente");
}

// ── Fix 2: Stats grid 3 colunas no mobile (remover inline override) ──
// Substitui `style={{ gridTemplateColumns: "repeat(3,1fr)", marginBottom: 18 }}`
// por uma classe CSS responsiva
const grid3Old1 = `<div className="stats-grid" style={{ gridTemplateColumns: "repeat(3,1fr)", marginBottom: 20 }}>`;
const grid3New1 = `<div className="stats-grid stats-3" style={{ marginBottom: 20 }}>`;

const grid3Old2 = `<div className="stats-grid" style={{ gridTemplateColumns: "repeat(3,1fr)", marginBottom: 16 }}>`;
const grid3New2 = `<div className="stats-grid stats-3" style={{ marginBottom: 16 }}>`;

const grid3Old3 = `<div className="stats-grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>`;
const grid3New3 = `<div className="stats-grid stats-3">`;

const grid3Old4 = `<div className="stats-grid" style={{ gridTemplateColumns: "repeat(3,1fr)", marginBottom: 18 }}>`;
const grid3New4 = `<div className="stats-grid stats-3" style={{ marginBottom: 18 }}>`;

let count = 0;
[
  [grid3Old1, grid3New1], [grid3Old2, grid3New2],
  [grid3Old3, grid3New3], [grid3Old4, grid3New4],
].forEach(([old, nw]) => {
  while (code.includes(old)) { code = code.replace(old, nw); count++; }
});
console.log(`✅ Fix 2: ${count} grade(s) de 3 colunas corrigida(s) para mobile`);

// ── Fix 3: Adiciona CSS .stats-3 após .stats-grid no CSS string ──
const cssOld = `.stat-card.pink .stat-value { color: #DB2777; }`;
const cssNew = `.stat-card.pink .stat-value { color: #DB2777; }
.stats-3 { grid-template-columns: repeat(3,1fr); }
@media (max-width: 720px) { .stats-3 { grid-template-columns: 1fr 1fr; } }`;

if (code.includes(cssOld) && !code.includes('.stats-3')) {
  code = code.replace(cssOld, cssNew);
  console.log("✅ Fix 3: CSS .stats-3 responsivo adicionado");
} else if (code.includes('.stats-3')) {
  console.log("ℹ️  Fix 3: .stats-3 já existe");
} else {
  console.log("⚠️  Fix 3: Padrão CSS não encontrado");
}

fs.writeFileSync(filePath, code);
console.log("\n🎉 Patch aplicado! Rode: cd ~/sistema-social && npm run dev");
