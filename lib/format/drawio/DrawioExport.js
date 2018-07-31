const fs = require('fs');
const ejs = require('ejs');
const {DOMParser, XMLSerializer} = require('xmldom');
const stringPixelWidth = require('string-pixel-width');
const {getId, addEl} = require('../../utils');

const templateFolder = `${__dirname}/template`;
const documentTemplate = `${templateFolder}/document.xml`;
const tableTemplate = `${templateFolder}/table.ejs`;
const tableStyleTemplate = `${templateFolder}/tableStyle.ejs`;
const connectionStyleTemplate = `${templateFolder}/connectionStyle.ejs`;
const reLineEndings = /[\n\r]/gm;
const fontFamily = 'courier new';
const fontSize = 12;
const cellPadding = 3;

class DrawioExport {
  constructor(schema) {
    this.schema = schema;

    const xmlParser = new DOMParser({});
    this.document = xmlParser.parseFromString(fs.readFileSync(documentTemplate).toString());
    this.rootEl = this.document.getElementsByTagName('root')[0];
    this.tableTemplate = ejs.compile(fs.readFileSync(tableTemplate).toString().replace(reLineEndings, ''), {rmWhitespace: true});
    this.tableStyleTemplate = ejs.compile(fs.readFileSync(tableStyleTemplate).toString().replace(reLineEndings, ''), {rmWhitespace: true});
    this.connectionStyleTemplate = ejs.compile(fs.readFileSync(connectionStyleTemplate).toString().replace(reLineEndings, ''), {rmWhitespace: true});
  }

  async run() {
    this.calculate();
    this.addTables();
    this.addConnections();
    return this.serialize();
  }

  serialize() {
    const xmlSerializer = new XMLSerializer({});
    return xmlSerializer.serializeToString(this.document);
  }

  addTables() {
    this.schema.tables.forEach(table => this.addTable(table));
  }

  addTable(table) {
    const tableEl = addEl(this.rootEl, 'mxCell', {
      id: table.meta.id,
      value: this.tableTemplate(table),
      style: this.tableStyleTemplate(table),
      parent: 1,
      vertex: 1
    });

    addEl(tableEl, 'mxGeometry', {
      x: table.meta.x,
      y: table.meta.y,
      width: table.meta.width,
      height: table.meta.height,
      as: 'geometry'
    });
  }

  addConnections() {
    this.schema.tables.forEach(fromTable =>
      fromTable.fields
        .filter(field => field.ref)
        .forEach(fromField => {
          const ref = fromField.ref;
          const toTable = this.schema.tables.find(table => table.name === ref.table);

          if (!toTable) {
            return console.error(`Warn: table ${ref.table} not found!`);
          }

          const toField = toTable.fields.find(field => field.name === ref.key);
          if (!toField) {
            return console.error(`Warn: field ${ref.key} not found in table ${ref.table}`);
          }

          this.addConnection(fromTable, fromField, toTable, toField);
        })
    );
  }

  addConnection(fromTable, fromField, toTable, toField) {
    let entryX;
    let entryY;

    const fromCenterX = fromTable.meta.x + fromTable.meta.width / 2;
    const toCenterX = toTable.meta.x + toTable.meta.width / 2;

    const fromY = fromTable.meta.y;
    const toY = toTable.meta.y;

    if (fromCenterX < toCenterX) {
      if (fromY < toY) {
        //   c
        // f
        entryX = 0.5;
        entryY = 0;
      } else {
        // f
        //   c
        entryX = 0;
        entryY = 0.5;
      }
    } else {
      if (fromY < toY) {
        // c
        //   f
        entryX = 0.5;
        entryY = 0;
      } else {
        //   f
        // c
        entryX = 1;
        entryY = 0.5;
      }
    }

    const tableEl = addEl(this.rootEl, 'mxCell', {
      id: `${fromTable.meta.id}_${toTable.meta.id}`,
      style: this.connectionStyleTemplate({
        entryX,
        entryY,
        startArrow: 'ERoneToMany',
        endArrow: 'ERmandOne'
      }),
      source: fromTable.meta.id,
      target: toTable.meta.id,
      parent: '1',
      edge: '1'
    });

    addEl(tableEl, 'mxGeometry', {relative: 1, as: 'geometry'});
  }

  calculate() {
    const tables =this.schema.tables;
    tables.forEach(table => table.meta = this.getTableMeta(table));
    this.arrangeTables(tables);
  }

  getTableMeta(table) {
    const fields = table.fields;

    fields.forEach(field => field.meta = this.getFieldMeta(field));

    const titleWidth = cellPadding + Math.ceil(stringPixelWidth(table.name, {font: fontFamily, size: fontSize})) + cellPadding;
    const titleHeight = cellPadding + fontSize + cellPadding;

    const maxFieldNameWidth = Math.max.apply(null, fields.map(field => field.meta.fieldNameWidth));
    const maxFieldTypeWidth = Math.max.apply(null, fields.map(field => field.meta.fieldTypeWidth));

    const width = Math.max(maxFieldNameWidth + maxFieldTypeWidth, titleWidth);

    return {
      id: `${table.name}_${getId()}`,
      fontFamily,
      fontSize,
      titleWidth,
      titleHeight,
      cellPadding,
      width,
      height: fields.map(field => field.meta.height).reduce((acc, height) => acc + height, titleHeight)
    };
  }

  getFieldMeta(field) {
    const fieldNameWidth = cellPadding + Math.ceil(stringPixelWidth(field.name, {font: fontFamily, size: fontSize})) + cellPadding;
    const fieldTypeWidth = cellPadding + Math.ceil(stringPixelWidth(field.type, {font: fontFamily, size: fontSize})) + cellPadding;

    return {
      fontFamily,
      fontSize,
      cellPadding,
      fieldNameWidth,
      fieldTypeWidth,
      height: cellPadding + fontSize + cellPadding
    };
  }

  arrangeTables(tables) {
    const marginX = 20;
    const marginY = 20;
    const pageWidth = 2000;

    let maxTableHeight = 0;
    let x = marginX;
    let y = marginY;
    tables.forEach(({meta, name}) => {
      if (x + meta.width> pageWidth) {
        x = meta.width + marginX + marginX;
        y = y + maxTableHeight + marginY;
        maxTableHeight = 0;
        meta.x = marginX;
        meta.y = y;
      } else {
        meta.x = x;
        meta.y = y;
        x = x + meta.width + marginX;
      }

      if (meta.height > maxTableHeight) {
        maxTableHeight = meta.height;
      }
    });
  }
}

module.exports = DrawioExport;
