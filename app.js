var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var passport = require('passport');
var TwitterStrategy = require('passport-twitter').Strategy;
var config = require('./oauth.js');

passport.serializeUser(function(user, done) {
  done(null, user);
});
passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

passport.use(new TwitterStrategy({
  consumerKey: config.twitter.consumerKey,
  consumerSecret: config.twitter.consumerSecret,
  callbackURL: "http://localhost:1337/auth/twitter/callback"
  // callbackURL: "http://127.0.0.1:1337/auth/twitter/callback"  
}, 
function(token, tokenSecret, profile, done) {
    profile.twitter_token = token;
    profile.twitter_token_secret = tokenSecret;
    process.nextTick(function () {
      return done(null, profile);
    });
  }
));


var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 1337);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser()); 
  app.use(express.session({secret: "hogehoge"}));
  app.use(passport.initialize()); 
  app.use(passport.session()); 
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);
app.get('/ping', routes.ping);
app.get("/auth/twitter", passport.authenticate('twitter'));
app.get("/auth/twitter/callback", passport.authenticate('twitter', {
  successRedirect: '/timeline',
  failureRedirect: '/'
}));

app.get('/timeline', function(req,res){
    passport._strategies.twitter._oauth.getProtectedResource(
        'https://api.twitter.com/1.1/statuses/user_timeline.json',
        'GET',
    req.user.twitter_token,
    req.user.twitter_token_secret,
    function (err, data, response) {
        if(err) {
          res.send(err, 500);
          return;
        }
        var jsonObj = JSON.parse(data);
        res.send(jsonObj);
    });
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("\nExpress server listening on port " + app.get('port'));
});
