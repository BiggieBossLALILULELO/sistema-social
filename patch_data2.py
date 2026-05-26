path = '/home/biggieboss/sistema-social/src/App.jsx'
with open(path, 'r') as f:
    code = f.read()

changes = 0

# ── 1. Adicionar dataRegistro ao EF (estado inicial do formulário de beneficiário) ──
old1 = '''  const EF = { nome: "", dataNascimento: "", sexo: "", nomeMae: "", rg: "", cpf: "", temNIS: false, nis: "", escolaridade: "", religiao: "", telefone: "", cep: "", endereco: "", numero: "", complemento: "", bairro: "", pontoReferencia: "", numPessoas: "", idadesPessoas: "", composicaoFamiliar: "", relacionamentoFamiliar: "", profissao: "", ondeTrabalha: "", renda: "", pessoasDependem: "", beneficio: "", moradia: "", demanda: "", necessidades: "", interesseFormacao: "", parecerProfissional: "", encaminhamentos: "", profissionalResponsavel: "", observacoes: "" };'''
new1 = '''  const EF = { nome: "", dataNascimento: "", sexo: "", nomeMae: "", rg: "", cpf: "", temNIS: false, nis: "", escolaridade: "", religiao: "", telefone: "", cep: "", endereco: "", numero: "", complemento: "", bairro: "", pontoReferencia: "", numPessoas: "", idadesPessoas: "", composicaoFamiliar: "", relacionamentoFamiliar: "", profissao: "", ondeTrabalha: "", renda: "", pessoasDependem: "", beneficio: "", moradia: "", demanda: "", necessidades: "", interesseFormacao: "", parecerProfissional: "", encaminhamentos: "", profissionalResponsavel: "", observacoes: "", dataRegistro: "" };'''

if old1 in code:
    code = code.replace(old1, new1)
    changes += 1
    print("✅ Fix 1: dataRegistro adicionado ao estado inicial do beneficiário")
else:
    print("⚠️  Fix 1: não encontrado")

# ── 2. No submit do beneficiário, usar dataRegistro do form se preenchido ──
old2 = "    await save([...beneficiarios, { ...form, id: uid(), dataRegistro: new Date().toISOString() }]);"
new2 = "    await save([...beneficiarios, { ...form, id: uid(), dataRegistro: form.dataRegistro ? new Date(form.dataRegistro.split('/').reverse().join('-')).toISOString() : new Date().toISOString() }]);"

if old2 in code:
    code = code.replace(old2, new2)
    changes += 1
    print("✅ Fix 2: submit usa data do formulário se preenchida")
else:
    print("⚠️  Fix 2: não encontrado")

# ── 3. Adicionar campo visual no formulário de beneficiário (FormSection step 1) ──
old3 = '''      <FormSection step="1" title="Identificação pessoal">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Inp label="Nome completo" required value={form.nome} onChange={f("nome")} placeholder="Ex: Maria da Silva" autoComplete="name" error={erros.nome} />'''
new3 = '''      <FormSection step="1" title="Identificação pessoal">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Inp label="Nome completo" required value={form.nome} onChange={f("nome")} placeholder="Ex: Maria da Silva" autoComplete="name" error={erros.nome} />
          <Inp label="Data do primeiro cadastro" value={form.dataRegistro} onChange={f("dataRegistro")} placeholder="DD/MM/AAAA" hint="Deixe em branco para usar a data de hoje. Preencha se for um cadastro antigo." type="date" />'''

if old3 in code:
    code = code.replace(old3, new3)
    changes += 1
    print("✅ Fix 3: campo 'Data do primeiro cadastro' adicionado ao formulário de beneficiário")
else:
    print("⚠️  Fix 3: não encontrado")

# ── 4. Adicionar dataRegistro ao EF das famílias ──
old4 = '''  const EF = { chefeNome: "", chefeCPF: "", maeNome: "", endereco: "", nis: "", faixa1: "", faixa2: "", faixa3: "", faixa4: "", faixa5: "" };'''
new4 = '''  const EF = { chefeNome: "", chefeCPF: "", maeNome: "", endereco: "", nis: "", faixa1: "", faixa2: "", faixa3: "", faixa4: "", faixa5: "", dataRegistro: "" };'''

if old4 in code:
    code = code.replace(old4, new4)
    changes += 1
    print("✅ Fix 4: dataRegistro adicionado ao estado inicial da família")
else:
    print("⚠️  Fix 4: não encontrado")

# ── 5. Adicionar campo no formulário de família ──
old5 = '''          <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 700, color: "var(--gray-500)", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 6 }}>Pessoas por faixa etária</p>'''
new5 = '''          <div className="field">
            <label className="field-label">Data do primeiro cadastro</label>
            <input className="field-input" type="date" value={fFam.dataRegistro} onChange={e => setFFam({ ...fFam, dataRegistro: e.target.value })} />
            <span className="field-hint">Deixe em branco para usar a data de hoje. Preencha se for um cadastro antigo.</span>
          </div>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 700, color: "var(--gray-500)", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 6 }}>Pessoas por faixa etária</p>'''

if old5 in code:
    code = code.replace(old5, new5)
    changes += 1
    print("✅ Fix 5: campo 'Data do primeiro cadastro' adicionado ao formulário de família")
else:
    print("⚠️  Fix 5: não encontrado")

# ── 6. Salvar data correta ao criar família ──
old6 = "const novas = [...familias, { ...fFam, id: uid(), dataRegistro: new Date().toISOString() }];"
new6 = "const novas = [...familias, { ...fFam, id: uid(), dataRegistro: fFam.dataRegistro ? new Date(fFam.dataRegistro).toISOString() : new Date().toISOString() }];"

if old6 in code:
    code = code.replace(old6, new6)
    changes += 1
    print("✅ Fix 6: data da família salva corretamente")
else:
    # tenta versão alternativa sem dataRegistro anterior
    old6b = "const novas = [...familias, { ...fFam, id: uid() }];"
    new6b = "const novas = [...familias, { ...fFam, id: uid(), dataRegistro: fFam.dataRegistro ? new Date(fFam.dataRegistro).toISOString() : new Date().toISOString() }];"
    if old6b in code:
        code = code.replace(old6b, new6b)
        changes += 1
        print("✅ Fix 6b: data da família salva corretamente")
    else:
        print("⚠️  Fix 6: não encontrado")

# ── 7. Relatório PDF beneficiários — adicionar coluna data ──
old7 = '<tr><th style="${th}">Nome</th><th style="${th}">CPF</th><th style="${th}">NIS</th><th style="${th}">Bairro</th><th style="${th}">Pessoas</th><th style="${th}">Renda</th></tr>'
new7 = '<tr><th style="${th}">Nome</th><th style="${th}">CPF</th><th style="${th}">NIS</th><th style="${th}">Bairro</th><th style="${th}">Pessoas</th><th style="${th}">Renda</th><th style="${th}">Primeiro cadastro</th></tr>'

if old7 in code:
    code = code.replace(old7, new7)
    changes += 1
    print("✅ Fix 7: coluna 'Primeiro cadastro' adicionada ao relatório de beneficiários")
else:
    print("⚠️  Fix 7: não encontrado")

# ── 8. Relatório PDF beneficiários — adicionar valor data nas linhas ──
old8 = '><td style="${td}">${b.nome}</td><td style="${td}">${b.cpf || "—"}</td><td style="${td}">${b.temNIS && b.nis ? b.nis : "—"}</td><td style="${td}">${b.bairro || "—"}</td><td style="${td}">${b.numPessoas || "—"}</td><td style="${td}">${b.renda ? fCur(b.renda) : "—"}</td></tr>'
new8 = '><td style="${td}">${b.nome}</td><td style="${td}">${b.cpf || "—"}</td><td style="${td}">${b.temNIS && b.nis ? b.nis : "—"}</td><td style="${td}">${b.bairro || "—"}</td><td style="${td}">${b.numPessoas || "—"}</td><td style="${td}">${b.renda ? fCur(b.renda) : "—"}</td><td style="${td}">${b.dataRegistro ? new Date(b.dataRegistro).toLocaleDateString("pt-BR") : "—"}</td></tr>'

if old8 in code:
    code = code.replace(old8, new8)
    changes += 1
    print("✅ Fix 8: data nas linhas do relatório de beneficiários")
else:
    print("⚠️  Fix 8: não encontrado")

# ── 9. Relatório PDF famílias — adicionar coluna data ──
old9 = '<tr><th style="${th}">Nº</th><th style="${th}">Chefe / CPF</th><th style="${th}">Mãe do chefe</th><th style="${th}">Endereço</th><th style="${th}">NIS</th><th style="${th}">0-6</th>'
new9 = '<tr><th style="${th}">Nº</th><th style="${th}">Chefe / CPF</th><th style="${th}">Mãe do chefe</th><th style="${th}">Endereço</th><th style="${th}">NIS</th><th style="${th}">Primeiro cadastro</th><th style="${th}">0-6</th>'

if old9 in code:
    code = code.replace(old9, new9)
    changes += 1
    print("✅ Fix 9: coluna 'Primeiro cadastro' adicionada ao relatório de famílias")
else:
    print("⚠️  Fix 9: não encontrado")

# ── 10. Relatório PDF famílias — valor data nas linhas ──
old10 = '<td style="${td};text-align:center">${f.faixa1 || ""}</td><td style="${td};text-align:center">${f.faixa2 || ""}</td>'
new10 = '<td style="${td}">${f.dataRegistro ? new Date(f.dataRegistro).toLocaleDateString("pt-BR") : "—"}</td><td style="${td};text-align:center">${f.faixa1 || ""}</td><td style="${td};text-align:center">${f.faixa2 || ""}</td>'

if old10 in code:
    code = code.replace(old10, new10)
    changes += 1
    print("✅ Fix 10: data nas linhas do relatório de famílias")
else:
    print("⚠️  Fix 10: não encontrado")

with open(path, 'w') as f:
    f.write(code)

print(f"\n🎉 {changes} correções aplicadas com sucesso!")
