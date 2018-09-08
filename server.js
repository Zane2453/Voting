var express = require('express'),
	app = express(),
	http = require('http').createServer(app),
	shortid = require('shortid'),
	config = require('./config'),
	io = require('socket.io')(http),
	fs = require('fs'),
	bodyParser = require('body-parser'),
	cookieParser = require('cookie-parser'),
	expressSession = require('express-session'),
	page = require('./page').page,
	models = require('./model').models,
	dai = require('./dai').dai,
	daList = [],
	passport = require('passport'),
	googleStrategy = require('passport-google-oauth').OAuth2Strategy;

//create tables
models.answer.sync({force: false}).then(function(){});
models.question.sync({force: false}).then(function(){});
models.user.sync({force: false}).then(function(){});
models.vote.sync({force: false}).then(function(){});

app.use(express.static('./web'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(expressSession({
	secret: 'keyboard cat',
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

passport.use(new googleStrategy({
		clientID: config.googleClientID,
		clientSecret: config.googleClientSecret,
		callbackURL: '/auth/google/callback'
	},
	function(accessToken, refreshToken, profile, done) {
		models.user.findById(profile.id).then(function(u){
			if(u == null){
				u = {
					id: profile.id,
					name: profile.displayName,
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
		anonymous = req.body.anonymous,
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
				  anonymous: anonymous,
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

app.get('/auth/google', passport.authenticate('google',
	{ scope: ['https://www.googleapis.com/auth/plus.login'] })
);

app.get('/auth/google/callback',
	passport.authenticate('google', { failureRedirect: '/login' }),
	function(req, res) {
		console.log(req.session.returnTo+"================");
		res.redirect(req.session.returnTo || '/');
		delete req.session.returnTo;
	}
);

app.get('/login', function(req, res){
	page.getLoginPage(req, res);
});

app.get('/*', function(req, res) {
	var id = req.originalUrl.substr(1,16),
		login = (req.user != undefined);
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
					page.getVotingPage(req, res, {
						q: q.description,
						a: options
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
						page.getVotingPage(req, res, {
							q: q.description,
							a: options
						});
					});
				}
				else{
					req.session.returnTo = req.path;
					res.redirect('login');
				}
			}
		}
		else
			page.getPageNotFound(req, res);
	});
});


http.listen((process.env.PORT || config.port), '0.0.0.0');