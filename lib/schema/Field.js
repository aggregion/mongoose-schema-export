class Field {
  constructor(name, type) {
    this.name = name;
    this.type = type;
    this.fields = [];
  }

  addRef(table, key) {
    this.ref = {
      table,
      key
    };
  }

  createField(name, type) {
    return this.addField(new Field(name, type));
  }

  addField(field) {
    this.fields.push(field);
    return field;
  }
}

module.exports = Field;
