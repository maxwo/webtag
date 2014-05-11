var express = require('express'),
    http = require('http'),
    events = require('events'),
    _ = require('underscore');

var authentication = require('./lib/authentication');
var indexer = require('./lib/indexer');
var notification = require('./lib/notification');
var tools = require('./lib/tools');
var inodeManager = require('./lib/managers/inode');
var config = require('./lib/config');


var dataEndPoint = require('./lib/data');
var inodeEndPoint = require('./lib/inode');
var userEndPoint = require('./lib/user');




var app = express();
var server = http.createServer(app);

app.use(express.basicAuth( authentication.authenticate ));
app.use(express.methodOverride());
app.use(express.logger());

app.get('/*', express.static(__dirname + '/static'));

app.use('/user/', express.bodyParser());
app.use('/inode/', express.bodyParser());
app.use('/tags/', express.bodyParser());
app.use(function(error, request, response, next) {
    if (!error) {
        return next();
    }
    tools.errorHandler(response)({
        error:true,
        source: error
    });
});




app.use(dataEndPoint);
app.use(inodeEndPoint);
app.use(userEndPoint);








app.get('/tags/*', inodeManager.tagsHandler, function(request, response) {

    var query = {"bool": {"must":[]}};
    _.each(request.tags, function(tag) {
        query.bool.must.push({ "term": {"tags":tag} });
    });
    if ( query.bool.must.length===0 ) {
        query = {"match_all" : {}};
    }

    var search = indexer.beginInodeSearch({
        "query" : query,
        "page" : request.query.page
    });
    search.on('found', function(inodes, tags) {

	    var filtered_tags = _.filter(tags, function(tag) {
            return request.tags.indexOf(tag.tag)===-1;
        });

        response.end(JSON.stringify( {"tags": filtered_tags, "inodes": inodes} , undefined, 4));
    });
    search.on('error', tools.errorHandler(response));
    search.process();
});





notification.initNotification(app, server);

tools.logger.info('Listening on %s:%d', config.get('httpHost'), config.get('httpPort'));
server.listen(config.get('httpPort'), config.get('httpHost'));

