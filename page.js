var fs = require('fs'),
    ejs = require('ejs'),
    config = require('./config'),
    votingPagePath = __dirname + "/web/html/Voting.ejs",
    votingControlPagePath = __dirname + "/web/html/VotingCtl.ejs",
    dashBoardPagePath = __dirname + "/web/html/dashBoard.ejs";

var Page = function () {};

Page.prototype = {
    
    getVotingPage : function (req, res, question) {
        /*
            question = {
                q: "",
                a: []
            }
        */
        fs.readFile(votingPagePath,
            function (err, contents) {
                if (err)
                    console.log(err);
                else {
                    contents = contents.toString('utf8');
                    res.writeHead(200, {"Content-Type": "text/html"});
                    console.log(question);
                    res.end(ejs.render(contents, {q: question.q, a: question.a}));
                }
            }
        );
    },
    getVotingCtlPage : function (req, res) {
        fs.readFile(votingControlPagePath,
            function (err, contents) {
                if (err)
                    console.log(err);
                else {
                    contents = contents.toString('utf8');
                    res.writeHead(200, {"Content-Type": "text/html"});
                    res.end(ejs.render(contents, config.color));
                }
            }
        );   
    },
    getDashBoardPage : function (req, res, question) {
        fs.readFile(dashBoardPagePath,
            function (err, contents) {
                if (err)
                    console.log(err);
                else {
                    contents = contents.toString('utf8');
                    res.writeHead(200, {"Content-Type": "text/html"});
                    res.end(ejs.render(contents, {
                        q: question.q,
                        no: question.no,
                        a: question.a
                    }));
                }
            }
        );
    },
    getSuccess: function(req, res){
        res.writeHead(200, {"Content-Type": "text/html"});
        res.end("success!");
    },
    getRatio: function(req, res, data){
        res.writeHead(200, {"Content-Type": "application/json"});
        res.end(JSON.stringify(data));
    },
    getPageNotFound: function (req, res) {
        res.writeHead(404, {"Content-Type": "text/html"});
        res.end("page not found!");
    },
    getBadRequest: function(req, res){
        res.writeHead(400, {"Content-Type": "text/html"});
        res.end("fail!");
    }
};

exports.page = new Page();


