var express = require('express'),
    http = require('http'),
    multiparty = require('multiparty'),
    events = require('events'),
    util = require('util'),
    _ = require('underscore');

var authentication = require('./authentication');
var storage = require('./localStorage');
var indexer = require('./indexer');
var notification = require('./notification');
var tools = require('./tools');
var inodeManager = require('./managers/inode');
var eventPhaser = require('./eventPhaser');
var config = require('./config');




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





app.post('/data', function(request, response) {

    var storages = [];
	var inodeTemplate = {};
	var contentType = request.headers['content-type'];

	var phaser = new eventPhaser.EventPhaser();

    var result = {
        success: [],
        error: []
    };

    tools.logger.info(request.user);

	if ( contentType.indexOf('multipart/form-data;')===0 ) {

		var form = new multiparty.Form();
		form.on('part', function(part) {

		    if ( phaser.hasError() ) {
		        tools.doDrain(part);
		        return;
		    }

            if ( typeof part.filename==='undefined' ) {

                tools.readParam(part, function(value) {
                    if ( part.name==='tags' ) {
                       var tags = value.split(/,/);
                       inodeTemplate[part.name] = tags;
                   }
                });

			} else {

                var store = new storage.storage();
                var inodeIndexer = new indexer.InodeIndexer();
                var inode = inodeManager.create(store.id(), inodeTemplate);
                var storeNotification = new notification.ProgressNotification({
                    inode: inode,
                    expected: part.byteCount
                });

                inode['filename'] = part.filename;
                inode['content-type'] = part.headers['content-type'];

                store.on('finish', function() {

                    inode['size'] = store.size();
                    inode['location'] = store.location();

                    inodeIndexer.index(inode);

                });
                store.on('error', tools.drain(part));
                store.on('error', function() {
                    result.error.push(part.filename);
                    phaser.cancelOperation(inodeIndexer);
                });

                inodeIndexer.on('finish', function(inode) {
                    result.success.push(inode);
                    storeNotification.end();
                });
                inodeIndexer.on('error', function() {
                    result.error.push(part.filename);
                });

                phaser.addOperation(inodeIndexer);
                phaser.addOperation(store);

                store.process(part);

                storeNotification.start();
                storeNotification.stream(part);
		    }

		});
		form.on('error', tools.errorHandler(response));

		phaser.addOperation(form, {finishEvent: 'close'});
		phaser.on('finish', function() {
            tools.logger.info('end of request processing.');
            response.json(201, result);
        });

		form.parse(request);

    } else {
        tools.errorHandler(response)(new tools.Error({badRequest:true}));
	}


});

app.put('/data/:id', inodeManager.inodeHandler, function(request, response) {

    tools.logger.info('PUT on %s.', request.inode.id);

    var inode = request.inode;

    var store = new storage.storage(inode.id);
    store.on('finish', function() {

        inode['size'] = store.size();
        inode['location'] = store.location();

        indexer.indexInode(inode, function(inode) {
            response.json(inode);
            response.end();
        } , tools.errorHandler(response), request.inode.id);

    });
    store.on('error', tools.errorHandler(response));

    store.process(request);

    notification.notifyProgress(request);

});

app.get('/data/:id', inodeManager.inodeHandler, function(request, response) {

    var s = new storage.retrieval(request.inode.id);
    s.on('error', tools.errorHandler(response));
    s.pipe(response);

});



app.get('/inode/:id', inodeManager.inodeHandler, function(request, response) {

    response.end(JSON.stringify(request.inode));

});

app.put('/inode/:id', inodeManager.inodeHandler, function(request, response) {

    var inode = _.extend(request.inode, request.body);

    indexer.indexInode(inode, function() {
        response.write(JSON.stringify(inode, null, 4));
        response.end();
    } , tools.errorHandler(response));


    response.end();

});

app.delete('/inode/:id', inodeManager.inodeHandler, function(request, response) {

    indexer.deleteInode(request.inode, function() {
        response.write(JSON.stringify(inode, null, 4));
        response.end();

        storage.delete(request.inode.id);

    } , tools.errorHandler(response));

});



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



app.post('/user/', authentication.administrationRight, function(request, response) {

    var user = request.body;

    authentication.createUser(user, function() {
        response.write( JSON.stringify(user) );
        response.end();
    } , tools.errorHandler(response));

});

app.put('/user/:login', function(request, response) {

    var sentUser = request.body;

    authentication.updateUser(sentUser, request.user, function(newUser) {
        response.write( JSON.stringify(newUser) );
        response.end();
    } , tools.errorHandler(response));

});

app.get('/user/:login', function(request, response) {

    var get = authentication.beginUserGet(request.params.login);

    get.on('found', function(user) {
        response.end(JSON.stringify(user));
    })

    get.on('error', tools.errorHandler(response));

    get.process();

});

notification.initNotification(app, server);

tools.logger.info('Listening on %s:%d', config.get('httpHost'), config.get('httpPort'));
server.listen(config.get('httpPort'), config.get('httpHost'));

