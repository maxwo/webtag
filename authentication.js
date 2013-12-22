var ElasticSearchClient = require('elasticsearchclient');
var tools = require('./tools');
var config = require('./config.js');
var crypto = require('crypto');
var util = require('util');
var events = require('events');


var serverOptions = {
    host: config.elasticSearch.host,
    port: config.elasticSearch.port
};

var index = 'webtag';
var type = 'user';
var salt = '$€*_-°';

var client = new ElasticSearchClient(serverOptions);



exports.authenticate = function(login, password, fn) {

    tools.logger.info('Trying to authenticate '+ login);

    var search = exports.beginUserGet(login);

    search.on('found', function(user) {
        console.log('found');

        var shasum = crypto.createHash('sha512');
        shasum.update(salt);
        shasum.update(password);
        var hashPassword = shasum.digest('hex');

        if ( hashPassword===user.password ) {
            fn(undefined, user);
        } else {
            fn ('Wrong password for user '+ login +'.');
        }
    });

    search.on('notFound', function() {
        console.log('User '+ login +'not found.');
        fn('User '+ login +'not found.', user);
    });

    search.on('error', function(error) {
        fn('Technical issue while authentication.');
    });

    search.process();

};




exports.administrationRight = function(request, response, next) {

    if ( request.user.groups.indexOf('admin')>=0 ) {
        next()
    } else {
        response.writeHead(403);
        response.end('Forbidden');
    }

};




exports.createUser = function(user, doneCallback, errorCallback) {

    var shasum = crypto.createHash('sha512');
    shasum.update(salt);
    shasum.update(user.password);
    user.password = shasum.digest('hex');

    var ci = client.index(index, type, user, user.login);
    ci.on('done', doneCallback);
    ci.on('error', function(error) {
        errorCallback( new tools.UserError(user, {source: error}) );
    });
    tools.logger.info('indexation of '+ user.login +' ready.');
    ci.exec();

};


exports.deleteUser = function(user, doneCallback, errorCallback) {

    var ci = client.deleteByQuery(index, type, {query:{term:{login:user.login}}});
    ci.on('done', doneCallback);
    ci.on('error', function(error) {
        errorCallback( new tools.UserError(user, {source: error}) );
    });
    tools.logger.info('delete of '+ user.login +' ready.');
    ci.exec();

};






exports.beginUserGet = function(login) {

    return new UserGet(login);
};

function UserGet(login) {
    this._login = login;
};

util.inherits(UserGet, events.EventEmitter);

UserGet.prototype.process = function() {

    tools.logger.info('initializing GET of '+ this._login);

    var that = this;
    var cs = client.get(index, type, this._login);

    cs.on('data', function(data) {
        tools.logger.info('got '+ data);
        var result = JSON.parse(data);
        if ( result.exists ) {
            that.emit('found', result._source);
        } else {
            that.emit('error', new tools.UserError({login: that._login}, {notFound: true}));
        }
    });

    cs.on('error', function(error) {
        tools.logger.info('error while getting '+ that._login);
        that.emit('error', new tools.UserError(that._login, {source: error}));
    });

    cs.exec();

};
