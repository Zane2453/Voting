/**
 * Created by kuan on 2019/5/18.
 */

let passport = require('passport'),
    googleStrategy = require('passport-google-oauth').OAuth2Strategy,
    facebookStrategy = require('passport-facebook').Strategy,
    models = require('./db_model').models;

module.exports = function (app, config) {
    app.use(passport.initialize());
    app.use(passport.session());

    passport.serializeUser(function(user, done) {
        done(null, user);
    });
    passport.deserializeUser(function(user, done) {
        done(null, user);
    });
    // Google user create
    passport.use(
        new googleStrategy({
            clientID: config.googleClientID,
            clientSecret: config.googleClientSecret,
            callbackURL: config.googleCallbackURL
        },
        function (accessToken, refreshToken, profile, done){
            models.user.findById(profile.id)
                .then(function(u){
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
                })
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
            models.user.findById(profile.id)
                .then(function(u){
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
};