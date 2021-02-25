"use strict";

module.exports = function taggedTemplateNoop(strings) {
  for (var _len = arguments.length, keys = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    keys[_key - 1] = arguments[_key];
  }

  const lastIndex = strings.length - 1;
  return strings.slice(0, lastIndex).reduce((acc, slice, i) => acc + slice + keys[i], '') + strings[lastIndex];
};