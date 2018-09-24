var request = require('request');
var csmapi = (function () {
    var ENDPOINT;
    function set_endpoint (endpoint) {
        ENDPOINT = endpoint;
    }

    function get_endpoint () {
        return ENDPOINT;
    }

    function register (mac_addr, profile, callback) {

        var options = {
            url: ENDPOINT + '/' + mac_addr,
            method: 'POST',
            json: { 'profile': profile },
            headers:{
                'Content-Type': 'application/json; charset=utf-8',
            }
        };
        request(options, function(err, res, body){
            if(callback){
                if (!err && res.statusCode == 200) {
                    callback(true, body.password);
                    console.log(mac_addr, ' registed: ', body.password);
                }
                else{
                    callback(false, '');
                    console.log(body);
                }
            }
        });
    }
    function deregister (mac_addr, callback) {
        var options = {
            url: ENDPOINT + '/' + mac_addr,
            method:'DELETE',
            headers:{
                'Content-Type': 'application/json; charset=utf-8',
            }
        };
        request(options, function(err, res, body){
            if(callback){
                if (res.statusCode == 200) {
                    if(callback)
                        callback(true);
                }
                else{
                    if(callback)
                        callback(false);
                    console.log(body);
                }
            }
        });
    }
    function pull (mac_addr, password, odf_name, callback) {
        var options = {
            url: ENDPOINT + '/' + mac_addr + '/' + odf_name,
            method:'GET',
            headers:{
                'Content-Type': 'application/json; charset=utf-8',
                'password-key': password
            }
        };
        request(options, function(err, res, body){
            if(callback){
                if (res.statusCode == 200) {
                    if(callback){
                        body = JSON.parse(body);
                        callback(body['samples']);
                    }
                }
                else{
                    console.log(body);
                }
            }
        });
    }

    function push (mac_addr, password, idf_name, data, callback) {

        var options = {
            url: ENDPOINT + '/' + mac_addr + '/' + idf_name,
            method:'PUT',
            json:{'data': data},
            headers:{
                'Content-Type': 'application/json; charset=utf-8',
                'password-key': password
            }
        };
        request(options, function(err, res, body){
            if(callback){
                if (res.statusCode == 200) {
                    callback(true);
                }
                else{
                    callback(false);
                    console.log(body);
                }
            }
        });

    }
    function get_alias(mac_addr, df_name, callback){
        var options = {
            url: ENDPOINT + '/get_alias/' + mac_addr + '/' + df_name,
            method:'GET',
            headers:{
                'Content-Type': 'application/json; charset=utf-8',
            }
        };
        request(options, function(err, res, body){
            if(callback){
                if (res.statusCode == 200) {
                    if(callback){
                        body = JSON.parse(body);
                        callback(body['alias_name']);
                    }
                }
                else{
                    console.log(body);
                }
            }

        });
    }
    function set_alias(mac_addr, df_name, alias, callback){
        var options = {
            url:encodeURI(ENDPOINT + '/set_alias/' + mac_addr + '/' + df_name + '/alias?name=' + alias),
            method:'GET',
            headers:{
                'Content-Type': 'application/json; charset=utf-8',
            }
        };
        request(options, function(err, res, body){
            if(callback){
                if (res.statusCode == 200)
                    callback(true);
                else {
                    callback(false);
                    console.log(body);
                }
            }
        });
    }
    return {
        'set_endpoint': set_endpoint,
        'get_endpoint': get_endpoint,
        'register': register,
        'deregister': deregister,
        'pull': pull,
        'push': push,
        'get_alias': get_alias,
        'set_alias': set_alias,
    };
})();

exports.csmapi = csmapi;