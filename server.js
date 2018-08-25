var express = require('express'),
    app = express(),
    http = require('http').createServer(app),
    shortid = require('shortid'),
    config = require('./config'),
    io = require('socket.io')(http),
    fs = require('fs'),
    bodyParser = require('body-parser'),
    page = require('./page').page,
    models = require('./model').models;

//create tables
models.answer.sync({force: false}).then(function(){

});
models.question.sync({force: false}).then(function(){

});

app.use(express.static("./web"));
app.use(bodyParser.json());

app.get('/getRatio/*', function(req, res){
    var url = req.originalUrl.substr(1).split("/").pop().substr(0,16);
    models.question.findById(url).then(function(q) {
        if(q != null){
            models.answer.findAll({
                where:{
                    questionId: url
                }
            }).then(function(a){
                var ratio = [],
                    total = 0,
                    qRatio;
                a.forEach(function(answer){
                    total += answer.count;
                    ratio.push({
                        a: answer.option,
                        count: answer.count
                    });
                });
                qRatio = {
                    ratio: ratio,
                    total: total
                };
                page.getRatio(req, res, qRatio);
            });
        }
        else
            page.getBadRequest(req, res);
    });
});

app.post('/postQ', function(req, res){
    var id = req.body.id,
        description = req.body.question,
        answers = [];
    models.question.findById(id).then(function(object){
       if(object == null && //check id is not exist
           id.trim().length != 0 && //check id is not empty
           req.body.options.length != 0){ // check options is not empty
           for(var i = 0; i < req.body.options.length; i++)
               answers.push({
                   option: req.body.options[i],
                   count: 0
               });
           models.question.create({
               id: id,
               description: description,
               answers: answers
           }, {
               include: [models.answer]
           }).then(function(){
               page.getSuccess(req, res);
           });
       }
       else{
           page.getBadRequest(req, res);
       }
    });
});

app.get('/ctl', function(req, res){
    page.getVotingCtlPage(req, res);
});

app.get('/ctl/*', function(req, res){
    var url = req.originalUrl.substr(1).split("/").pop().substr(0,16);
    models.question.findById(url).then(function(q) {
        if(q != null){
            models.answer.findAll({
                where:{
                    questionId: url
                }
            }).then(function(a){
                var options = [];
                a.forEach(function(answer){
                    options.push(answer.option);
                });
                page.getDashBoardPage(req, res, {
                    q: q.description,
                    a: options
                });
            });
        }
        else
            page.getPageNotFound(req, res);
    });
});

app.get('/*', function(req, res) {
    var url = req.originalUrl.substr(1,16);
    console.log(url);
    models.question.findById(url).then(function(q){
        if(q != null){
            models.answer.findAll({
                where: {
                    questionId: url
                }
            }).then(function(a){
                var options = [];
                a.forEach(function(answer){
                    options.push(answer.option);
                });
                page.getVotingPage(req, res, {
                    q: q.description,
                    a: options
                });
            });
        }
        else
            page.getPageNotFound(req, res);
    });
});

http.listen((process.env.PORT || config.port), '0.0.0.0');