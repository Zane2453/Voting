"use strict";
var dan2 = (function () {

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.reconnecting = exports.connected = exports.UUID = exports.push = exports.deregister = exports.register = void 0;

  var _channelPool = _interopRequireDefault(require("./channel-pool.js"));

  var _uuid = _interopRequireDefault(require("./uuid.js"));

  var _mqtt = _interopRequireDefault(require("mqtt"));

  var _superagent = _interopRequireDefault(require("superagent"));

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

  var _url;

  var _id;

  var _mqtt_host;

  var _mqtt_port;

  var _mqtt_scheme;

  var _mqtt_client;

  var _i_chans;

  var _o_chans;

  var _ctrl_i;

  var _ctrl_o;

  var _on_signal;

  var _on_data;

  var _rev;

  var publish = function publish(channel, message, retained) {
    if (!_mqtt_client) return;
    if (retained === undefined) retained = false;

    _mqtt_client.publish(channel, message, {
      retain: retained,
      qos: 1
    });
  };

  var subscribe = function subscribe(channel) {
    if (!_mqtt_client) return;
    return _mqtt_client.subscribe(channel);
  };

  var unsubscribe = function unsubscribe(channel) {
    if (!_mqtt_client) return;
    return _mqtt_client.unsubscribe(channel);
  };

  var on_message = function on_message(topic, message) {
    if (topic == _ctrl_o) {
      var signal = JSON.parse(message);
      var handling_result = null;

      switch (signal['command']) {
        case 'CONNECT':
          if ('idf' in signal) {
            var idf = signal['idf'];

            _i_chans.add(idf, signal['topic']);

            handling_result = _on_signal(signal['command'], [idf]);
          } else if ('odf' in signal) {
            var odf = signal['odf'];

            _o_chans.add(odf, signal['topic']);

            handling_result = _on_signal(signal['command'], [odf]);
            subscribe(_o_chans.topic(odf));
          }

          break;

        case 'DISCONNECT':
          if ('idf' in signal) {
            var _idf = signal['idf'];

            _i_chans.remove_df(_idf);

            handling_result = _on_signal(signal['command'], [_idf]);
          } else if ('odf' in signal) {
            var _odf = signal['odf'];
            unsubscribe(_o_chans.topic(_odf));

            _o_chans.remove_df(_odf);

            handling_result = _on_signal(signal['command'], [_odf]);
          }

          break;
      }

      var res_message = {
        'msg_id': signal['msg_id']
      };

      if (typeof handling_result == 'boolean' && handling_result) {
        res_message['state'] = 'ok';
      } else {
        res_message['state'] = 'error';
        res_message['reason'] = handling_result[1];
      }

      publish(_ctrl_i, JSON.stringify(res_message));
      return;
    } else {
      var _odf2 = _o_chans.df(topic);

      if (!_odf2) return;

      _on_data(_odf2, JSON.parse(message));
    }
  };

  var register = function register(url, params, callback) {
    _url = url;
    _id = 'id' in params ? params['id'] : (0, _uuid.default)();
    _on_signal = params['on_signal'];
    _on_data = params['on_data'];
    _i_chans = new _channelPool.default();
    _o_chans = new _channelPool.default();

    var on_failure = function on_failure(err) {
      console.error('on_failure', err);
      if (callback) callback(false, err);
    };

    _superagent.default.put(_url + '/' + _id).set('Content-Type', 'application/json').set('Accept', '*/*').send(JSON.stringify({
      'name': params['name'],
      'idf_list': params['idf_list'],
      'odf_list': params['odf_list'],
      'accept_protos': params['accept_protos'],
      'profile': params['profile']
    })).end(function (err, res) {
      if (err) {
        on_failure(err);
        return;
      }

      var metadata = res.body;
      console.debug('register metadata', metadata);

      if (typeof metadata === 'string') {
        metadata = JSON.parse(metadata);
      }

      _rev = metadata['rev'];
      _ctrl_i = metadata['ctrl_chans'][0];
      _ctrl_o = metadata['ctrl_chans'][1];
      _mqtt_host = metadata.url['host'];
      _mqtt_port = metadata.url['ws_port'];
      _mqtt_scheme = metadata.url['ws_scheme'];

      function on_connect() {
        console.info('mqtt_connect');

        _i_chans.remove_all_df();

        _o_chans.remove_all_df();

        publish(_ctrl_i, JSON.stringify({
          'state': 'online',
          'rev': _rev
        }), true // retained message
        );
        subscribe(_ctrl_o);

        if (callback) {
          callback({
            'raproto': _url,
            'mqtt': metadata['url'],
            'id': _id,
            'd_name': metadata['name']
          });
        }
      }

      _mqtt_client = _mqtt.default.connect(_mqtt_scheme + '://' + _mqtt_host + ':' + _mqtt_port, {
        clientId: 'mqttjs_' + _id,
        will: {
          topic: _ctrl_i,
          payload: JSON.stringify({
            'state': 'offline',
            'rev': _rev
          }),
          retain: true
        }
      });

      _mqtt_client.on('connect', on_connect);

      _mqtt_client.on('reconnect', function () {
        console.info('mqtt_reconnect');
      });

      _mqtt_client.on('error', function (err) {
        console.error('mqtt_error', err);
      });

      _mqtt_client.on('message', function (topic, message, packet) {
        // Convert message from Uint8Array to String
        on_message(topic, message.toString());
      });
    });
  };

  exports.register = register;

  var deregister = function deregister(callback) {
    if (!_mqtt_client) return callback(true);
    publish(_ctrl_i, JSON.stringify({
      'state': 'deregister',
      'rev': _rev
    }));

    _mqtt_client.end();

    if (callback) return callback(true);
  };

  exports.deregister = deregister;

  var push = function push(idf_name, data) {
    if (!_mqtt_client || !_i_chans.topic(idf_name)) return;
    publish(_i_chans.topic(idf_name), JSON.stringify(data));
  };

  exports.push = push;

  var UUID = function UUID() {
    return _id ? _id : (0, _uuid.default)();
  };

  exports.UUID = UUID;

  var connected = function connected() {
    if (_typeof(_mqtt_client) !== 'object') return false;
    return _mqtt_client.connected;
  };

  exports.connected = connected;

  var reconnecting = function reconnecting() {
    if (_typeof(_mqtt_client) !== 'object') return false;
    return _mqtt_client.reconnecting;
  };

  exports.reconnecting = reconnecting;

  return {
    'register' : register,
    'deregister' : deregister,
    'connected': connected,
    'reconnecting': reconnecting,
    'UUID': UUID,
    'push': push
  };

});

exports.dan2 = dan2;