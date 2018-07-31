const path = require('path');
const {extractSchema} = require('./schema');
const {writeFile} = require('./utils');
const formats = require('./format');

module.exports = {
  extractSchema,
  formats,
  exportFromMongoose,
  exportFromFiles
};

async function exportFromMongoose(mongoose, {output, format, excludeModels, excludeFields, includeFields}) {
  const schema = extractSchema(mongoose, {
    excludeModels,
    excludeFields,
    includeFields
  });
  if (excludeModels) {
    console.log('Exclude models:');
    excludeModels.forEach(modelName => console.log('  ' + modelName));
  }
  if (excludeFields) {
    console.log('Exclude fields:');
    excludeFields.forEach(fieldName => console.log('  ' + fieldName));
  }
  console.log('Export models:');
  schema.tables.forEach(table => console.log('  ' + table.name));
  const exportService = new formats[format].Export(schema);
  const content = await exportService.run();
  return writeFile(output, content);
}

async function exportFromFiles(fileNames, options) {
  const models = fileNames
    .map(fileName => path.resolve(fileName))
    .map(fileName => require(fileName));
  const mongoose = models[0] && models[0].base || require('mongoose');
  return exportFromMongoose(mongoose, options);
}
