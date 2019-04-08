var fs = require('fs'),
    ejs = require('ejs'),
    config = require('./config'),
    votingPagePath = __dirname + "/web/html/Voting.ejs",
    votingControlPagePath = __dirname + "/web/html/VotingCtl.ejs",
    dashBoardPagePath = __dirname + "/web/html/DashBoard.ejs",
    loginPagePath = __dirname + "/web/html/Login.ejs",
    questionListPagePath = __dirname + "/web/html/QuestionList.ejs";

var Page = function () {};

Page.prototype = {
    
    getVotingPage : function (req, res, data) {
        fs.readFile(votingPagePath,
            function (err, contents) {
                if (err)
                    console.log(err);
                else {
                    contents = contents.toString('utf8');
                    res.writeHead(200, {"Content-Type": "text/html"});
                    res.end(ejs.render(contents, data));
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
                        image: question.image,
                        a: question.a
                    }));
                }
            }
        );
    },
    getLoginPage : function (req, res) {
        fs.readFile(loginPagePath,
            function (err, contents) {
                if (err)
                    console.log(err);
                else {
                    contents = contents.toString('utf8');
                    res.writeHead(200, {"Content-Type": "text/html"});
                    res.end(contents);
                }
            }
        );
    },
    getQuestionListPage : function (req, res, qList) {
        fs.readFile(questionListPagePath,
            function (err, contents) {
                if (err)
                    console.log(err);
                else {
                    contents = contents.toString('utf8');
                    res.writeHead(200, {"Content-Type": "text/html"});
                    res.end(ejs.render(contents, {qList: qList}));
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
        res.end("bad request!");
    },
    getPermissionDenied: function(req, res){
        res.writeHead(403, {"Content-Type": "text/html"});
        res.end("permission denied!");
    },
};

exports.page = new Page();


