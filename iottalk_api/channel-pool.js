"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var _default =
/*#__PURE__*/
function () {
  function _default(props) {
    _classCallCheck(this, _default);

    this._table = {};
    this._rtable = {};
  }

  _createClass(_default, [{
    key: "add",
    value: function add(df_name, topic_) {
      this._table[df_name] = topic_;
      this._rtable[topic_] = df_name;
    }
  }, {
    key: "topic",
    value: function topic(df_name) {
      return this._table[df_name];
    }
  }, {
    key: "remove_df",
    value: function remove_df(df_name) {
      delete this._rtable[this._table[df_name]];
      delete this._table[df_name];
    }
  }, {
    key: "remove_all_df",
    value: function remove_all_df() {
      this._rtable = {};
      this._table = {};
    }
  }, {
    key: "df",
    value: function df(topic_) {
      return this._rtable[topic_];
    }
  }]);

  return _default;
}();

exports.default = _default;
;