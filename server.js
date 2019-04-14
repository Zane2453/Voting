let express = require('express'),
    app = express(),
    http = require('http').createServer(app),
    config = require('./config'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    expressSession = require('express-session'),
    response = require('./response').response,
    basicAuth = require('basic-auth'),
    models = require('./model').models,
    dai = require('./dai').dai,
    daList = [],
    passport = require('passport'),
    googleStrategy = require('passport-google-oauth').OAuth2Strategy,
    facebookStrategy = require('passport-facebook').Strategy,
    genUUID = require('./uuid');

http.listen((process.env.PORT || config.port), '0.0.0.0');

//create tables
models.answer.sync({force: false}).then(function(){});
models.question.sync({force: false}).then(function(){});
models.user.sync({force: false}).then(function(){});
models.vote.sync({force: false}).then(function(){});

//to-do
//register all questions in the DB


app.use(express.static('./web'));
app.use(cookieParser());
app.use(bodyParser.json({}));
app.use(expressSession({
    secret: genUUID.default(),
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser(function(user, done) {
  done(null, user);
});
passport.deserializeUser(function(user, done) {
  done(null, user);
});
// Google user create
passport.use(new googleStrategy({
        clientID: config.googleClientID,
        clientSecret: config.googleClientSecret,
        callbackURL: config.googleCallbackURL
    },
    function (accessToken, refreshToken, profile, done){
        models.user.findById(profile.id).then(function(u){
            if(u == null){
                u = {
                    id: profile.id,
                    name: profile.displayName,
                    photo: profile._json.image.url,
                    provider: profile.provider
                };
                models.user.create(u).then(function(){
                    return done(null, u);
                });
            }
            else
                return done(null, u);
        });
    }
));
// Facebook user create
passport.use(new facebookStrategy({
        clientID: config.facebookAPPID,
        clientSecret: config.facebookAPPSecret,
        callbackURL: config.facebookCallbackURL,
        profileFields: ['id', 'name', 'displayName', 
            'photos', 'hometown', 'profileUrl', 'friends']
    },
    function (accessToken, refreshToken, profile, done){
        models.user.findById(profile.id).then(function(u){
            if(u == null){
                u = {
                    id: profile.id,
                    name: profile.displayName,
                    photo: profile.photos ? profile.photos[0].value : '/img/faces/unknown-user-pic.jpg',
                    provider: profile.provider
                };
                models.user.create(u).then(function(){
                    return done(null, u);
                });
            }
            else
                return done(null, u);
        });
    }
));

// admin API/Page basic auth
let bAuth = function(req, res, next){
    var user = basicAuth(req);
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
        models.answer.findAll({
            where:{
                questionId: req.params.id
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
                response.getRatio(res, qRatio);
            }
            else
                response.getBadRequest(res);
        });
    },
    postQ = function(req, res){
        if(req.body.options.length !== 0){
            var answers = [];
            for(var i = 0; i < req.body.options.length; i++)
                answers.push({
                    option: req.body.options[i].description,
                    color: req.body.options[i].color,
                    count: 0
                });
            var q = {
                description: req.body.question,
                anonymous: req.body.anonymous,
                uuid: genUUID.default(),
                image: req.body.image,
                answers: answers
            };
            models.question.create(q, {
                include: [models.answer]
            }).then(function(q){
                var d = dai(q.dataValues.id, q.dataValues.uuid, q.dataValues.answers);
                daList.push(d);
                d.register();
                response.getCreated(res, q.dataValues.id);
            });
        }
        else{
            response.getBadRequest(res);
        }
    },
    postA = function(req, res){
        var id = req.body.id,
            color = req.body.color,
            login = (req.user !== undefined);
        models.question.findById(id).then(function(q){
            if(q){
                models.answer.findOne({
                    where:{
                        color: color,
                        questionId: id
                    }
                }).then(function(a){
                    if(a){
                        if(!q.anonymous && login){
                            models.vote.findOne({
                                where:{
                                    questionId: id,
                                    userId: req.user.id
                                }
                            }).then(function(v){
                                if(v == null){
                                    a.increment(['count'],{ by :1});
                                    for(var i = 0; i < daList.length; i++)
                                        if(daList[i].mac === q.uuid)
                                            daList[i].push(a);
                                    models.vote.create({
                                        userId: req.user.id,
                                        questionId: id,
                                        answerId: a.id
                                    }).then(function(){
                                        response.getSuccess(res);
                                    });
                                }
                                else
                                    response.getBadRequest(res);
                            })
                        }
                        else if(!q.anonymous && !login)
                            response.getPermissionDenied(res);
                        else if(q.anonymous){
                            a.increment(['count'],{ by :1});
                            for(var i = 0; i < daList.length; i++)
                                if(daList[i].mac === q.uuid)
                                    daList[i].push(a);
                            response.getSuccess(res);
                        }
                    }
                    else
                        response.getBadRequest(res);
                });
            }
            else
                response.getBadRequest(res);
        });
    },
    updateQ = function(req, res){
        var id = req.body.id,
            description = req.body.question,
            anonymous = req.body.anonymous,
            image = req.body.image,
            answers = [];
        models.question.findById(id).then(function(q){
            if(q != null && //check id is not exist
                id.trim().length !== 0 && //check id is not empty
                req.body.options.length !== 0){ // check options is not empty
                for(var i = 0; i < req.body.options.length; i++)
                    answers.push({
                        option: req.body.options[i].description,
                        color: req.body.options[i].color,
                        count: 0,
                        questionId: id
                    });

                models.answer.destroy({ where: { questionId: id},
                    force: true}).then(function(){
                    models.answer.bulkCreate(answers).then(function(){
                        var updateInfo = {
                            description: description,
                            anonymous: anonymous,
                            image: image
                        };
                        models.question.update(updateInfo, {
                            where: {id: id}
                        }).then(function(){
                            var d = dai(id, q.uuid, answers);
                            daList.push(d);
                            d.register();
                            response.getSuccess(res);
                        });
                    });
                });

            }
            else{
                response.getBadRequest(res);
            }
        });
    },
    deleteQ = function(req, res){
        var id = req.body.id;
        models.question.destroy({
            where: { id: id },
            force:true
        }).then(function(){
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
        models.question.findAll().then(function(qList){
            response.getQuestionListPage(res, qList);
        });
    },
    create = function(req, res){
        response.getVotingCreatePage(res);
    },
    dashboard = function(req, res){
        models.question.findById(req.params.id).then(function(q) {
            if(q != null){
                models.answer.findAll({
                    where:{
                        questionId: req.params.id
                    }
                }).then(function(a){
                    var options = [];
                    a.forEach(function(answer){
                        options.push(answer.option);
                    });
                    response.getDashBoardPage(res, {
                        id: req.params.id,
                        q: q.description,
                        image: q.image,
                        a: options
                    });
                });
            }
            else
                response.getPageNotFound(res);
        });
    },
    login = function(req, res){
        response.getLoginPage(res);
    },
    vote = function(req, res) {
        var id = req.params.id,
            login = (req.user !== undefined);
        models.question.findById(id).then(function(q){
            if(q != null){
                if(q.anonymous){
                    models.answer.findAll({
                        where: {
                            questionId: id
                        }
                    }).then(function (a) {
                        var options = [];
                        a.forEach(function (answer) {
                            options.push({
                                description: answer.option,
                                color: answer.color
                            });
                        });
                        response.getVotingPage(res, {
                            q: q.description,
                            anonymous: q.anonymous,
                            o: options,
                            useDisqus: config.useDisqus
                        });
                    });
                }
                else{
                    if(login){
                        models.answer.findAll({
                            where: {
                                questionId: id
                            }
                        }).then(function (a) {
                            var options = [];
                            a.forEach(function (answer) {
                                options.push({
                                    description: answer.option,
                                    color: answer.color
                                });
                            });

                            if(!q.anonymous) {
                                models.vote.findOne({
                                    where: {
                                        questionId: id,
                                        userId: req.user.id
                                    }
                                }).then(function (v) {
                                    if(v) {
                                        models.answer.findById(v.answerId).then(function (va) {
                                            response.getVotingPage(res, {
                                                q: q.description,
                                                anonymous: q.anonymous,
                                                o: options,
                                                va: va.option,
                                                n: req.user.name,
                                                p: req.user.photo,
                                                useDisqus: config.useDisqus
                                            })
                                        });
                                    }
                                    else{
                                        response.getVotingPage(res, {
                                            q: q.description,
                                            anonymous: q.anonymous,
                                            o: options,
                                            n: req.user.name,
                                            p: req.user.photo,
                                            useDisqus: config.useDisqus
                                        });
                                    }
                                });
                            }
                            else {
                                response.getVotingPage(res, {
                                    q: q.description,
                                    anonymous: q.anonymous,
                                    o: options,
                                    n: req.user.name,
                                    p: req.user.photo,
                                    useDisqus: config.useDisqus
                                });
                            }
                        });
                    }
                    else{
                        req.session.returnTo = req.path;
                        res.redirect('/login');
                    }
                }
            }
            else
                response.getPageNotFound(res);
        });
    },
    admin = function(req, res){
        models.question.findAll().then(function(qList){
            response.getAdminQuestionListPage(res, qList);
        });
    },
    adminEdit = function(req, res){
        models.question.findById(req.params.id).then(function(q) {
            if(q != null){
                models.answer.findAll({
                    where:{
                        questionId: req.params.id
                    }
                }).then(function(a){
                    var options = new Array(10);
                    options.fill(null);
                    a.forEach(function(answer){
                        var color = Object.keys(config.color);
                        color.forEach(function(color, idx){
                            if(color[idx] === answer.color){
                                options[idx] = answer.option;
                            }
                        });
                    });
                    response.getQuestionEditPage(res, {
                        q: q.description,
                        image: q.image,
                        a: options,
                        anonymous: q.anonymous
                    });
                });
            }
            else
                response.getPageNotFound(res);
        });
    };
app.get('^/index(/){0,1}$|^/$', index);
app.get('^/create(/){0,1}$', create);
app.get('^/dashboard/:id([0-9]+)(/){0,1}$', dashboard);
app.get('^/login(/){0,1}$', login);
app.get('^/vote/:id([0-9]+)(/){0,1}$', vote);
app.get('^/admin(/){0,1}$', bAuth, admin);
app.get('^/admin/edit/:id([0-9]+)(/){0,1}$', bAuth, adminEdit);

//OAuth
app.get('/auth/google', passport.authenticate('google',
    { scope: ['profile', 'email'] })
);
app.get('/auth/facebook', passport.authenticate('facebook'));
app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function(req, res) {
        res.redirect(req.session.returnTo || '/');
        delete req.session.returnTo;
    }
);
app.get('/auth/facebook/callback',
    passport.authenticate('facebook', { failureRedirect: '/login' }),
    function(req, res) {
        res.redirect(req.session.returnTo || '/');
        delete req.session.returnTo;
    }
);

