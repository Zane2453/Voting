/**
 * Created by kuan on 2018/8/27.
 */

var dai = function (mac, no, answers) {
    var config = require('./config');
    if(config.IoTtalkVersion == 1) {
        var dan = require('./dan').dan(),
            IDFList = [];

        for (var i = 1; i <= answers.length; i++)
            IDFList.push('Option' + i.toString());

        var deregister = function () {
            dan.deregister();
        };

        var register = function () {
            var setAliases = function () {
                for (var i = 0; i < IDFList.length; i++) {
                    dan.set_alias(IDFList[i], answers[i].option);
                    console.log(mac, ' set alias : ' + answers[i].option);
                }
            };
            var pull = function (ODFName, data) {
                if (ODFName == 'Control' && data[0] == 'SET_DF_STATUS')
                    setTimeout(setAliases, 2000);
                    pushRaw();
                }
            };
            dan.init(pull, config.IoTtalkURL, mac, {
                'dm_name': 'VotingMachine',
                'd_name': "Voting." + mac,
                'u_name': 'yb',
                'is_sim': false,
                'df_list': IDFList
            }, function (result) {
                console.log('register:', result);
                //deregister when app is closing
                process.on('exit', dan.deregister);
                //catches ctrl+c event
                process.on('SIGINT', function () {
                    dan.deregister(function () {
                        process.exit(1);
                    });
                });
                //catches uncaught exceptions
                process.on('uncaughtException', dan.deregister);
            });
        };
        var push = function (answer) {
            for (var i = 0; i < answers.length; i++)
                if (answers[i].option == answer.option)
                    dan.push(IDFList[i], [1]);
        };
    }
    else if(config.IoTtalkVersion == 2){
        var dan2 = require('./dan2').dan2(),
            IDFList = [];

        for (var i = 1; i <= answers.length; i++) {
            IDFList.push(['Option' + i.toString(),['int']]);
        }

        var deregister = function () {
            dan2.deregister();
        };

        var on_signal = function(cmd, param){
            console.log('[cmd]', cmd, param);
            return true;
        };

        var on_data = function(odf_name, data){
            console.log('[data]', odf_name, data);
        };

        var register = function () {
            dan2.register(config.IoTtalkURL,{
                'id': mac,
                'on_signal': on_signal,
                'on_data': on_data,
                'idf_list': IDFList,
                'name': no.toString() + ".Voting",
                'profile': {
                    'model': 'VotingMachine',
                },
                'accept_protos': ['mqtt'],
            }, function(result){
                console.log('register:', result);
                //deregister when app is closing
                process.on('exit', dan2.deregister);
                //catches ctrl+c event
                process.on('SIGINT', function () {
                    dan2.deregister(function () {
                        process.exit(1);
                    });
                });
                //catches uncaught exceptions
                process.on('uncaughtException', dan2.deregister);
            });
        };

        var push = function (answer) {
            for (var i = 0; i < answers.length; i++)
                if (answers[i].option == answer.option)
                    dan2.push(IDFList[i][0], [1]);
        };
    }
    return {
        'register': register,
        'deregister': deregister,
        'push': push,
        'mac': mac
    }
};

exports.dai = dai;






