var events = require('events');
var crypto = require('crypto');

var tools = require('../tools');
var indexer = require('./indexer');

var salt = '$€*_-°';
var userTemplate = {
    login: undefined,
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    groups: []
};

exports.indexer = indexer.indexer('user', userTemplate);

exports.authenticate = function(login, password, fn) {

    tools.logger.info('Trying to authenticate '+ login);

    exports.indexer
        .get(login)
        .then(function(user) {

            var shasum = crypto.createHash('sha512');
            shasum.update(salt);
            shasum.update(password);
            var hashPassword = shasum.digest('hex');

            if ( hashPassword===user.password ) {
                fn(undefined, user);
            } else {
                fn('Wrong password for user '+ login +'.');
            }

        })
        .catch(function(error) {
            fn('Technical issue while authentication : '+ error);
        });

};

exports.administrationRight = function(request, response, next) {

    if ( request.user.groups.indexOf('admin')>=0 ) {
        next()
    } else {
        response.writeHead(403);
        response.end('Forbidden');
    }

};