path = '/home/biggieboss/sistema-social/src/App.jsx'
with open(path, 'r') as f:
    code = f.read()

changes = 0

# ── Fix 1: Faixas etárias no PDF — só aceita números inteiros puros ──
# Substitui todas as variações do faixa no template PDF
import re

# Padrão atual com parseInt
for i in range(1, 6):
    old = '${parseInt(f.faixa' + str(i) + ') || ""}'
    new = '${/^\\d+$/.test(String(f.faixa' + str(i) + ' || "").trim()) ? f.faixa' + str(i) + ' : ""}'
    if old in code:
        code = code.replace(old, new)
        changes += 1

# Padrão sem parseInt (caso o patch anterior não tenha aplicado)
for i in range(1, 6):
    old = '${f.faixa' + str(i) + ' || ""}'
    new = '${/^\\d+$/.test(String(f.faixa' + str(i) + ' || "").trim()) ? f.faixa' + str(i) + ' : ""}'
    if old in code:
        code = code.replace(old, new)
        changes += 1

print(f"✅ Fix 1: {changes} células de faixa corrigidas (só números puros)")

# ── Fix 2: Logo — aumentar texto GRUPO e ILUMINANDO CAMINHOS ──
old_grupo = 'fontSize="11" fill="rgba(255,255,255,0.7)" fontWeight="600" letterSpacing="1.5">GRUPO</text>'
new_grupo = 'fontSize="14" fill="rgba(255,255,255,0.85)" fontWeight="700" letterSpacing="1.5">GRUPO</text>'

old_ilumina = 'fontSize="9" fill="rgba(255,255,255,0.6)" letterSpacing="2.5" fontWeight="500">ILUMINANDO CAMINHOS</text>'
new_ilumina = 'fontSize="11.5" fill="rgba(255,255,255,0.75)" letterSpacing="2" fontWeight="600">ILUMINANDO CAMINHOS</text>'

if old_grupo in code:
    code = code.replace(old_grupo, new_grupo)
    changes += 1
    print("✅ Fix 2a: Texto GRUPO maior")
else:
    print("⚠️  Fix 2a: GRUPO não encontrado")

if old_ilumina in code:
    code = code.replace(old_ilumina, new_ilumina)
    changes += 1
    print("✅ Fix 2b: Texto ILUMINANDO CAMINHOS maior")
else:
    print("⚠️  Fix 2b: ILUMINANDO CAMINHOS não encontrado")

with open(path, 'w') as f:
    f.write(code)

print(f"\n🎉 {changes} correções aplicadas!")
