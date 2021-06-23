var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var passport = require('passport');
var config = require('./config');
var User = require('./authentication/models/user');

var indexRouter = require('./default/index');
var usersRouter = require('./authentication/routes/users');

// Mongoose engine setup
const mongoose = require('mongoose');
const connect = mongoose.connect(config.mongoUrl);
connect.then((db) => {
  console.log("Connected correctly to MongoDB");
}, (err) => { console.log(err); });

// Express App instance creation
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'default', 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Middleware: Passport based Authentication 
app.use(passport.initialize());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Middleware: Static page access
app.use(express.static(path.join(__dirname, 'public')));

// Service routes mount
app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
