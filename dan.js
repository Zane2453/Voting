
var csmapi = require('./csmapi').csmapi,
    http = require('http');

var dan = (function () {
    var RETRY_COUNT = 3;
    var RETRY_INTERVAL = 200;
    var POLLING_INTERVAL = 200;
    var _pull;
    var _mac_addr = '';
    var _profile = {};
    var _registered = false;
    var _df_list;
    var _df_selected = {};
    var _df_is_odf = {};
    var _df_timestamp = {};
    var _suspended = true;
    var _ctl_timestamp = '';

    function init (pull, endpoint, mac_addr, profile, callback) {
        _pull = pull;
        _mac_addr = mac_addr;
        function init_callback (result) {
            if (result) {
                callback(csmapi.get_endpoint());
            } else {
                callback('');
            }
        }

        register(endpoint, profile, init_callback);
    }

    function register (endpoint, profile, callback) {
        if(profile['d_name'] == undefined)
            profile['d_name'] =
                profile['dm_name'] + _mac_addr.slice(_mac_addr.length - 5);
        _profile = profile;
        csmapi.set_endpoint(endpoint);

        var retry_count = 0;
        function register_callback (result) {
            if (result) {
                //if (!_registered) {
                _registered = true;
                _df_list = profile['df_list'].slice();
                for (var i = 0; i < _df_list.length; i++) {
                    _df_selected[_df_list[i]] = false;
                    _df_is_odf[_df_list[i]] = true;
                    _df_timestamp[_df_list[i]] = '';
                    _ctl_timestamp = '';
                    _suspended = true;
                }
                setTimeout(pull_ctl, 0);
                //}
                callback(true);
            } else {
                if (retry_count < 2) {
                    retry_count += 1;
                    setTimeout(function () {
                        csmapi.register(_mac_addr, profile, register_callback);
                    }, RETRY_INTERVAL);
                } else {
                    callback(false);
                }
            }
        }

        csmapi.register(_mac_addr, profile, register_callback);
    }

    function pull_ctl () {
        if (!_registered) {
            return;
        }

        function pull_ctl_callback (dataset, error) {
            if (has_new_data(dataset, _ctl_timestamp)) {
                _ctl_timestamp = dataset[0][0];
                if (handle_command_message(dataset[0][1])) {
                    _pull('Control', dataset[0][1]);
                } else {
                    console.log('Problematic command message:', dataset[0][1]);
                }
            }

            pull_odf(0);
        }

        csmapi.pull(_mac_addr, '__Ctl_O__', pull_ctl_callback);
    }

    function pull_odf (index) {
        //console.log('odf' + index);
        if (!_registered) {
            return;
        }

        //if (_suspended || index >= _df_list.length) {
        if (index >= _df_list.length) {
            setTimeout(pull_ctl, POLLING_INTERVAL);
            return;
        }

        var _df_name = _df_list[index];

        if (!_df_is_odf[_df_name] || !_df_selected[_df_name]) {
            pull_odf(index + 1);
            return;
        }

        function pull_odf_callback (dataset, error) {
            if (has_new_data(dataset, _df_timestamp[_df_list[index]])) {
                _df_timestamp[_df_list[index]] = dataset[0][0];
                _pull(_df_list[index], dataset[0][1]);
            }

            pull_odf(index + 1);
        }
        csmapi.pull(_mac_addr, _df_name, pull_odf_callback);
    }

    function handle_command_message (data) {
        switch (data[0]) {
            case 'RESUME':
                _suspended = false;
                break;
            case 'SUSPEND':
                _suspended = true;
                console.log("suspended");
                break;
            case 'SET_DF_STATUS':
                flags = data[1]['cmd_params'][0]
                if (flags.length != _df_list.length) {
                    console.log(flags, _df_list);
                    return false;
                }

                for (var i = 0; i < _df_list.length; i++) {
                    _df_selected[_df_list[i]] = 1;
                    //_df_selected[_df_list[i]] = (flags[i] == '1');
                }
                break;
            default:
                console.log('Unknown command:', data);
                return false;
        }
        return true;
    }

    function has_new_data (dataset, timestamp) {
        if (dataset.length == 0 || timestamp == dataset[0][0]) {
            return false;
        }
        return true;
    }

    function push (idf_name, data, callback) {
        if (idf_name == 'Control') {
            idf_name = '__Ctl_I__';
        }
        _df_is_odf[idf_name] = false;
        if (idf_name == '__Ctl_I__' || _df_selected[idf_name]) {
            csmapi.push(_mac_addr, idf_name, data, callback);
        }
    }

    function deregister (callback) {
        _registered = false;
        csmapi.deregister(_mac_addr, callback);
    }
    function get_alias(df_name, callback){
        csmapi.get_alias(_mac_addr, df_name, callback);
    }
    function set_alias(df_name, alias){
        csmapi.set_alias(_mac_addr, df_name, alias);
    }
    return {
        'init': init,
        'register': register,
        'push': push,
        'deregister': deregister,
        'get_alias' : get_alias,
        'set_alias' : set_alias,
    };
});
exports.dan = dan;
