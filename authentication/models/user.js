var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

var User = new Schema({
    firstname: {
        type: String,
        default: ''
    },
    lastname: {
        type: String,
        default: ''
    },

    facebookId: {
        // FacebookId of users logged through Facebook OAuth.
        type: String,
        default: null
    },

    roles: {
        type: [String],
        enum: ['user', 'operator', 'admin'],
        default: ['user']
    }

    // Username and "password" managed by passport-local-mongoose.
});

// Add support for passportLocalMongoose
User.plugin(passportLocalMongoose);

var Users = mongoose.model('User', User);

module.exports = Users;