import re

path = '/home/biggieboss/sistema-social/src/App.jsx'
with open(path, 'r') as f:
    code = f.read()

changes = 0

# ── 1. Mostrar "Data do primeiro cadastro" no formulário de beneficiário ──
# Adiciona após o campo de Nome completo (no FormSection step 1)
old1 = '''          <Inp label="Nome completo" required value={form.nome} onChange={f("nome")} placeholder="Ex: Maria da Silva" autoComplete="name" error={erros.nome} />
          <div className="form-grid-3">'''

new1 = '''          <Inp label="Nome completo" required value={form.nome} onChange={f("nome")} placeholder="Ex: Maria da Silva" autoComplete="name" error={erros.nome} />
          <div style={{ background: "var(--green-50)", border: "1.5px solid var(--green-100)", borderRadius: "var(--radius-xs)", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 700, color: "var(--green-700)", textTransform: "uppercase", letterSpacing: "0.06em" }}>📅 Data do primeiro cadastro</span>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 15, fontWeight: 700, color: "var(--green-800)" }}>{new Date().toLocaleDateString("pt-BR")}</span>
          </div>
          <div className="form-grid-3">'''

if old1 in code:
    code = code.replace(old1, new1)
    changes += 1
    print("✅ Fix 1: Campo de data adicionado ao formulário de beneficiário")
else:
    print("⚠️  Fix 1: Padrão não encontrado — pulando")

# ── 2. Adicionar dataRegistro ao salvar família ──
old2 = "const novas = [...familias, { ...fFam, id: uid() }];"
new2 = "const novas = [...familias, { ...fFam, id: uid(), dataRegistro: new Date().toISOString() }];"

if old2 in code:
    code = code.replace(old2, new2)
    changes += 1
    print("✅ Fix 2: dataRegistro adicionado ao cadastro de família")
else:
    print("⚠️  Fix 2: Padrão família não encontrado — pulando")

# ── 3. Adicionar data na coluna do relatório PDF de beneficiários ──
old3 = '''        <tr><th style="${th}">Nome</th><th style="${th}">CPF</th><th style="${th}">NIS</th><th style="${th}">Bairro</th><th style="${th}">Pessoas</th><th style="${th}">Renda</th></tr>
        ${beneficiarios.map((b, i) => `<tr style="background:${i % 2 ? "#F9FAFB" : "#fff"}"><td style="${td}">${b.nome}</td><td style="${td}">${b.cpf || "—"}</td><td style="${td}">${b.temNIS && b.nis ? b.nis : "—"}</td><td style="${td}">${b.bairro || "—"}</td><td style="${td}">${b.numPessoas || "—"}</td><td style="${td}">${b.renda ? fCur(b.renda) : "—"}</td></tr>`).join("")}'''

new3 = '''        <tr><th style="${th}">Nome</th><th style="${th}">CPF</th><th style="${th}">NIS</th><th style="${th}">Bairro</th><th style="${th}">Pessoas</th><th style="${th}">Renda</th><th style="${th}">Primeiro cadastro</th></tr>
        ${beneficiarios.map((b, i) => `<tr style="background:${i % 2 ? "#F9FAFB" : "#fff"}"><td style="${td}">${b.nome}</td><td style="${td}">${b.cpf || "—"}</td><td style="${td}">${b.temNIS && b.nis ? b.nis : "—"}</td><td style="${td}">${b.bairro || "—"}</td><td style="${td}">${b.numPessoas || "—"}</td><td style="${td}">${b.renda ? fCur(b.renda) : "—"}</td><td style="${td}">${b.dataRegistro ? new Date(b.dataRegistro).toLocaleDateString("pt-BR") : "—"}</td></tr>`).join("")}'''

if old3 in code:
    code = code.replace(old3, new3)
    changes += 1
    print("✅ Fix 3: Data adicionada ao relatório PDF de beneficiários")
else:
    print("⚠️  Fix 3: Padrão PDF beneficiários não encontrado — pulando")

# ── 4. Adicionar data na coluna do relatório PDF de famílias ──
old4 = '''<tr><th style="${th}">Nº</th><th style="${th}">Chefe / CPF</th><th style="${th}">Mãe do chefe</th><th style="${th}">Endereço</th><th style="${th}">NIS</th><th style="${th}">0-6</th><th style="${th}">7-14</th><th style="${th}">15-23</th><th style="${th}">24-65</th><th style="${th}">+65</th></tr>'''
new4 = '''<tr><th style="${th}">Nº</th><th style="${th}">Chefe / CPF</th><th style="${th}">Mãe do chefe</th><th style="${th}">Endereço</th><th style="${th}">NIS</th><th style="${th}">Cadastro</th><th style="${th}">0-6</th><th style="${th}">7-14</th><th style="${th}">15-23</th><th style="${th}">24-65</th><th style="${th}">+65</th></tr>'''

if old4 in code:
    code = code.replace(old4, new4)
    changes += 1
    print("✅ Fix 4: Coluna de data adicionada ao cabeçalho do relatório de famílias")
else:
    print("⚠️  Fix 4: Cabeçalho famílias não encontrado — pulando")

# ── 5. Adicionar célula de data nas linhas do relatório de famílias ──
old5 = '''<td style="${td};text-align:center">${f.faixa1 || ""}</td><td style="${td};text-align:center">${f.faixa2 || ""}</td>'''
new5 = '''<td style="${td}">${f.dataRegistro ? new Date(f.dataRegistro).toLocaleDateString("pt-BR") : "—"}</td><td style="${td};text-align:center">${f.faixa1 || ""}</td><td style="${td};text-align:center">${f.faixa2 || ""}</td>'''

if old5 in code:
    code = code.replace(old5, new5)
    changes += 1
    print("✅ Fix 5: Data adicionada nas linhas do relatório de famílias")
else:
    print("⚠️  Fix 5: Linhas famílias não encontradas — pulando")

# ── 6. Mostrar data na ficha de família (card/tabela) ──
old6 = "const novas = familias.map(f => f.id === editFam.id ? { ...fFam, id: editFam.id } : f);"
new6 = "const novas = familias.map(f => f.id === editFam.id ? { ...fFam, id: editFam.id, dataRegistro: f.dataRegistro || new Date().toISOString() } : f);"

if old6 in code:
    code = code.replace(old6, new6)
    changes += 1
    print("✅ Fix 6: Preserva data original ao editar família")
else:
    print("⚠️  Fix 6: Padrão edição família não encontrado — pulando")

with open(path, 'w') as f:
    f.write(code)

print(f"\n🎉 {changes} correções aplicadas!")
