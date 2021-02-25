"use strict";

const compileSchema = require('./compileSchema');

const placeholderSdl = 'type NoTypesDefined implements Document {pleaseFix: String}';

const getPluginTypes = () => require('all:part:@sanity/base/schema-type');

module.exports = function fromGQL(sdl) {
  let opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  const externalTypes = opts.externalTypes || getPluginTypes();
  const throwOnError = opts.throwOnError || false;
  const schemaSdl = `${sdl}`.trim() || placeholderSdl;

  try {
    return compileSchema(schemaSdl, {
      externalTypes
    });
  } catch (err) {
    if (throwOnError) {
      throw err;
    } // eslint-disable-next-line no-console


    console.error(err);
    return [{
      name: 'gqlSchemaErrorCheckConsoleForDetails',
      title: 'GQL schema error - check console for details',
      type: 'object',
      fields: []
    }];
  }
};