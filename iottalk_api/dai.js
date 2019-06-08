/**
 * Created by kuan on 2018/8/27.
 */

let dai = function (no, mac, answers) {
    let config = require('../config'),
        register = null,
        deregister = null,
        push = null;

    if(config.IoTtalkVersion === 1) {
        let dan = require('./dan').dan(),
            IDFList = [];

        for (let i = 1; i <= answers.length; i++)
            IDFList.push('Option' + i.toString());

        deregister = function (callback) {
            dan.deregister(callback);
        };

        register = function () {
            let setAliases = function () {
                for (let i = 0; i < IDFList.length; i++) {
                    dan.set_alias(IDFList[i], answers[i].option);
                    console.log(mac, ' set alias : ' + answers[i].option);
                }
            };
            let pull = function (ODFName, data) {
                if (ODFName === 'Control' && data[0] === 'SET_DF_STATUS')
                    setTimeout(setAliases, 2000);
            };
            dan.init(pull, config.IoTtalkURL, mac, {
                'dm_name': 'VotingMachine',
                'd_name': no + ".Voting",
                'u_name': 'yb',
                'is_sim': false,
                'df_list': IDFList
            }, function (result) {
                console.log('register:', result);
                //deregister when app is closing
                process.on('exit', () => {
                    dan.deregister(() => {
                        process.exit(1);
                    })
                });
                //catches ctrl+c event
                process.on('SIGINT', () => {
                    process.exit(1);
                });
                //catches uncaught exceptions
                process.on('uncaughtException', () => {
                    process.exit(1);
                });
            });

            push = function (answer) {
                for (let i = 0; i < answers.length; i++)
                    if (answers[i].option === answer.option)
                        dan.push(IDFList[i], [1]);
            };
        }
    }
    else if(config.IoTtalkVersion === 2){
        let dan2 = require('./dan2').dan2(),
            IDFList = [];

        for (let i = 1; i <= answers.length; i++) {
            IDFList.push(['Option' + i.toString(),['int']]);
        }

        deregister = function (callback) {
            dan2.deregister(callback);
        };

        let on_signal = function(cmd, param){
            console.log('[cmd]', cmd, param);
            return true;
        };

        let on_data = function(odf_name, data){
            console.log('[data]', odf_name, data);
        };

        register = function () {
            dan2.register(config.IoTtalkURL,{
                'id': mac,
                'on_signal': on_signal,
                'on_data': on_data,
                'idf_list': IDFList,
                'name': no + ".Voting",
                'profile': {
                    'model': 'VotingMachine',
                },
                'accept_protos': ['mqtt'],
            }, function(result){
                console.log('register:', result);
                //deregister when app is closing
                process.on('exit', () => {
                    dan2.deregister( () => {
                        process.exit(1);
                    })
                });
                //catches ctrl+c event
                process.on('SIGINT', () => {
                    process.exit(1);
                });
                //catches uncaught exceptions
                process.on('uncaughtException', () => {
                    process.exit(1);
                });
            });
        };

        push = function (answer) {
            for (let i = 0; i < answers.length; i++)
                if (answers[i].option === answer.option)
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
