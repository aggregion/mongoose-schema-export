const {expect} = require('chai');
const mongoose = require('mongoose');
const {extractSchema} = require('../schema');
const Schema = require('./Schema');
const Table = require('./Table');
const Field = require('./Field');

describe('Schema', () => {
  describe('extractSchema', () => {
    before(() => {
      const embeddedSchema = new mongoose.Schema({
        string: String
      });

      mongoose.model('Test1', new mongoose.Schema({
        test2: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Test2'
        },
        mixed: {
          sub1: String,
          sub2: String
        },
        embedded: embeddedSchema,
        arrayOfString: [String],
        arrayOfNumber: [Number],
        arrayOfEmbedded: [embeddedSchema],
        arrayOfObjectId: [{type: mongoose.Schema.Types.ObjectId, ref: 'Test2'}]
      }));

      mongoose.model('Test2', new mongoose.Schema({
        string: {type: String},
        number: {type: Number}
      }, {timestamps: true}));
    });

    it('should return schema', () => {
      let table;
      let field;

      const schema = extractSchema(mongoose, {});

      expect(schema).to.be.instanceOf(Schema);
      expect(schema.tables).to.be.an('array').and.have.length(2);

      table = schema.tables.find(table => table.name === 'Test1');
      expect(table).to.be.instanceOf(Table);
      expect(table.fields).to.be.an('array').and.have.length(10);
      checkField(table, 'id', 'ObjectID');
      checkField(table, '__v', 'Number');
      checkField(table, 'test2', 'ObjectID', 'id', 'Test2');
      checkField(table, 'mixed.sub1', 'String');
      checkField(table, 'mixed.sub2', 'String');
      field = checkField(table, 'embedded', 'Embedded');
        checkField(field, 'string', 'String');
      checkField(table, 'arrayOfString', 'Array<String>');
      checkField(table, 'arrayOfNumber', 'Array<Number>');
      field = checkField(table, 'arrayOfEmbedded', 'Array<Embedded>');
      checkField(field, 'string', 'String');
      checkField(table, 'arrayOfObjectId', 'Array<ObjectID>', 'id', 'Test2');

      table = schema.tables.find(table => table.name === 'Test2');
      expect(table).to.be.instanceOf(Table);
      expect(table.fields).to.be.an('array').and.have.length(6);
      checkField(table, 'id', 'ObjectID');
      checkField(table, '__v', 'Number');
      checkField(table, 'string', 'String');
      checkField(table, 'number', 'Number');
      checkField(table, 'createdAt', 'Date');
      checkField(table, 'updatedAt', 'Date');
    });

    it('should exclude models', () => {
      const schema = extractSchema(mongoose, {excludeModels: ['Test1']});

      expect(schema).to.be.instanceOf(Schema);
      expect(schema.tables).to.be.an('array').and.have.length(1);

      const table = schema.tables[0];
      expect(table).to.be.instanceOf(Table);
      expect(table.name).to.equal('Test2');
      expect(table.fields).to.be.an('array').and.have.length(6);
      checkField(table, 'id', 'ObjectID');
      checkField(table, '__v', 'Number');
      checkField(table, 'string', 'String');
      checkField(table, 'number', 'Number');
      checkField(table, 'createdAt', 'Date');
      checkField(table, 'updatedAt', 'Date');
    });

    it('should exclude fields', () => {
      const excludeFields = ['__v', 'id'];
      const schema = extractSchema(mongoose, {excludeFields});

      expect(schema).to.be.instanceOf(Schema);
      expect(schema.tables).to.be.an('array').and.have.length(2);

      schema.tables.forEach(table => {
        expect(table).to.be.instanceOf(Table);
        expect(table.fields).to.be.an('array');
        table.fields.forEach(field =>
          expect(excludeFields).to.not.include(field.name)
        );
      });
    });

    it('should include fields (array)', () => {
      const includeFields = ['__v', 'id'];
      const schema = extractSchema(mongoose, {includeFields});

      expect(schema).to.be.instanceOf(Schema);
      expect(schema.tables).to.be.an('array').and.have.length(2);

      schema.tables.forEach(table => {
        expect(table).to.be.instanceOf(Table);
        expect(table.fields).to.be.an('array');
        table.fields.forEach(field =>
          expect(includeFields).to.include(field.name)
        );
      });
    });

    it('should include fields (function)', () => {
      const includeFields = ['__v', 'id'];
      const schema = extractSchema(mongoose, {
        includeFields: model => includeFields
      });

      expect(schema).to.be.instanceOf(Schema);
      expect(schema.tables).to.be.an('array').and.have.length(2);

      schema.tables.forEach(table => {
        expect(table).to.be.instanceOf(Table);
        expect(table.fields).to.be.an('array');
        table.fields.forEach(field =>
          expect(includeFields).to.include(field.name)
        );
      });
    });
  });
});

function checkField(table, fieldName, typeName, refKey, refTable) {
  const field = table.fields.find(field => field.name === fieldName);
  expect(field).to.be.instanceOf(Field);
  expect(field.type).to.equal(typeName);
  if (refKey) {
    expect(field).to.have.property('ref');
    expect(field.ref.key).to.equal(refKey);
    expect(field.ref.table).to.equal(refTable);
  }
  return field;
}
