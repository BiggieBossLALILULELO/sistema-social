path = '/home/biggieboss/sistema-social/src/App.jsx'
with open(path, 'r') as f:
    code = f.read()

# Encontra o início e fim da função PartilharLogo
start = code.find('function PartilharLogo()')
end = code.find('\n}', start) + 2  # fecha o último }

if start == -1:
    print("⚠️ Função PartilharLogo não encontrada")
    exit()

nova_logo = '''function PartilharLogo() {
  return (
    <svg className="header-logo-svg" viewBox="0 0 420 92" xmlns="http://www.w3.org/2000/svg">
      {/* Borboleta - asa superior esquerda */}
      <ellipse cx="24" cy="26" rx="22" ry="15" fill="#F08478" stroke="#C96058" strokeWidth="1" transform="rotate(-28 24 26)"/>
      {/* Borboleta - asa superior direita */}
      <ellipse cx="62" cy="26" rx="22" ry="15" fill="#F08478" stroke="#C96058" strokeWidth="1" transform="rotate(28 62 26)"/>
      {/* Borboleta - asa inferior esquerda */}
      <ellipse cx="27" cy="52" rx="16" ry="12" fill="#F08478" stroke="#C96058" strokeWidth="1" transform="rotate(22 27 52)"/>
      {/* Borboleta - asa inferior direita */}
      <ellipse cx="59" cy="52" rx="16" ry="12" fill="#F08478" stroke="#C96058" strokeWidth="1" transform="rotate(-22 59 52)"/>
      {/* Manchas amarelas - asas superiores */}
      <ellipse cx="24" cy="26" rx="12" ry="7.5" fill="#F5D640" transform="rotate(-28 24 26)"/>
      <ellipse cx="62" cy="26" rx="12" ry="7.5" fill="#F5D640" transform="rotate(28 62 26)"/>
      {/* Manchas amarelas - asas inferiores */}
      <ellipse cx="27" cy="52" rx="9" ry="6" fill="#F5D640" transform="rotate(22 27 52)"/>
      <ellipse cx="59" cy="52" rx="9" ry="6" fill="#F5D640" transform="rotate(-22 59 52)"/>
      {/* Corpo */}
      <ellipse cx="43" cy="38" rx="3" ry="22" fill="#8C7B6B"/>
      {/* Cabeça */}
      <circle cx="43" cy="16" r="3.5" fill="#8C7B6B"/>
      {/* Antenas */}
      <path d="M41 13 Q 35 4 31 6" stroke="#8C7B6B" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M45 13 Q 51 4 55 6" stroke="#8C7B6B" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <circle cx="31" cy="6" r="1.8" fill="#8C7B6B"/>
      <circle cx="55" cy="6" r="1.8" fill="#8C7B6B"/>
      {/* GRUPO */}
      <text x="88" y="24" fontFamily="Arial, sans-serif" fontSize="15" fill="rgba(255,255,255,0.9)" fontWeight="700" letterSpacing="2">GRUPO</text>
      {/* Partilhar */}
      <text x="86" y="64" fontFamily="'Quicksand', 'Trebuchet MS', Arial, sans-serif" fontSize="44" fill="#A3D900" fontWeight="700" letterSpacing="-0.5">Partilhar</text>
      {/* ILUMINANDO CAMINHOS */}
      <text x="89" y="83" fontFamily="Arial, sans-serif" fontSize="12" fill="rgba(255,255,255,0.85)" letterSpacing="2.5" fontWeight="600">ILUMINANDO CAMINHOS</text>
    </svg>
  );
}'''

code = code[:start] + nova_logo + code[end:]

with open(path, 'w') as f:
    f.write(code)

print("✅ Logo atualizada com sucesso!")
