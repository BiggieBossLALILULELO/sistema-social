path = '/home/biggieboss/sistema-social/src/App.jsx'
with open(path, 'r') as f:
    code = f.read()

changes = 0

# Corrige as células de faixa no PDF para aceitar só números
fixes = [
    ('${f.faixa1 || ""}', '${parseInt(f.faixa1) || ""}'),
    ('${f.faixa2 || ""}', '${parseInt(f.faixa2) || ""}'),
    ('${f.faixa3 || ""}', '${parseInt(f.faixa3) || ""}'),
    ('${f.faixa4 || ""}', '${parseInt(f.faixa4) || ""}'),
    ('${f.faixa5 || ""}', '${parseInt(f.faixa5) || ""}'),
]

for old, new in fixes:
    if old in code:
        code = code.replace(old, new)
        changes += 1

print(f"✅ {changes} células de faixa corrigidas no PDF")

# Também corrige os cards e tabela mobile das famílias
fixes2 = [
    ('{f.faixa1 || ""}', '{parseInt(f.faixa1) || "—"}'),
    ('{f.faixa2 || ""}', '{parseInt(f.faixa2) || "—"}'),
    ('{f.faixa3 || ""}', '{parseInt(f.faixa3) || "—"}'),
    ('{f.faixa4 || ""}', '{parseInt(f.faixa4) || "—"}'),
    ('{f.faixa5 || ""}', '{parseInt(f.faixa5) || "—"}'),
]

for old, new in fixes2:
    count = code.count(old)
    if count > 0:
        code = code.replace(old, new)
        changes += count

print(f"✅ Total de {changes} correções aplicadas")

with open(path, 'w') as f:
    f.write(code)

print("🎉 Pronto! Agora as colunas de faixa etária mostram apenas números.")
