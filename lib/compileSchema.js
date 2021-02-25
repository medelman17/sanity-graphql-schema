"use strict";

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toArray(arr) { return _arrayWithHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter); }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _createForOfIteratorHelper(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it.return != null) it.return(); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }

const oneline = require('oneline');

const _require = require('graphql'),
      parse = _require.parse,
      specifiedScalarTypes = _require.specifiedScalarTypes,
      valueFromASTUntyped = _require.valueFromASTUntyped,
      buildASTSchema = _require.buildASTSchema;

const _require2 = require('lodash'),
      words = _require2.words,
      snakeCase = _require2.snakeCase,
      camelCase = _require2.camelCase,
      upperFirst = _require2.upperFirst,
      isPlainObject = _require2.isPlainObject;

const coreSchema = require('./coreSchema');

const schemaError = require('./schemaError');

const stubExternalTypes = require('./stubExternalTypes');

const withoutUndefined = require('./withoutUndefined');

const core = parse(coreSchema);
const coreTypeMap = core.definitions.reduce((map, def) => map.set(def.name.value, def), new Map());
const unsupported = ['ScalarTypeDefinition', 'InputObjectTypeDefinition'];

module.exports = function compileSchema(userSchema, options) {
  const externalTypes = options.externalTypes || [];
  const externalTypesSchema = stubExternalTypes(externalTypes);
  const merged = parse([coreSchema, externalTypesSchema, userSchema].join('\n\n'));
  const external = externalTypesSchema ? parse(externalTypesSchema) : {
    definitions: []
  };
  const parsed = parse(userSchema);

  if (merged.kind !== 'Document') {
    return [schemaError('Could not parse GraphQL schema, expected kind `Document` at root')];
  } // Build schema to validate it


  const schema = buildASTSchema(merged);
  const externalTypeMap = external.definitions.reduce((map, def) => map.set(def.name.value, def), new Map());
  const defs = parsed.definitions || [];
  const userTypeMap = new Map();

  for (let i = 0; i < defs.length; i++) {
    const def = defs[i];

    if (unsupported.includes(def.kind)) {
      return [schemaError(`Unsupported node of kind ${def.kind} found`)];
    }

    userTypeMap.set(def.name.value, def);
  }

  const opts = {
    schema,
    icons: {}
  };
  const typeMap = new Map([...userTypeMap, ...externalTypeMap, ...coreTypeMap]);
  const sanityTypes = [];

  var _iterator = _createForOfIteratorHelper(userTypeMap.values()),
      _step;

  try {
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      const def = _step.value;
      const sanityType = convertType(def, typeMap, opts);

      if (sanityType) {
        sanityTypes.push(sanityType);
      }
    }
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }

  return externalTypes.concat(sanityTypes);
};

function titleCase(str) {
  const _words = words(snakeCase(str)),
        _words2 = _toArray(_words),
        first = _words2[0],
        rest = _words2.slice(1);

  return [upperFirst(first), ...rest].join(' ');
}

function isCoreScalar(typeName) {
  return specifiedScalarTypes.some(scalar => scalar.name === typeName);
}

function isScalar(typeName, map) {
  if (isCoreScalar(typeName)) {
    return true;
  }

  const type = map.get(typeName);
  return type && isScalarTypeDef(type);
}

function isScalarTypeDef(def) {
  return def.kind === 'ScalarTypeDefinition';
}

function isInterface(def) {
  return def.kind === 'InterfaceTypeDefinition';
}

function isUnion(def) {
  return def && def.kind === 'UnionTypeDefinition';
}

function isDocument(def) {
  return def.interfaces && def.interfaces.some(iface => iface.name.value === 'Document');
}

function isArgument(node) {
  return node.kind === 'Argument';
}

function typeImplementsInterface(type, ifaceName) {
  if (!type) {
    return false;
  }

  if (isInterface(type) && type.name.value === ifaceName) {
    return true;
  }

  return type.interfaces && type.interfaces.some(iface => iface.name.value === ifaceName);
}

function getUnwrappedType(typeDef, map) {
  const unwrapFor = ['NonNullType', 'ListType'];
  const type = unwrapFor.includes(typeDef.kind) ? typeDef.type : typeDef;

  if (unwrapFor.includes(type.kind)) {
    return getUnwrappedType(type, map);
  }

  if (type.kind !== 'NamedType') {
    throw new Error(oneline`
      Expected unwrapped type to be of kind "NamedType", got "${type.kind}"
    `);
  }

  if (isCoreScalar(type.name.value)) {
    return {
      kind: 'NamedType',
      name: {
        kind: 'Name',
        value: type.name.value
      }
    };
  }

  return map.get(type.name.value);
}

function getDirectives(def) {
  return (def.directives || []).reduce((acc, dir) => _objectSpread(_objectSpread({}, acc), {}, {
    [dir.name.value]: dir.arguments.filter(isArgument).reduce((args, arg) => _objectSpread(_objectSpread({}, args), {}, {
      [arg.name.value]: valueFromASTUntyped(arg.value)
    }), {})
  }), {
    display: {}
  });
}

function convertType(def) {
  switch (def.kind) {
    case 'ObjectTypeDefinition':
      for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      return convertObjectType(def, ...args);

    case 'UnionTypeDefinition':
      return null;

    default:
      return schemaError(`Unhandled node kind "${def.kind}"`);
  }
}

function flattenUnionType(def, map) {
  return def.types.reduce((types, typeDef) => {
    const type = map.get(typeDef.name.value) || typeDef;
    return isUnion(type) ? [...types, ...flattenUnionType(type, map)] : [...types, type];
  }, []);
}

function convertBlockType(def, map, options, directives) {
  const typeName = def.name.value;
  const display = directives.display,
        block = directives.block;
  const icons = options.icons;
  const fields = def.fields.reduce((acc, field) => {
    acc[field.name.value] = field;
    return acc;
  }, {});

  const inlineTypes = fields.of,
        rest = _objectWithoutProperties(fields, ["of"]);

  const unknown = Object.keys(rest);

  if (unknown.length > 0) {
    return schemaError(oneline`
      Unknown keys for block type:
      ${unknown.map(str => `"${str}"`).join(', ')}
    `);
  }

  let ofMembers;

  if (inlineTypes) {
    const nonNull = inlineTypes.type.kind === 'NonNullType';
    const type = nonNull ? inlineTypes.type.type : inlineTypes.type;
    const ofDef = convertArrayField(inlineTypes, map, _objectSpread(_objectSpread({}, options), {}, {
      parent: def
    }), type, inlineTypes);
    ofMembers = ofDef.of;
  }

  let styles = block.styles,
      decorators = block.decorators,
      annotations = block.annotations;

  if (styles) {
    const invalid = validateNameTitleArray(styles, 'styles');

    if (invalid) {
      return invalid;
    }

    styles = enforceTitlesForNameTitlePairs(styles);
  }

  if (decorators) {
    const invalid = validateNameTitleArray(decorators, 'decorators');

    if (invalid) {
      return invalid;
    }

    decorators = enforceTitlesForNameTitlePairs(decorators);
  }

  if (annotations && typeof annotations !== 'string') {
    return schemaError('`annotations` needs to be a string referencing a type', 'annotations');
  } else if (annotations && !map.has(annotations)) {
    return schemaError(`'annotations' references missing type: "${annotations}"`);
  } else if (annotations) {
    annotations = getAnnotationMembers(def, annotations, map, options);
  }

  return withoutUndefined({
    name: camelCase(typeName),
    title: display.title || titleCase(def.name.value),
    type: 'block',
    description: def.description && def.description.value,
    icon: icons[display.icon],
    of: ofMembers
  });
}

function getAnnotationMembers(def, annotations, map, options) {
  return convertArrayField({}, map, _objectSpread(_objectSpread({}, options), {}, {
    parent: def
  }), {
    kind: 'NamedType',
    name: {
      kind: 'Name',
      value: annotations
    }
  }, {
    name: 'annotations'
  }).of;
}

function validateNameTitleArray(arr, name) {
  if (!Array.isArray(arr)) {
    return schemaError(`${name} must be an array of name/title pairs, got ${typeof arr}`, name);
  }

  for (let i = 0; i < arr.length; i++) {
    if (!isPlainObject(arr[i])) {
      return schemaError(`Expected name/title pair, unexpected value at index ${i}`, name);
    }

    const unknown = Object.keys(arr[i]).filter(key => !['name', 'title'].includes(key));

    if (unknown.length > 0) {
      return schemaError(`Name/title pair has unknown keys: ${unknown.map(key => `"${key}"`).join(', ')}`, name);
    }

    if (!arr[i].name) {
      return schemaError(`Name/title pair at index ${i} is missing "name" property`, name);
    }
  }

  return false;
}

function enforceTitlesForNameTitlePairs(arr) {
  const getTitle = name => /^h\d$/.test(name) ? `Heading ${name.slice(1)}` : titleCase(name);

  return arr.map(item => ({
    name: item.name,
    title: item.title || getTitle(item.name)
  }));
}

function convertObjectType(def, map, options) {
  const typeName = def.name.value;

  if (coreTypeMap.has(typeName)) {
    return schemaError(oneline`
      "${typeName}" is a bundled type, please use a different name`, typeName);
  }

  if (def.interfaces.length > 1) {
    return schemaError(oneline`
        Tried to implement multiple interfaces, only a single interface is allowed
      `, typeName);
  }

  let type = 'object';

  if (def.interfaces[0]) {
    const iface = map.get(def.interfaces[0].name.value);

    if (!iface) {
      return schemaError(oneline`
        Tried to implement interface "${def.interfaces[0].name.value}",
        which is not defined`, typeName);
    }

    if (!isInterface(iface)) {
      return schemaError(`Tried to implement "${iface.name.value}", which is not an interface`, typeName);
    }

    type = camelCase(iface.name.value);
  }

  const directives = getDirectives(def);
  const display = directives.display,
        fieldsets = directives.fieldsets,
        orderings = directives.orderings,
        block = directives.block;
  const icons = options.icons;

  if (block) {
    return convertBlockType(def, map, options, directives);
  }

  return withoutUndefined({
    name: camelCase(typeName),
    title: display.title || titleCase(def.name.value),
    type,
    description: def.description && def.description.value,
    icon: icons[display.icon],
    fields: def.fields.map(field => convertField(field, map, _objectSpread(_objectSpread({}, options), {}, {
      parent: def
    }))),
    orderings: orderings && orderings.from,
    fieldsets: fieldsets && fieldsets.from
  });
}

function optionsFromDirectives(type, directives, map, options) {
  const parent = options.parent;
  const typeName = type.name && type.name.value;
  const typeDef = typeName && map.get(typeName);
  const display = directives.display,
        enumDir = directives.enum,
        extract = directives.extract,
        hotspot = directives.hotspot,
        slug = directives.slug;

  if (typeName === 'String') {
    return {
      list: enumDir && enumDir.values,
      layout: enumDir && enumDir.layout,
      direction: enumDir && enumDir.direction
    };
  }

  if (typeName === 'Slug') {
    return {
      source: slug && slug.source || getFirstStringField(parent.fields, map),
      maxLength: slug && slug.maxLength || 200
    };
  }

  if (typeImplementsInterface(typeDef, 'Image')) {
    return {
      metadata: extract && extract.metadata,
      storeOriginalFilename: extract && extract.originalFilename,
      hotspot: Boolean(hotspot) || undefined
    };
  }

  if (typeImplementsInterface(typeDef, 'File')) {
    return {
      storeOriginalFilename: extract && extract.originalFilename
    };
  }

  if (type.kind === 'ListType') {
    return {
      layout: display && display.layout
    };
  }

  return {};
}

function getFirstStringField(fields, map) {
  const first = fields.map(field => ({
    name: field.name.value,
    type: getUnwrappedType(field.type, map)
  })).find(field => field.type && field.type.name.value === 'String');
  return first ? first.name : undefined;
}

function convertArrayField(def, map, options, type, field) {
  const unwrapped = getUnwrappedType(type, map);
  const namedMembers = isUnion(unwrapped) ? flattenUnionType(unwrapped, map) : [unwrapped];
  const members = namedMembers.map(member => map.get(member.name.value) || member);
  const hasScalars = members.some(member => isScalar(member.name.value, map));
  const hasNonScalars = members.some(member => !isScalar(member.name.value, map));
  const hasDocuments = members.some(isDocument);
  const allDocuments = members.every(isDocument);

  if (hasScalars && hasNonScalars) {
    return schemaError(oneline`
      Field "${field.name}" on type "${options.parent.name.value}"
      cannot contain both scalar and object types`, field.name, field);
  }

  let ofDef;
  const forcedInline = Boolean(getDirectives(def).inline);

  if (hasScalars || forcedInline || !hasDocuments) {
    // [String | Number]
    // [Author | Book] @inline
    // [Image  | ImageWithCaption]
    ofDef = members.map(getFieldDefForNamedType);
  } else if (allDocuments) {
    // [Author | Book]
    ofDef = [{
      type: 'reference',
      to: members.map(getFieldDefForNamedType)
    }];
  } else {
    // [Author | Image]
    const docs = members.filter(isDocument);
    const inline = members.filter(member => !isDocument(member));
    ofDef = [{
      type: 'reference',
      to: docs.map(getFieldDefForNamedType)
    }, ...inline.map(getFieldDefForNamedType)];
  }

  return withoutUndefined(_objectSpread(_objectSpread({}, field), {}, {
    type: 'array',
    of: ofDef
  }));
}

function convertField(def, map, options) {
  const nonNull = def.type.kind === 'NonNullType';
  const type = nonNull ? def.type.type : def.type;
  const name = def.name && def.name.value;
  const directives = getDirectives(def);
  const display = directives.display,
        readOnly = directives.readOnly,
        hidden = directives.hidden,
        fieldset = directives.fieldset,
        enumDir = directives.enum;
  const field = {
    name,
    type: undefined,
    title: display.title || name && titleCase(name),
    description: def.description && def.description.value,
    readOnly: Boolean(readOnly) || undefined,
    hidden: Boolean(hidden) || undefined,
    fieldset: fieldset && fieldset.set,
    options: withoutUndefined(optionsFromDirectives(type, directives, map, options))
  };

  if (def.arguments && def.arguments.length > 0) {
    return schemaError(`Field arguments are not supported`, name, field);
  }

  if (enumDir && type.name && type.name.value !== 'String') {
    return schemaError(`@enum directive only allowed for String fields`, name, field);
  }

  if (nonNull) {
    field.validation = field.validation ? [field.validation, Rule => Rule.required()] : Rule => Rule.required();
  }

  if (type.kind === 'ListType') {
    return convertArrayField(def, map, options, type, field);
  }

  if (type.kind === 'NamedType') {
    return convertNamedTypeField(def, map, options, type, field);
  }

  return field;
}

function convertNamedTypeField(def, map, options, type, baseField) {
  const name = def.name && def.name.value;
  const parent = options.parent;
  const typeName = type.name.value;
  const referencedType = map.get(typeName);

  if (!referencedType && !isCoreScalar(typeName)) {
    return schemaError(oneline`
      Field "${name}" on type "${parent.name.value}" is of type "${typeName}",
      which is not a defined type`, name, baseField);
  } else if (!referencedType || isScalar(typeName, map)) {
    return withoutUndefined(_objectSpread(_objectSpread({}, baseField), getFieldDefForNamedType(type)));
  }

  const members = isUnion(referencedType) ? flattenUnionType(referencedType, map) : [referencedType];
  const allMembersAreDocuments = members.every(isDocument);
  const shouldInline = Boolean(getDirectives(def).inline) || !allMembersAreDocuments;
  const shouldReference = !shouldInline; // Sanity doesn't support union fields, as such.
  // It does support references to one or more document type, but not "inline" unions.

  if (referencedType && !shouldReference && isUnion(referencedType)) {
    const targets = referencedType.types.map(member => getUnwrappedType(member, map));
    const nonDocTypes = targets.filter(member => !isDocument(member)).map(member => member.name.value);
    const plural = nonDocTypes.length > 1 ? 'are not document types' : 'is not a document type';
    const help = nonDocTypes.length > 0 && `(${nonDocTypes.join(', ')} ${plural} and therefore must be inlined)`;
    return schemaError(oneline`
        Field "${name}" on type "${parent.name.value}" cannot be
        an inline union ${help || ''}`, name, baseField);
  }

  const fieldDef = getFieldDefForNamedType(type);
  const refOverride = shouldReference ? {
    type: 'reference',
    to: members.map(getFieldDefForNamedType)
  } : {};
  return withoutUndefined(_objectSpread(_objectSpread(_objectSpread({}, baseField), fieldDef), refOverride));
}

function getFieldDefForNamedType(type) {
  switch (type.name.value) {
    case 'Int':
      return {
        type: 'number',
        validation: Rule => Rule.integer()
      };

    case 'Float':
      return {
        type: 'number'
      };

    case 'ID':
      return {
        type: 'string'
      };

    default:
      return {
        type: camelCase(type.name.value)
      };
  }
}