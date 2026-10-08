process.removeAllListeners("warning");
// SQLite integrado en Node (node:sqlite, Node 22.5+). No necesita compilar nada ni instalar paquetes nativos.
const { DatabaseSync } = require("node:sqlite");

module.exports = class Database {
  constructor(file, opts = {}){ this.d = new DatabaseSync(file, { readOnly: !!opts.readonly }); }
  exec(sql){ return this.d.exec(sql); }
  prepare(sql){ return this.d.prepare(sql); }
  close(){ this.d.close(); }
  transaction(fn){
    return (...args) => {
      this.d.exec("BEGIN");
      try{ const r = fn(...args); this.d.exec("COMMIT"); return r; }
      catch(e){ this.d.exec("ROLLBACK"); throw e; }
    };
  }
};
