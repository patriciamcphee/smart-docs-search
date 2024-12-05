"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "Search", {
  enumerable: true,
  get: function get() {
    return _Search["default"];
  }
});
exports["default"] = void 0;
var _Search = _interopRequireDefault(require("./SearchBar/Search"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
// src/theme/index.js
// This makes our Search component available to be used by Docusaurus's theme system
// If we want to specify a default export, we can do that too
var _default = exports["default"] = {
  Search: _Search["default"]
};