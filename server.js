let config = require('./config'),
    express = require('express'),
    app = express(),
    redirectApp = express(),
    server =  (config.https) ?
        require('https').createServer(config.httpServerOptions, app) :
        require('http').createServer(app),
    httpRedirectServer = (config.https) ?
        require('http').createServer(redirectApp) : null,
    socketIo = require('socket.io')(server),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    expressSession = require('express-session'),
    response = require('./response').response,
    basicAuth = require('basic-auth'),
    models = require('./db_model').models,
    /*dai = require('./iottalk_api/dai').dai,
    daList = [],*/
    dan2 = require('./iottalk_api/dan2').dan2(),
    genUUID = require('./iottalk_api/uuid'),
    favicon = require('serve-favicon');


if(config.https) {
    server.listen(config.httpsPort, '0.0.0.0');
    httpRedirectServer.listen(config.httpPort, '0.0.0.0');
    redirectApp.get('*', function(req, res) {
        res.redirect('https://' + req.headers.host + req.url);
    });
}
else
    server.listen(config.httpPort, '0.0.0.0');

// Create tables
models.questionnaire.sync({force: false}).then(function(){});
models.answer.sync({force: false}).then(function(){});
models.question.sync({force: false}).then(function(){});
models.user.sync({force: false}).then(function(){});
models.vote.sync({force: false}).then(function(){});

// Register all questions in the DB
/*models.question.findAll({ include: [models.answer] })
    .then((question) => {
        question.forEach( function (q) {
            let d = dai(q.dataValues.id, q.dataValues.uuid, q.dataValues.answers);
            daList.push(d);
            d.register();
            console.log("Register ID:" + q.dataValues.uuid + ", " +
                        "Description:" + q.dataValues.description);
        });
    });
*/

// Express middleware
app.use(express.static('./web'));
app.use(favicon('./web/images/favicon.ico'));
app.use(cookieParser());
app.use(bodyParser.json({}));
app.use(expressSession({
    secret: genUUID.default(),
    resave: true,
    saveUninitialized: true
}));
// OAuth
require('./oauth.js')(app, config);

// Admin API/Page basic auth
let bAuth = function(req, res, next){
    let user = basicAuth(req);
    if(!user || !user.name || !user.pass){
        res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
        res.sendStatus(401);
        return;
    }
    if(user.name === config.adminAccount && user.pass === config.adminPassword){
        next();
    }
    else{
        res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
        res.sendStatus(401);
    }
};

// default Questionnaire ID (first one)
var QusetionnaireID_def = undefined;
models.questionnaire.findAll()
    .then( (qn) => {
        if(qn != null)
            QusetionnaireID_def = (qn[0].id).toString();
    });

// RESTful API
let getR = function(req, res){
        let login = (req.user !== undefined),
            id = req.params.id,
            questionIdx = req.params.questionIdx,
            queryObj = {},
            qRatio = {},
            IoT_json = {questionId: -1, percentage:[]};
        models.questionnaire.findByPk(id)
            .then( (qn) => {
                if(qn != null) {
                    if(!qn.anonymous && !login)
                        return Promise.reject(403);
                    queryObj = {questionnaireId: id};
                    return models.question.findAll({where: queryObj});
                }
                else
                    return Promise.reject(404);
            })
            .then( (q) => {
                if( q != null){
                    if(q.length > questionIdx) {
                        queryObj = {questionId: q[questionIdx].id};
                        IoT_json.questionId = parseInt(questionIdx)+1;
                        return models.answer.findAll({where: queryObj});
                    }
                }
                return Promise.reject(404);
            })
            .then((a) => {
                let ratio = [],
                    total = 0;
                if(a != null) {
                    a.forEach(function (answer) {
                        total += answer.count;
                        IoT_json.percentage.push(answer.count);
                        ratio.push({
                            a: answer.description,
                            // reply answer's id
                            aid: answer.id,
                            count: answer.count
                        });
                    });
                    qRatio = {
                        ratio: ratio,
                        total: total
                    };
                    if (total!=0){
                        for(i=0; i<IoT_json.percentage.length; i++)
                            IoT_json.percentage[i] = Math.round(IoT_json.percentage[i] * 100 / total);
                    }
                    return Promise.reject(200);
                }
                else
                    return Promise.reject(404);
            })
            .catch((code) => {
                if(code == 404)
                    response.getPageNotFound(res);
                else if(code == 403)
                    response.getPermissionDenied(res);
                else if(code == 200){
                    dan2.push('Result-I', [JSON.stringify(IoT_json)]);
                    console.log("[da] push Result-I", JSON.stringify(IoT_json));
                    response.getRatio(res, qRatio);
                }
            });
    },
    getNxtQ = function(req, res){
        let login = (req.user !== undefined),
            id = req.params.id,
            questionIdx = req.params.questionIdx,
            queryObj = {},
            nextQ = {};
        models.questionnaire.findByPk(id)
            .then( (qn) => {
                if(qn != null) {
                    if(!qn.anonymous && !login)
                        return Promise.reject(403);
                    queryObj = {questionnaireId: id};
                    return models.question.findAll({where: queryObj});
                }
                else
                    return Promise.reject(404);
            })
            .then( (q) => {
                if( q != null){
                    if(q.length > questionIdx) {
                        nextQ["question"] = {
                            description: q[questionIdx].description,
                            questionIdx: questionIdx
                        };
                        queryObj = {questionId: q[questionIdx].id};
                        return models.answer.findAll({where: queryObj});
                    }
                    else{
                        nextQ["question"] = {
                            questionIdx: questionIdx-1
                        };
                        return Promise.reject(200);
                    }
                }
                return Promise.reject(404);
            })
            .then((a) => {
                if(a != null) {
                    nextQ["options"] = [];
                    a.forEach(function(o){
                        nextQ["options"].push({
                            description: o.description,
                            color: o.color,
                            //reply answer's id
                            aid: o.id
                        });
                    });
                    return Promise.reject(200);
                }
                return Promise.reject(404);
            })
            .catch( (code) => {
                if(code == 404)
                    response.getPageNotFound(res);
                else if(code == 403)
                    response.getPermissionDenied(res);
                else if(code == 200)
                    response.getNextQuestion(res, nextQ);
            })
    },
    postQN = function(req, res){
        if(req.body.questions.length !== 0){ //Todo: json schema
            req.body.uuid = genUUID.default();
            models.questionnaire.create(req.body, {
                include:[
                    {   model: models.question,
                        include: [models.answer]}]})
                .then((qn) => {
                    /*let d = dai(q.dataValues.id, q.dataValues.uuid, q.dataValues.answers);
                    daList.push(d);
                    d.register();*/
                    response.getCreated(res, qn.dataValues.id);
                });
        }
        else
            response.getBadRequest(res);
    },
    resetQN = function (req, res) {
        let questionIdx = req.body.questionnaireId;
        QusetionnaireID_def = questionIdx;
        response.getSuccess(res);
    },
    postA = function (req, res) {
        let id = req.body.id,
            questionIdx = req.body.questionIdx,
            aid = req.body.aid,
            //color = req.body.color,
            login = (req.user !== undefined),
            queryObj,
            questionnaire,
            question,
            answer;
        models.questionnaire.findByPk(id)
            .then((qn) => {
                questionnaire = qn;
                if(qn){
                    queryObj = { questionnaireId: id };
                    return models.question.findAll({
                        where: queryObj,
                        order: [['id', 'ASC']]
                    });
                }
                return Promise.reject(404);
            })
            .then((q) => {
                question = q;
                if((q != null) && (q.length > questionIdx)) {
                    queryObj = { questionId: q[questionIdx].id , id: aid};
                    return models.answer.findOne({ where: queryObj });
                }
                return Promise.reject(404);
            })
            .then( (a) => {
                answer = a;
                if (!questionnaire.anonymous && login) {
                    queryObj = { question: question.id, userId: req.user.id };
                    return models.vote.findOne({ where: queryObj });
                }
                else if (!questionnaire.anonymous && !login)
                    return Promise.reject(401);
                else if (questionnaire.anonymous) {
                    a.increment(['count'], {by: 1});
                    return Promise.reject(200);
                }
            })
            .then((v) => {
                if (v == null){
                    answer.increment(['count'],{ by :1});
                    models.vote.create({
                        userId: req.user.id,
                        questionId: id,
                        answerId: answer.id
                    });
                    return Promise.reject(200);
                }
                return Promise.reject(409);
            })
            .catch((code) => {
                if(code === 200) {
                    /*for (let i = 0; i < daList.length; i++)
                       if (daList[i].mac === questionnaire.uuid)
                           daList[i].push(a);
                    */
                    response.getSuccess(res);
                }
                else if(code === 401)
                    response.getPermissionDenied(res);
                else if(code === 404)
                    response.getPageNotFound(res);
                else if(code === 409)
                    response.getConflict(res);
            });
    };
    // postQ = function(req, res){
    //     if(req.body.answers.length !== 0){ //Todo: json schema
    //         req.body.uuid = genUUID.default();
    //         console.log(req.body.anonymous);
    //         models.question.create(req.body, { include: [models.answer] })
    //             .then((q) => {
    //                // let d = dai(q.dataValues.id, q.dataValues.uuid, q.dataValues.answers);
    //                 //daList.push(d);
    //                 //d.register();
    //                 response.getCreated(res, q.dataValues.id);
    //             });
    //     }
    //     else
    //         response.getBadRequest(res);
    // },
    // updateQ = function(req, res){
    //     let id = req.body.id,
    //         description = req.body.description,
    //         anonymous = req.body.anonymous,
    //         image = req.body.image,
    //         question,
    //         answers = req.body.answers;
    //     console.log(req.body);
    //     models.question.findByPk(id)
    //         .then((q) => {
    //             if (q != null && //check id is exist
    //                 id.trim().length !== 0 && //check id is not empty
    //                 req.body.answers.length !== 0) { // check options is not empty
    //                 question = q;
    //                 return models.answer.destroy({ where: { questionId: id}, force: true});
    //             }
    //             else
    //                 Promise.reject(404);
    //         })
    //         .then(() => {
    //             answers.map(answer => answer.questionId = id)
    //             return models.answer.bulkCreate(answers);
    //         })
    //         .then(() => {
    //             let updateInfo = {
    //                 description: description,
    //                 anonymous: anonymous,
    //                 image: image,
    //             };
    //             return models.question.update(updateInfo, { where: {id: id}});
    //         })
    //         .then(() => {
    //             let d = dai(id, question.uuid, answers);
    //             daList.push(d);
    //             d.register();
    //             response.getSuccess(res);
    //         })
    //         .catch((code) => {
    //             if(code === 404)
    //                 response.getPageNotFound(res);
    //         });
    // },
    // deleteQ = function(req, res){
    //     let id = req.body.id;
    //     models.question.destroy({ where: { id: id }, force:true })
    //         .then(() => {
    //             response.getSuccess(res);
    //         });
    // };

app.get('/getR/:id([0-9]+)/:questionIdx([0-9]+)', getR);
app.get('/getNxtQ/:id([0-9]+)/:questionIdx([0-9]+)', getNxtQ);
app.post('/postA', postA);
app.post('/postQN', postQN);
app.post('/admin/resetQN', bAuth, resetQN);
// app.post('/postQ', postQ);
// app.post('/admin/updateQ', bAuth, updateQ);
// app.post('/admin/deleteQ', bAuth, deleteQ);

// Page route
let index = function(req, res){
        if(QusetionnaireID_def != undefined){
            // auto to do redirect
            res.redirect('/vote/'+QusetionnaireID_def);
        }
        else{
            // list all question
            models.question.findAll()
                .then((qList) => {
                    response.getQuestionListPage(res, qList);
                });
        }
    },
    create = function(req, res){
        response.getVotingCreatePage(res);
    },
    dashboard = function(req, res){
        let question,
            queryObj;
        models.question.findByPk(req.params.id)
            .then((q) => {
                question = q;
                if(q != null) {
                    queryObj = {questionId: req.params.id};
                    return models.answer.findAll({where: queryObj});
                }
                else
                    return Promise.reject(404);
            })
            .then((a) => {
                let options = [];
                a.forEach(function(answer){
                    options.push(answer.option);
                });
                response.getDashBoardPage(res, {
                    id: req.params.id,
                    q: question.description,
                    image: question.image,
                    a: options
                });
            })
            .catch((code) => {
                if(code === 404)
                    response.getPageNotFound(res);
            });
    },
    login = function(req, res){
        response.getLoginPage(res);
    },
    vote = function(req, res) {
        let id = req.params.id,
            login = (req.user !== undefined),
            options,
            questionnaire,
            question,
            answer,
            vote = null,
            voteAnswer,
            queryObj;
        models.questionnaire.findByPk(id)
            .then( (qn) => {
                questionnaire = qn;
                queryObj = {questionnaireId: id};
                if(qn == null)
                    return Promise.reject(404);
                else if(!qn.anonymous && !login)
                     return Promise.reject(200);
                else {
                    return models.question.findAll({
                        where: queryObj,
                        order: [['id', 'ASC']]
                    });
                }
            })
            .then( (q) => {
                if(q == null)
                    return Promise.reject(404);
                else{
                    question = q[0];
                    queryObj = {questionId: q[0].id};
                    return models.answer.findAll({where: queryObj});
                }
            })
            .then( (a) => {
                options = [];
                answer = a;
                a.forEach((answer) => {
                    options.push({description: answer.description, color: answer.color});
                });
                if(questionnaire.anonymous && !login) {
                    return Promise.reject(200);
                }
                else if(questionnaire.anonymous && login){
                    return Promise.reject(200);
                }
                else if(!questionnaire.anonymous && login){
                    queryObj = { questionId: question.id, userId: req.user.id};
                    return models.vote.findOne({ where: queryObj });
                }
            })
            .then( (v) => {
                vote = v;
                if(v != null)
                    return models.answer.findByPk(v.answerId);
                else
                    return Promise.reject(200);
            })
            .then( (va) => {
                voteAnswer = va;
                return Promise.reject(200);
            })
            .catch( (code) => {
                if(code === 404)
                    response.getPageNotFound(res);
                if(code === 200){
                   if(questionnaire.anonymous && !login){
                        response.getVotingPage(res, {
                            q: question.description,
                            anonymous: questionnaire.anonymous,
                            o: options,
                            useDisqus: config.useDisqus
                        });
                   }
                   else if(questionnaire.anonymous && login){
                       response.getVotingPage(res, {
                           q: question.description,
                           anonymous: questionnaire.anonymous,
                           o: options,
                           useDisqus: config.useDisqus
                       });
                   }
                   else if(!questionnaire.anonymous && login && !vote){
                       response.getVotingPage(res, {
                           q: question.description,
                           anonymous: questionnaire.anonymous,
                           o: options,
                           n: req.user.name,
                           p: req.user.photo,
                           useDisqus: config.useDisqus
                       });
                    }
                   else if(!questionnaire.anonymous && login && vote){
                       response.getVotingPage(res, {
                           q: question.description,
                           anonymous: questionnaire.anonymous,
                           o: options,
                           va: voteAnswer.description,
                           n: req.user.name,
                           p: req.user.photo,
                           useDisqus: config.useDisqus
                       });
                   }
                   else if(!questionnaire.anonymous && !login){
                       req.session.returnTo = req.path;
                       res.redirect('/login');
                   }
                }
            });
    },
    admin = function(req, res){
        // models.question.findAll()
        //     .then((qList) => {
        //         response.getAdminQuestionListPage(res, qList);
        //     });
        models.questionnaire.findAll()
            .then((qnList) => {
                response.getAdminQuestionnaireListPage(res, qnList, QusetionnaireID_def);
            });
    },
    adminEdit = function(req, res){
        let queryObj,
            question;
        models.question.findByPk(req.params.id)
            .then((q) => {
                question = q;
                if(q != null){
                    queryObj = { questionId: req.params.id };
                    return models.answer.findAll({ where: queryObj });
                }
                else
                    return Promise.reject(404);
            })
            .then((a) => {
                let options = new Array(10);
                options.fill(null);
                a.forEach( (answer) => {
                    let color = Object.values(config.color);
                    color.forEach( (c, idx) => {
                        if(c === answer.color)
                            options[idx] = answer.description;
                    });
                });
                response.getQuestionEditPage(res, {
                    q: question.description,
                    image: question.image,
                    a: options,
                    anonymous: question.anonymous
                });
            })
            .catch( (code) => {
                if(code === 404)
                    response.getPageNotFound(res);
            })
    },
    adminquestion = function(req, res){
        let questionnaireId = req.params.id,
            queryObj = { questionnaireId: questionnaireId };
        models.question.findAll({ where: queryObj })
            .then((qList) => {
                response.getAdminQuestionListPage(res, qList);
            });
    },
    adminPolling = function(req, res){
        response.getAdminPollingPage(res);
    };

app.get('^/index(/){0,1}$|^/$', index);
app.get('^/create(/){0,1}$', create);
app.get('^/dashboard/:id([0-9]+)(/){0,1}$', dashboard);
app.get('^/login(/){0,1}$', login);
app.get('^/vote/:id([0-9]+)(/){0,1}$', vote);
app.get('^/admin(/){0,1}$', bAuth, admin);
app.get('^/admin/questionnaire/:id([0-9]+)(/){0,1}$', bAuth, adminquestion);
app.get('^/admin/edit/:id([0-9]+)(/){0,1}$', bAuth, adminEdit);
app.get('^/admin/polling(/){0,1}$|^/$', bAuth, adminPolling);

/*--------------------------------------------------------------------------------*/
/* Socket.io API for the show */
let curQuestionnaireIdx,
    curQuestionIdx,
    pauseVoted=false;
socketIo.on('connection', function(socket) {
    socket.on('START', (questionnaireIdx) => {
        curQuestionnaireIdx = questionnaireIdx;
        curQuestionIdx = 0;
        socketIo.emit('START', {
            questionnaireIdx: curQuestionnaireIdx,
                questionIdx: curQuestionIdx
        });
    });
    socket.on('NEXT', (qIdx) => {
        pauseVoted=false;
        if(!qIdx){
            curQuestionIdx++;
        }else{
            curQuestionIdx = qIdx;
        }
        socketIo.emit('NEXT', {
            questionnaireIdx: curQuestionnaireIdx,
            questionIdx: curQuestionIdx,
            pauseVoted: pauseVoted
        });
    });
    socket.on('CUR_Q', () => {
        socketIo.emit('CUR_Q', {
            questionnaireIdx: curQuestionnaireIdx,
            questionIdx: curQuestionIdx,
            pauseVoted: pauseVoted 
        });
    });
    socket.on('PAUSE', () => {
        pauseVoted=true;
        socketIo.emit('PAUSE', {
            questionnaireIdx: curQuestionnaireIdx,
            questionIdx: curQuestionIdx
        });
    });
});

opt = {
    secure:true,
    reconnect: true,
    rejectUnauthorized : false
    };

if(config.https) {
    var socketclient = require('socket.io-client')('https://localhost',opt);
}
else
    var socketclient = require('socket.io-client')('http://localhost');

let pollStart = function(req, res){
    socketclient.emit('START', req.params.id);
    res.send({"curQuestion": curQuestionIdx});
}
let pollNext = function(req, res){
    nextQId = (req.params.id == undefined) ? parseInt(curQuestionIdx)+1 : req.params.id;
    if(req.params.id == undefined){
        socketclient.emit('NEXT');
    }
    else{
        socketclient.emit('NEXT', req.params.id);
    }
    res.send({"curQuestion": nextQId});
}
let pollPause = function(req, res){
    socketclient.emit('PAUSE');
    res.send({"curQuestion": curQuestionIdx});
}

app.get('/pollstart/:id([0-9]+)(/){0,1}', pollStart);
app.get('/pollnext(/){0,1}(:id([0-9]+)(/){0,1})?', pollNext);
app.get('/pollpause(/){0,1}', pollPause);

/*--------------------------------------------------------------------------------*/
/* IoTtalk Setting */
let IDFList = [
        ['Result-I', ['string']]
    ],
    ODFList = [
        ['Start-O', ['int']],
        ['Next-O', ['int']]
    ];
    
function on_signal(cmd, param){
    console.log('[cmd]', cmd, param);
    return true;
}

function on_data(odf_name, data){
    console.log('[data]', odf_name, data);

    switch(odf_name){
        case "Start-O":
            if(data[0] == 1)
                socketclient.emit('START', QusetionnaireID_def);
            break;
        case "Next-O":
            if(data[0] == 1)
                socketclient.emit('NEXT');
            break;
        default:
            break;
    }
}

function init_callback(result) {
    console.log('[da] register:', result);
}

dan2.register(config.IoTtalkURL, {
    'name': "1.Voting",
    'on_signal': on_signal,
    'on_data': on_data,
    'idf_list': IDFList,
    'odf_list': ODFList,
    'profile': {
        'model': 'VotingMachine',
    },
    'accept_protos': ['mqtt'],
}, init_callback);
