const Table = require('./Table');

class Schema {
  constructor(name) {
    this.name = name;
    this.tables = [];
  }

  createTable(name) {
    return this.addTable(new Table(name));
  }

  addTable(table) {
    this.tables.push(table);
    return table;
  }
}

module.exports = Schema;
