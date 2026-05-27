path = '/home/biggieboss/sistema-social/src/App.jsx'
with open(path, 'r') as f:
    code = f.read()

# ── Adiciona funções de backup após a função gerarRelatorioFamilia ──
backup_code = '''
// ══════════════════════════════════════════════════════════════════
// BACKUP E RESTAURAÇÃO
// ══════════════════════════════════════════════════════════════════
async function fazerBackup(dados) {
  const backup = {
    versao: "1.0",
    data: new Date().toISOString(),
    instituicao: "Grupo Partilhar",
    dados
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const dataStr = new Date().toLocaleDateString("pt-BR").replace(/\\//g, "-");
  a.href = url;
  a.download = `backup-partilhar-${dataStr}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

async function restaurarBackup(file, setters) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const backup = JSON.parse(e.target.result);
        if (!backup.dados) { reject("Arquivo inválido."); return; }
        const { beneficiarios, atendimentos, estoque, movimentacoes, metas, entidade, familias } = backup.dados;
        if (beneficiarios) { await sSet("beneficiarios", beneficiarios); setters.setBeneficiarios(beneficiarios); }
        if (atendimentos)  { await sSet("atendimentos",  atendimentos);  setters.setAtendimentos(atendimentos); }
        if (estoque)       { await sSet("estoque",       estoque);       setters.setEstoque(estoque); }
        if (movimentacoes) { await sSet("movimentacoes", movimentacoes); setters.setMovs(movimentacoes); }
        if (metas)         { await sSet("metas",         metas);         setters.setMetas(metas); }
        if (entidade)      { await sSet("entidade",      entidade);      setters.setEntidade(entidade); }
        if (familias)      { await sSet("familias",      familias);      setters.setFamilias(familias); }
        resolve(backup);
      } catch { reject("Erro ao ler arquivo."); }
    };
    reader.readAsText(file);
  });
}

'''

# Insere antes do módulo Beneficiários
marker = "// ══════════════════════════════════════════════════════════════════\n// BENEFICIÁRIOS"
if marker in code:
    code = code.replace(marker, backup_code + marker)
    print("✅ Funções de backup adicionadas")
else:
    print("⚠️ Marcador não encontrado")

# ── Adiciona aba de Backup no módulo Relatórios ──
old_relat = '''      <div style={{ fontFamily: "var(--font-sans)", fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em" }}>🦋 Sistema Partilhar</div>'''
new_relat = '''      <div style={{ fontFamily: "var(--font-sans)", fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em" }}>🦋 Sistema Partilhar</div>'''

# ── Adiciona seção de backup na tela de Relatórios ──
old_end_rel = '''      <h3 style={{ fontFamily: "var(--font-sans)", fontSize: 16, fontWeight: 700, marginBottom: 14 }}>🏘 Por bairro</h3>'''
new_end_rel = '''      <h3 style={{ fontFamily: "var(--font-sans)", fontSize: 16, fontWeight: 700, marginBottom: 16 }}>💾 Backup dos dados</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
        <div className="rel-export-card">
          <div style={{ display: "flex", alignItems: "center", gap: 16, flex: 1 }}>
            <span className="rel-export-icon">💾</span>
            <div>
              <p className="rel-export-title">Fazer backup completo</p>
              <p className="rel-export-desc">Baixa um arquivo com todos os dados — beneficiários, famílias, doações e atendimentos</p>
            </div>
          </div>
          <Btn variant="primary" size="md" onClick={() => fazerBackup({ beneficiarios, atendimentos, estoque, movimentacoes: movs, metas, entidade, familias })}>💾 Baixar backup</Btn>
        </div>
        <div className="rel-export-card">
          <div style={{ display: "flex", alignItems: "center", gap: 16, flex: 1 }}>
            <span className="rel-export-icon">📥</span>
            <div>
              <p className="rel-export-title">Restaurar backup</p>
              <p className="rel-export-desc">Importa um arquivo de backup — use ao trocar de celular ou computador</p>
            </div>
          </div>
          <label style={{ cursor: "pointer" }}>
            <input type="file" accept=".json" style={{ display: "none" }} onChange={async (e) => {
              if (!e.target.files[0]) return;
              const ok = await showConfirm("Restaurar o backup vai substituir todos os dados atuais. Deseja continuar?", { title: "Restaurar backup", variant: "danger", confirmLabel: "Sim, restaurar" });
              if (!ok) return;
              try {
                await restaurarBackup(e.target.files[0], setters);
                haptic(true);
                await showAlert("Backup restaurado com sucesso! Todos os dados foram importados.", { title: "✅ Restaurado!", variant: "success" });
              } catch (err) { await showAlert("Erro ao restaurar: " + err, { variant: "danger", title: "Erro" }); }
            }}/>
            <span className="btn btn-md btn-ghost">📥 Selecionar arquivo</span>
          </label>
        </div>
        <div className="alert alert-amber" style={{ marginBottom: 0 }}>
          <span className="alert-icon">💡</span>
          <div>
            <p style={{ fontFamily: "var(--font-sans)", fontWeight: 700, color: "var(--amber-700)", fontSize: 14 }}>Dica importante</p>
            <p style={{ fontSize: 13, color: "var(--amber-700)" }}>Faça backup regularmente e salve o arquivo no WhatsApp, Google Drive ou e-mail. Ao trocar de celular, abra o sistema no novo aparelho, vá em Relatórios e clique em "Restaurar backup".</p>
          </div>
        </div>
      </div>
      <h3 style={{ fontFamily: "var(--font-sans)", fontSize: 16, fontWeight: 700, marginBottom: 14 }}>🏘 Por bairro</h3>'''

if old_end_rel in code:
    code = code.replace(old_end_rel, new_end_rel)
    print("✅ Seção de backup adicionada na tela de Relatórios")
else:
    print("⚠️ Marcador de relatórios não encontrado")

# ── Adiciona setters como prop no RelatoriosModule ──
old_rel_func = 'function RelatoriosModule({ beneficiarios, atendimentos, estoque, movs }) {'
new_rel_func = 'function RelatoriosModule({ beneficiarios, atendimentos, estoque, movs, metas, entidade, familias, setters }) {'

if old_rel_func in code:
    code = code.replace(old_rel_func, new_rel_func)
    print("✅ Props do RelatoriosModule atualizadas")
else:
    print("⚠️ RelatoriosModule não encontrado")

# ── Atualiza chamada do RelatoriosModule no App ──
old_rel_call = '{mod === "relatorios" && <RelatoriosModule beneficiarios={beneficiarios} atendimentos={atendimentos} estoque={estoque} movs={movs} />}'
new_rel_call = '{mod === "relatorios" && <RelatoriosModule beneficiarios={beneficiarios} atendimentos={atendimentos} estoque={estoque} movs={movs} metas={metas} entidade={entidade} familias={familias} setters={{ setBeneficiarios, setAtendimentos, setEstoque, setMovs, setMetas, setEntidade, setFamilias }} />}'

if old_rel_call in code:
    code = code.replace(old_rel_call, new_rel_call)
    print("✅ Chamada do RelatoriosModule atualizada")
else:
    print("⚠️ Chamada não encontrada")

with open(path, 'w') as f:
    f.write(code)

print("\n🎉 Backup/Restauração implementado com sucesso!")
