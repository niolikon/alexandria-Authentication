var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var User = require('./models/user');
var JwtStrategy = require('passport-jwt').Strategy;
var ExtractJwt = require('passport-jwt').ExtractJwt;
var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
var FacebookTokenStrategy = require('passport-facebook-token'); // OAuth Facebook access

var config = require('../config.js');

// -----------------------------------------------------------------
// LocalStrategy Configuration
// -----------------------------------------------------------------

// The LocalStrategy will fetch the user information that we insert
// on incoming requests and use it to authenticate the user.

// We do not need to implement an authenticate() function since we
// added support for passport-local-mongoose on User model.

// The purpose of this middleware is to use the user credentials
// to authenticate the user with the informations stored in the
// database.
// In case of successful authentication it will mount a 'user' 
// property to the req object (i.e. req.user)
passport.use(new LocalStrategy(User.authenticate()));

// -----------------------------------------------------------------
// JWT Strategy Configuration
// -----------------------------------------------------------------

var opts = {};
// JwtStrategy Configuration: extract the token from header Bearer.
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
// JwtStrategy Configuration: use the provided key for signing.
opts.secretOrKey = config.tokenSecretKey;

// The purpose of this middleware is to validate an input JWT and
// check User activation status in the database.
exports.jwtPassport = passport.use(new JwtStrategy(opts,
    (jwt_payload, done) => {
        // If the token is valid, use it to fetch a user
        console.log("JWT payload: ", jwt_payload);
        User.findOne({_id: jwt_payload._id}, (err, user) => {
            if (err) {
                // In case of errors during the read from db
                return done(err, false);
            }
            else if (user) {
                // In case we have a matching user in the db
                return done(null, user);
            }
            else {
                // In case we don't have a match in the db
                return done(null, false);
            }
        });
    })
);

// -----------------------------------------------------------------
// Facebook Oauth Strategy Configuration
// -----------------------------------------------------------------

// This strategy will allow to authenticate user through Facebook OAuth
exports.facebookPassport = passport.use(
    new FacebookTokenStrategy(
        { 
            clientID: config.facebook.clientId,
            clientSecret: config.facebook.clientSecret
        }, 
        (accessToken, refreshToken, profile, done) => {
            // We will first try to see if this Facebook has logged earlier
            // and so we already verified the authenticity of this Facebook Id.
            // We can use the profile object that carries many informations
            // about the user that is trying to access, 
            User.findOne({facebookId: profile.id}, (err, user) => {
                if (err) {
                    // In case of error, report error
                    return done(err, false);
                }
                else if (user !== null) {
                    // In case we found that the user already logged in, return the user
                    return done(null, user);
                }
                else {
                    // Just for debug purposes
                    console.log(profile);

                    // Otherwise create a new user in the system
                    user = new User({ username: profile.displayName });
                    user.facebookId = profile.id;
                    user.firstname = profile.name.givenName;
                    user.lastname = profile.name.familyName;
                    user.save((err, user) => {
                        if (err)
                            return done(err, false);
                        else
                            return done(null, user);
                    })
                }
            });
        }
    )
);

// -----------------------------------------------------------------
// Token Generation Function
// -----------------------------------------------------------------

// Creates a token with the user data as payload
exports.getToken = function(user) {
    return jwt.sign(user,                       // Payload
        config.tokenSecretKey,                  // Secret
        {expiresIn: config.tokenExpiresSecs});  // Options
};


// -----------------------------------------------------------------
// User access control functions
// -----------------------------------------------------------------

// This exported function will allow us to use JWT to authenticate
// an user anytime it is required before peforming an operation.
// The provided configuration requests not to create sessions.
exports.verifyUser = passport.authenticate('jwt', {session: false});

function verifyAdmin(req, res, next) {
    console.log(req.user);
    if (req.user.roles.indexOf('admin') !== -1) {
        return next();
    }
    else {
        let err = new Error('You are not authorized to perform this operation!');
        err.status = 403;
        return next(err);
    }
}

exports.verifyAdmin = verifyAdmin;

