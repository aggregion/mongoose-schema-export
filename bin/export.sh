#!/usr/bin/env node

const yargs = require('yargs');
const glob = require('glob');
const fs = require('fs');
const path = require('path');
const {exportFromFiles, formats} = require('../lib');

const argv = yargs
  .option('f', {
    alias: 'format',
    describe: 'Output format.',
    type: 'string',
    choices: Object.keys(formats),
    default: 'drawio'
  })
  .option('o', {
    alias: 'output',
    describe: 'Output file.',
    type: 'string',
    required: true,
    coerce: value => path.resolve(value)
  })
  .option('p', {
    alias: 'pattern',
    describe: 'Search glob pattern.',
    default: '**/*.model.js',
    type: 'string',
    required: true
  })
  .option('c', {
    alias: 'cwd',
    describe: 'Current working directory.',
    type: 'string',
    default: process.cwd()
  })
  .option('e', {
    alias: 'excludeModels',
    describe: 'Exclude models',
    type: 'string',
    coerce: parseArray
  })
  .option('x', {
    alias: 'excludeFields',
    describe: 'Exclude fields',
    type: 'string',
    default: '__v',
    coerce: parseArray
  })
  .option('i', {
    alias: 'includeFields',
    describe: 'Include fields',
    type: 'string',
    coerce: parseIncludeFields
  })
  .help('help')
  .argv;

function parseArray(val) {
  return typeof val === 'string' ? val.split(',') : val;
}

function parseIncludeFields(value) {
  if (value) {
    return parseArray(value);
  } else {
    return model => model.availableFields && model.availableFields.view;
  }
}

const files = glob
  .sync(argv.pattern, {cwd: argv.cwd})
  .map(fileName => path.join(argv.cwd, fileName));

exportFromFiles(files, argv)
  .then(() => {
    console.log(`File saved ${argv.output}.`);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
