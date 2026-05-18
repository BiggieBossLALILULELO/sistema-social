import Dexie from "dexie";

// Cria o banco de dados local (IndexedDB) com uma tabela de chave-valor.
// Os dados ficam salvos no navegador, funcionam offline e persistem entre sessões.
const db = new Dexie("SistemaSocialRecife");

db.version(1).stores({
  kv: "key", // tabela simples: { key: "beneficiarios", value: [...] }
});

export default db;
