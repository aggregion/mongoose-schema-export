const Field = require('./Field');

class Table {
  constructor(name) {
    this.name = name;
    this.fields = [];
  }

  createField(name, type) {
    return this.addField(new Field(name, type));
  }

  addField(field) {
    this.fields.push(field);
    return field;
  }
}

module.exports = Table;
