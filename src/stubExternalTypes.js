const {upperFirst} = require('lodash')

module.exports = function stubExternalTypes(types) {
  return types.reduce((sdl, type) => {
    const conformedTypeName = type.name.replace('-','')
    return `${sdl}
    # Stub to make external types work
    scalar ${upperFirst(conformedTypeName)} # ${conformedTypeName}\n\n`.replace(/(\n+)\s*/g, '$1')
  }, '')
}
