var express = require('express');
var multiparty = require('multiparty');
var _ = require('underscore');
var events = require('events');
var util = require('util');

var authentication = require('./authentication');
var storage = require('./localStorage');
var indexer = require('./indexer');
var notification = require('./notification');
var tools = require('./tools');
var inodeManager = require('./managers/inode');
var operationPool = require('./operationPool');
var config = require('./config');

var app = express();

app.get('/', express.static(__dirname + '/static'));
app.use('/user/', express.bodyParser());
app.use('/inode/', express.bodyParser());
app.use('/tags/', express.bodyParser());
app.use(express.methodOverride());
app.use(express.basicAuth( authentication.authenticate ));
app.use(express.logger());
app.use(function(error, request, response, next) {
    if (!error) {
        return next();
    }
    tools.errorHandler(response)({error:true, source: error});
});





app.post('/data', function(request, response) {

    var storages = [];
	var inodeTemplate = {};
	var contentType = request.headers['content-type'];

	var operations = new operationPool.OperationPool();

    var result = {
        success: [],
        error: []
    };

	if ( contentType.indexOf('multipart/form-data;')===0 ) {

		var form = new multiparty.Form();
		form.on('part', function(part) {

		    if ( operations.hasError() ) {
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

                store.on('finish', function() {

                    var inode = inodeManager.create(store.id(), inodeTemplate);

                    inode['id'] = store.id();
                    inode['size'] = store.size();
                    inode['location'] = store.location();
                    inode['filename'] = part.filename;
                    inode['content-type'] = part.headers['content-type'];

                    inodeIndexer.index(inode);

                });
                store.on('error', tools.drain(part));
                store.on('error', function() {
                    result.error.push(part.filename);
                    operations.cancelOperation(inodeIndexer);
                });
                operations.addOperation(store);

                inodeIndexer.on('finish', function(inode) {
                    result.success.push(inode);
                });
                inodeIndexer.on('error', function() {
                    result.error.push(part.filename);
                });
                operations.addOperation(inodeIndexer);

                store.process(part);

                notification.notifyProgress(request);

		    }

		});
		form.on('error', tools.errorHandler(response));

		operations.addOperation(form, {finishEvent: 'close'});

		operations.on('finish', function() {
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

        inode['size'] = s.size();
        inode['location'] = s.location();

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

    var search = indexer.beginInodeSearch(query);

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



app.listen(config.get('httpPort'), config.get('httpHost'));

