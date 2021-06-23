const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const passport = require('passport');

var cors = require('../../cors');
var User = require('../models/user');
var authenticate = require('../authenticate');

var router = express.Router();
router.use(bodyParser.json());

/* GET users listing. */
router.options('*', cors.corsWithOptions, (req, res) => { res.sendStatus(200); } );
router.get('/', cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, function(req, res, next) {
  User.find({})
  .then((users) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json(users);
  }, (err) => next(err))
  .catch((err) => next(err));
});

router.post('/signup', cors.corsWithOptions, (req, res, next) => {
  // This registers the user into the passport-store.
  // In case of success this operation will add a user into the database 
  // using provided username and password.
  User.register(new User({username: req.body.username}), req.body.password, 
    (err, user) => { 
      // In case of error
      if(err) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.json({err: err});
      }
      else {
        // Complete the User with the information provided by the request
        // if available.
        // We are performing here this operations since we want make sure
        // that the user has been registered before performing any other
        // operation.
        if (req.body.firstname)
          // user is a "result" of the registration procedure
          user.firstname = req.body.firstname;
        if (req.body.lastname)
          user.lastname = req.body.lastname;

        // Update the user in the storage
        user.save((err, user) => {
          // In case of error in the storage let's notify the user
          if (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.json({ err: err });
            return;
          }
          // Otherwise we will instruct passport to authenticate the user
          passport.authenticate('local')(req, res, () => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            // The user will extract the success field and check if it is true to confirm registration
            res.json({ success: true, status: 'Registration Successful!' });
          });
        });
      }
    });
});

router.post('/login', cors.corsWithOptions, (req, res, next) => {

  passport.authenticate('local', (err, user, info) => {
    if (err)
      // If an error occurred, let the error handler take care of this
      return next(err);

    if (!user) {
      // If the user does not exist or the password didn't match we must inform the frontend
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      res.json({success: false, status: 'Login Unsuccessful!', err: info});
      return;
    }
    // The User can be loggedin, let's ask Passport to log the user (this triggers store management if any)
    req.logIn(user, (err) => {
      if (err) {
        res.statusCode = 401;
        res.setHeader('Content-Type', 'application/json');
        res.json({success: false, status: 'Login Unsuccessful!', err: 'Could not log in user!'}); 
        return;
      }
      // The user has successfully login and we can generate the token!

      // Passport will handle a Basic authentication and return error in case is needed
      // We only need to provide the information to enable users to manage the case
      // in which the authentication was successful
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      // Here we are creating a token for authenticated users, if we are here passport
      // has already authenticated the user and added a user property to the req object
      // so we can fetch the ._id
      let token = authenticate.getToken({_id: req.user._id});
      // Again, the user will extract the success field and check if it is true to confirm registration
      // The user will also fetch and keep a token object.
      res.json({success: true, token: token, status: 'You are successfully logged in!'});
    }); 
  }) (req, res, next);
});

// router.get('/logout', cors.corsWithOptions, (req, res) => {
//   // Do we already have a session for this user?
//   if (req.session) {
//     // If so, let's destroy the session on the server side
//     req.session.destroy();
//     // ask the client to remove the cookie
//     res.clearCookie('session-id');
//     // redirect the user to a standard page
//     res.redirect('/');
//   }
//   else {
//     // If not, throw an error, we cannot logout a non-logged user
//     let err = new Error('You are not logged in!');
//     err.status = 403;
//     next(err);
//   }
// });

router.get('/facebook/token', passport.authenticate('facebook-token'), (req, res) => {
  if (req.user) {
    // If we reach this point we managed to authenticate the user with Facebook OAuth
    // so we will proceed creating a JWT that the user will use with our server.
    let token = authenticate.getToken({_id: req.user._id});
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json({success: true, token: token, status: 'You are successfully logged in!'});
    // From now onwards the user will use our JWT to authenticate in the system.
  }
});

router.get('/checkJWTtoken', cors.corsWithOptions, (req, res) => {
  passport.authenticate('jwt', {session: false}, (err, user, info) => {
    if (err)
      // If an error occurred, let the error handler take care of this
      return next(err);
    
    if (!user) {
      // If the user object was not found, we must specify that the JWT is expired or invalid
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      return res.json({status: 'JWT invalid!', success: false, user: null, err: info});
    }
    else {
      // If the user object was found, the JWT is valid
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.json({status: 'JWT valid!', success: true, user: user, err: null});

    }
  }) (req, res);
});

module.exports = router;
