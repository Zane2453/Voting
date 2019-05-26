let config = require('./config'),
    express = require('express'),
    app = express(),
    httpServer =  (config.https) ?
        require('https').createServer(config.httpServerOptions,app) :
        require('http').createServer(app),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    expressSession = require('express-session'),
    response = require('./response').response,
    basicAuth = require('basic-auth'),
    models = require('./db_model').models,
    dai = require('./iottalk_api/dai').dai,
    daList = [],
    genUUID = require('./iottalk_api/uuid');


httpServer.listen((process.env.PORT || config.port), '0.0.0.0');

// Create tables
models.answer.sync({force: false}).then(function(){});
models.question.sync({force: false}).then(function(){});
models.user.sync({force: false}).then(function(){});
models.vote.sync({force: false}).then(function(){});

// To-Do
// Register questions in the DB

// Express middleware
app.use(express.static('./web'));
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

// RESTful API
let getR = function(req, res){
        let queryObj = { questionId: req.params.id };
        models.answer.findAll({ where: queryObj })
            .then((a) => {
                let ratio = [],
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
                    response.getRatio(res, qRatio);
                }
                else
                    response.getBadRequest(res);
        });
    },
    postQ = function(req, res){
        if(req.body.options.length !== 0){
            let answers = [];
            for(let i = 0; i < req.body.options.length; i++)
                answers.push({
                    option: req.body.options[i].description,
                    color: req.body.options[i].color,
                    count: 0
                });
            let q = {
                description: req.body.question,
                anonymous: req.body.anonymous,
                uuid: genUUID.default(),
                image: req.body.image,
                answers: answers
            };
            models.question.create(q, { include: [models.answer] })
                .then((q) => {
                    let d = dai(q.dataValues.id, q.dataValues.uuid, q.dataValues.answers);
                    daList.push(d);
                    d.register();
                    response.getCreated(res, q.dataValues.id);
                });
        }
        else
            response.getBadRequest(res);
    },
    postA = function (req, res) {
        let id = req.body.id,
            color = req.body.color,
            login = (req.user !== undefined),
            queryObj,
            question,
            answer;
        models.question.findById(id)
            .then((q) => {
                question = q;
                if (q){
                    queryObj = { color: color, questionId: id };
                    return models.answer.findOne({ where: queryObj });
                }
                else
                    return Promise.reject(400);
            })
            .then((a) => {
                if (a) {
                    answer = a;
                    if (!question.anonymous && login) {
                        queryObj = { questionId: id, userId: req.user.id };
                        return models.vote.findOne({ where: queryObj });
                    } else if (!question.anonymous && !login) {
                        return Promise.reject(401);
                    } else if (question.anonymous) {
                        a.increment(['count'], {by: 1});
                        for (let i = 0; i < daList.length; i++)
                            if (daList[i].mac === question.uuid)
                                daList[i].push(a);
                        return Promise.reject(200);
                    }
                }
                else
                    return Promise.reject(400);
            })
            .then((v) => {
                if (v == null){
                    answer.increment(['count'],{ by :1});
                    for(var i = 0; i < daList.length; i++)
                        if(daList[i].mac === question.uuid)
                            daList[i].push(answer);
                    models.vote.create({
                        userId: req.user.id,
                        questionId: id,
                        answerId: answer.id
                    });
                    response.getSuccess(res);
                }
                else
                    return Promise.reject(409);
            })
            .catch((code) => {
                if(code === 200)
                    response.getSuccess(res);
                else if(code === 401)
                    response.getPermissionDenied(res);
                else if(code === 404)
                    response.getBadRequest(res);
                else if(code === 409)
                    response.getConflict(res);
            });
    },
    updateQ = function(req, res){
        let id = req.body.id,
            description = req.body.question,
            anonymous = req.body.anonymous,
            image = req.body.image,
            question,
            answers = []
        models.question.findById(id)
            .then((q) => {
                if (q != null && //check id is not exist
                    id.trim().length !== 0 && //check id is not empty
                    req.body.options.length !== 0) { // check options is not empty
                    question = q;
                    for (let i = 0; i < req.body.options.length; i++)
                        answers.push({
                            option: req.body.options[i].description,
                            color: req.body.options[i].color,
                            count: 0,
                            questionId: id
                        });
                    return models.answer.destroy({ where: { questionId: id}, force: true});
                }
                else
                    Promise.reject(404);
            })
            .then(() => {
                return models.answer.bulkCreate(answers);
            })
            .then(() => {
                let updateInfo = {
                    description: description,
                    anonymous: anonymous,
                    image: image
                };
                return models.question.update(updateInfo, { where: {id: id} });
            })
            .then(() => {
                let d = dai(id, question.uuid, answers);
                daList.push(d);
                d.register();
                response.getSuccess(res);
            })
            .catch((code) => {
                if(code === 404)
                    response.getPageNotFound(res);
            });
    },
    deleteQ = function(req, res){
        let id = req.body.id;
        models.question.destroy({ where: { id: id }, force:true })
            .then(() => {
                response.getSuccess(res);
            });
    };

app.get('/getR/:id([0-9]+)', getR);
app.post('/postQ', postQ);
app.post('/postA', postA);
app.post('/admin/updateQ', bAuth, updateQ);
app.post('/admin/deleteQ', bAuth, deleteQ);

// Page route
let index = function(req, res){
        models.question.findAll()
            .then((qList) => {
                response.getQuestionListPage(res, qList);
            });
    },
    create = function(req, res){
        response.getVotingCreatePage(res);
    },
    dashboard = function(req, res){
        let question,
            queryObj;
        models.question.findById(req.params.id)
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
            question,
            answer,
            vote = null,
            voteAnswer,
            queryObj;
        models.question.findById(id)
            .then( (q) => {
                question = q;
                queryObj = {questionId: id};
                if(0){}
                else if(q == null)
                    return Promise.reject(404);
                else if(q.anonymous && !login)
                    return models.answer.findAll({where: queryObj} );
                else if(q.anonymous && login)
                    return models.answer.findAll({where: queryObj} );
                else if(!q.anonymous && login)
                    return models.answer.findAll( {where: queryObj} );
                else if(!q.anonymous && !login)
                    return Promise.reject(200);
            })
            .then( (a) => {
                options = [];
                answer = a;
                a.forEach((answer) => {
                    options.push({description: answer.option, color: answer.color});
                });
                if(question.anonymous && !login) {
                    return Promise.reject(200);
                }
                else if(question.anonymous && login){
                    return Promise.reject(200);
                }
                else if(!question.anonymous && login){
                    queryObj = { questionId: id, userId: req.user.id};
                    return models.vote.findOne({ where: queryObj });
                }
            })
            .then( (v) => {
                vote = v;
                if(v != null)
                    return models.answer.findById(v.answerId);
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
                    if(0){}
                    else if(question.anonymous && !login){
                        response.getVotingPage(res, {
                            q: question.description,
                            anonymous: question.anonymous,
                            o: options,
                            useDisqus: config.useDisqus
                        });
                    }
                    else if(question.anonymous && login){
                        response.getVotingPage(res, {
                            q: question.description,
                            anonymous: question.anonymous,
                            o: options,
                            useDisqus: config.useDisqus
                        });
                    }
                    else if(!question.anonymous && login && !vote){
                        response.getVotingPage(res, {
                            q: question.description,
                            anonymous: question.anonymous,
                            o: options,
                            n: req.user.name,
                            p: req.user.photo,
                            useDisqus: config.useDisqus
                        });
                    }
                    else if(!question.anonymous && login && vote){
                        response.getVotingPage(res, {
                            q: question.description,
                            anonymous: question.anonymous,
                            o: options,
                            va: voteAnswer.option,
                            n: req.user.name,
                            p: req.user.photo,
                            useDisqus: config.useDisqus
                        });
                    }
                    else if(!question.anonymous && !login){
                        req.session.returnTo = req.path;
                        res.redirect('/login');
                    }
                }
            });
    },
    admin = function(req, res){
        models.question.findAll()
            .then((qList) => {
                response.getAdminQuestionListPage(res, qList);
            });
    },
    adminEdit = function(req, res){
        let queryObj,
            question;
        models.question.findById(req.params.id)
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
                            options[idx] = answer.option;
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
    };

app.get('^/index(/){0,1}$|^/$', index);
app.get('^/create(/){0,1}$', create);
app.get('^/dashboard/:id([0-9]+)(/){0,1}$', dashboard);
app.get('^/login(/){0,1}$', login);
app.get('^/vote/:id([0-9]+)(/){0,1}$', vote);
app.get('^/admin(/){0,1}$', bAuth, admin);
app.get('^/admin/edit/:id([0-9]+)(/){0,1}$', bAuth, adminEdit);