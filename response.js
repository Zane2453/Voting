let fs = require('fs'),
    ejs = require('ejs'),
    config = require('./config'),
    votingPagePath = __dirname + "/web/html/Voting.ejs",
    votingCreatePagePath = __dirname + "/web/html/QuestionCreate.ejs",
    dashBoardPagePath = __dirname + "/web/html/DashBoard.ejs",
    loginPagePath = __dirname + "/web/html/Login.ejs",
    questionListPagePath = __dirname + "/web/html/QuestionList.ejs",
    adminQuestionListPagePath = __dirname + "/web/html/AdminQuestionList.ejs",
    questionEditPagePath = __dirname + "/web/html/QuestionEdit.ejs",
    AdminPollingPagePath = __dirname + "/web/html/AdminPolling.html",
    votingPage = fs.readFileSync(votingPagePath, 'utf8'),
    votingCreatePage = fs.readFileSync(votingCreatePagePath, 'utf8'),
    dashBoardPage = fs.readFileSync(dashBoardPagePath, 'utf8'),
    loginPage = fs.readFileSync(loginPagePath, 'utf8'),
    questionListPage = fs.readFileSync(questionListPagePath, 'utf8'),
    adminQuestionListPage = fs.readFileSync(adminQuestionListPagePath, 'utf8'),
    questionEditPage = fs.readFileSync(questionEditPagePath, 'utf8'),
    adminPollingPage = fs.readFileSync(AdminPollingPagePath, 'utf8');

let Response = function () {};

Response.prototype = {
    
    getVotingPage : function (res, data) {
        res.writeHead(200, {"Content-Type": "text/html"});
        res.end(ejs.render(votingPage, data));
    },
    getVotingCreatePage : function (res) {
        res.writeHead(200, {"Content-Type": "text/html"});
        res.end(ejs.render(votingCreatePage, config.color));
    },
    getDashBoardPage : function (res, question, isadmin=false) {
        res.writeHead(200, {"Content-Type": "text/html"});
        res.end(ejs.render(dashBoardPage, {
            id: question.id,
            q: question.q,
            image: question.image,
            a: question.a,
            isadmin: isadmin
        }));
    },
    getLoginPage : function (res) {
        res.writeHead(200, {"Content-Type": "text/html"});
        res.end(loginPage);
    },
    getQuestionListPage : function (res, qList) {
        res.writeHead(200, {"Content-Type": "text/html"});
        res.end(ejs.render(questionListPage, {qList: qList}));
    },
    getAdminQuestionListPage : function (res, qList) {
        res.writeHead(200, {"Content-Type": "text/html"});
        res.end(ejs.render(adminQuestionListPage, {qList: qList}));
    },
    getQuestionEditPage : function (res, question) {
        let obj = Object.assign({},config.color, question);
        res.writeHead(200, {"Content-Type": "text/html"});
        res.end(ejs.render(questionEditPage, obj));
    },
    getAdminPollingPage : function(res){
        res.writeHead(200, {"Content-Type": "text/html"});
        res.end(adminPollingPage);
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
    getNextQuestion: function(res, nextQ){
        res.writeHead(200, {"Content-Type": "application/json"});
        res.end(JSON.stringify(nextQ));
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


