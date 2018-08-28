var express = require('express'),
    app = express(),
    http = require('http').createServer(app),
    shortid = require('shortid'),
    config = require('./config'),
    io = require('socket.io')(http),
    fs = require('fs'),
    bodyParser = require('body-parser'),
    page = require('./page').page,
    models = require('./model').models,
    dai = require('./dai').dai,
    daList = [];

//create tables
models.answer.sync({force: false}).then(function(){

});
models.question.sync({force: false}).then(function(){

});

app.use(express.static("./web"));
app.use(bodyParser.json());

app.get('/getRatio/*', function(req, res){
    var id = req.originalUrl.substr(1).split("/").pop().substr(0,16);
    models.answer.findAll({
        where:{
            questionId: id
        }
    }).then(function(a){
        var ratio = [],
            total = 0,
            qRatio;
        if(a != null) {
            a.forEach(function (answer) {
                total += answer.count;
                ratio.push({
                    a: answer.option,
                    color: answer.color,
                    count: answer.count
                });
            });
            qRatio = {
                ratio: ratio,
                total: total
            };
            page.getRatio(req, res, qRatio);
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
                   option: req.body.options[i].description,
                   color: req.body.options[i].color,
                   count: 0
               });

           models.question.count().then(function(c){
              var q = {
                  id: id,
                  no: c+1,
                  description: description,
                  answers: answers
              };
              models.question.create(q, {
                  include: [models.answer]
              }).then(function(){
                  var d = dai(id, q.no, answers);
                  daList.push(d);
                  d.register();
                  page.getSuccess(req, res);
              });
           });
       }
       else{
           page.getBadRequest(req, res);
       }
    });
});
app.post('/postA', function(req, res){
    var id = req.body.id,
        color = req.body.color;
    models.answer.findOne({
        where:{
            color: color,
            questionId: id
        }
    }).then(function(a){
        if(a != null){
            a.increment(['count'],{ by :1});
            for(var i = 0; i < daList.length; i++)
                if(daList[i].mac == id)
                    daList[i].push(a);
            page.getSuccess(req, res);
        }
        else
            page.getBadRequest(req, res);
    });

});
app.get('/ctl', function(req, res){
    page.getVotingCtlPage(req, res);
});

app.get('/ctl/*', function(req, res){

    var component = req.originalUrl.split("/");
    for(var i = component.length-1; i >= 0 ; i--)
        if(component[i] != "")
            break;
    var id = component[i].substr(0,16);
    models.question.findById(id).then(function(q) {
        if(q != null){
            models.answer.findAll({
                where:{
                    questionId: id
                }
            }).then(function(a){
                var options = [];
                a.forEach(function(answer){
                    options.push(answer.option);
                });
                page.getDashBoardPage(req, res, {
                    q: q.description,
                    no: q.no,
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
                    options.push({
                        description: answer.option,
                        color: answer.color
                    });
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