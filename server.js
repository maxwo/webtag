var express = require('express'),
    http = require('http'),
    events = require('events');

var userManager = require('./lib/managers/user');
var notification = require('./lib/notification');
var tools = require('./lib/tools');
var config = require('./lib/config');


var dataEndPoint = require('./lib/data');
var inodeEndPoint = require('./lib/inode');
var userEndPoint = require('./lib/user');
var tagsEndPoint = require('./lib/tags');




var app = express();
var server = http.createServer(app);

app.use(express.basicAuth( userManager.authenticate ));
app.use(express.methodOverride());
app.use(express.logger());

app.get('/*', express.static(__dirname + '/static'));

app.use('/api/user/', express.bodyParser());
app.use('/api/inode/', express.bodyParser());
app.use('/api/tags/', express.bodyParser());
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
app.use(tagsEndPoint);

notification.initNotification(app, server);

tools.logger.info('Preparing to listen on %s:%d', config.get('httpHost'), config.get('httpPort'));
server.listen(config.get('httpPort'), config.get('httpHost'));
tools.logger.info('Listening on %s:%d', config.get('httpHost'), config.get('httpPort'));

