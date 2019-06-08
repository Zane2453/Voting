let fs = require('fs'),
    ejs = require('ejs'),
    config = require('./config'),
    votingPagePath = __dirname + "/web/html/Voting.ejs",
    votingCreatePagePath = __dirname + "/web/html/QuestionCreate.ejs",
    dashBoardPagePath = __dirname + "/web/html/DashBoard.ejs",
    loginPagePath = __dirname + "/web/html/Login.ejs",
    questionListPagePath = __dirname + "/web/html/QuestionList.ejs",
    adminQuestionListPagePath = __dirname + "/web/html/AdminQuestionList.ejs",
    questionEditPagePath = __dirname + "/web/html/QuestionEdit.ejs";

let Response = function () {};

Response.prototype = {
    
    getVotingPage : function (res, data) {
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
    getVotingCreatePage : function (res) {
        fs.readFile(votingCreatePagePath,
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
    getDashBoardPage : function (res, question, isadmin=false) {
        fs.readFile(dashBoardPagePath,
            function (err, contents) {
                if (err)
                    console.log(err);
                else {
                    contents = contents.toString('utf8');
                    res.writeHead(200, {"Content-Type": "text/html"});
                    res.end(ejs.render(contents, {
                        id: question.id,
                        q: question.q,
                        image: question.image,
                        a: question.a,
                        isadmin: isadmin
                    }));
                }
            }
        );
    },
    getLoginPage : function (res) {
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
    getQuestionListPage : function (res, qList) {
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
    getAdminQuestionListPage : function (res, qList) {
        fs.readFile(adminQuestionListPagePath,
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
    getQuestionEditPage : function (res, question) {
        var obj = Object.assign({},config.color, question);
        fs.readFile(questionEditPagePath,
            function (err, contents) {
                if (err)
                    console.log(err);
                else {
                    contents = contents.toString('utf8');
                    res.writeHead(200, {"Content-Type": "text/html"});
                    res.end(ejs.render(contents, obj));
                }
            }
        );
    },
    getSuccess: function(res){
        res.writeHead(200, {"Content-Type": "text/html"});
        res.end("success!");
    },
    getCreated: function(res, id){
        res.writeHead(200, {"Content-Type": "text/html"});
        res.end(JSON.stringify(id));
    },
    getRatio: function(res, data){
        res.writeHead(200, {"Content-Type": "application/json"});
        res.end(JSON.stringify(data));
    },
    getPageNotFound: function (res) {
        res.writeHead(404, {"Content-Type": "text/html"});
        res.end("page not found!");
    },
    getBadRequest: function(res){
        res.writeHead(400, {"Content-Type": "text/html"});
        res.end("bad request!");
    },
    getPermissionDenied: function(res){
        res.writeHead(403, {"Content-Type": "text/html"});
        res.end("permission denied!");
    },
    getConflict: function(res){
        res.writeHead(409, {"Content-Type": "text/html"});
        res.end("conflict!");
    },
};

exports.response = new Response();


