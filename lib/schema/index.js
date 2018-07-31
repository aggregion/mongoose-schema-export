const Schema = require('./Schema');
const Field = require('./Field');

module.exports = {extractSchema};

function extractSchema(mongoose, {excludeModels = [], excludeFields = [], includeFields}) {
  const schema = new Schema();

  Object.entries(mongoose.models)
    .filter(([modelName]) => excludeModels ? !excludeModels.includes(modelName) : true)
    .forEach(([modelName, model]) => {
      const table = schema.createTable(modelName);
      createFieldsFromSchema(table, model.schema, {
        includeFields: typeof includeFields === 'function' ? includeFields(model) : includeFields,
        excludeFields
      });
    });

  return schema;
}

function createFieldsFromSchema(parent, schema, options) {
  const fields = getFields(schema, options);
  fields
    .map(([name, desc]) => createField(name, desc, options))
    .forEach(field => parent.addField(field));
}

function createField(name, desc, options) {
  const handler = typeHandlers[desc.constructor.name];
  if (!handler) {
    throw new Error(`Handler for field type ${desc.constructor.name} does not defined.`);
  }
  return handler(name, desc, options);
}

const typeHandlers = {
  SchemaNumber: createFieldDefault,
  ObjectId: createFieldObjectId,
  SchemaString: createFieldDefault,
  Mixed: createFieldMixed,
  SchemaArray: createFieldSchemaArray,
  DocumentArray: createFieldDocumentArray,
  SchemaType: createFieldSchemaType,
  SchemaBoolean: createFieldDefault,
  SchemaDate: createFieldDefault
};

function createFieldDefault(name, desc) {
  const field = new Field(name, desc.instance);
  return field;
}

function createFieldObjectId(name, desc) {
  if (name === '_id') {
    name = 'id';
  }
  const field = new Field(name, 'ObjectID');
  if (desc.options.ref) {
    field.addRef(desc.options.ref, 'id');
  }
  return field;
}

function createFieldSchemaArray(name, desc, options) {
  const field = new Field(name, `Array<${desc.caster.instance || 'Embedded'}>`);
  if (desc.caster.options.ref) {
    field.addRef(desc.caster.options.ref, 'id');
  }
  if (desc.caster.schema) {
    createFieldsFromSchema(field, desc.caster.schema, options);
  }
  return field;
}

function createFieldDocumentArray(name, desc, options) {
  const field = new Field(name, `Array<${desc.caster.instance || 'Embedded'}>`);
  if (desc.caster.schema) {
    createFieldsFromSchema(field, desc.caster.schema, options);
  }
  return field;
}

function createFieldMixed(name, desc) {
  const field = new Field(name, 'Object');
  return field;
}

function createFieldSchemaType(name, schemaType, options) {
  const field = new Field(name, 'Embedded');
  if (schemaType.caster.schema) {
    createFieldsFromSchema(field, schemaType.caster.schema, options);
  }

  return field;
}

function getFields(schema, {includeFields, excludeFields}) {
  return Object.entries(schema.paths)
    .map(([name, desc]) => ([name === '_id' ? 'id' : name, desc]))
    .filter(([name, desc]) => {
      if (excludeFields.includes(name)) {
        return false;
      }

      if (includeFields) {
        if (!includeFields.includes(name)) {
          name = name.split('.');
          if (name.length > 1) {
            return includeFields.some(n => {
              const r = new RegExp('^' + n + '\.');
              return r.test(name);
            });
          } else {
            return false;
          }
        }
      }
      return true;
    });
}
