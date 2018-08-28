/**
 * Created by kuan on 2018/8/27.
 */
var dai = function (mac, no, answers) {

    var dan = require('./dan').dan(),
        config = require('./config'),
        IDFList = [];

        for(var i = 1; i <= answers.length; i++)
            IDFList.push("Button" + i.toString());

        var deregister = function(){
            dan.deregister();
        };
        var register = function() {

            var setAliases = function(){
                for(var i = 0; i < IDFList.length; i++) {
                    console.log("alias:" + answers[i].option);
                    dan.set_alias(IDFList[i], answers[i].option);
                }

            };
            var pull = function(ODFName, data){
                if(ODFName == "Control" && data[0] == "SET_DF_STATUS")
                    setTimeout(setAliases, 2000);
            };
            dan.init(pull, config.IoTalkIP, mac, {
                'dm_name': 'VotingMachine',
                'd_name': no.toString() + ".Voting",
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
        var push = function(answer){
            for(var i = 0; i < answers.length; i++)
                if(answers[i].option == answer.option)
                    dan.push(IDFList[i], [1]);
        };
        var getMac = function(){
            return mac;
        };
        return {
            'register': register,
            'deregister': deregister,
            'push': push,
            'mac': getMac()
        }
};

exports.dai = dai;






