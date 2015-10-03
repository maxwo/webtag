var express = require('express'),
	_ = require('underscore');

var form = require('../managers/form');
var storage = require('../localStorage');
var tools = require('../tools');
var inodeManager = require('../managers/inode');

tools.logger.info('Initializing data end point.');

var app = module.exports = express();

app.post('/api/data/', function (request, response) {
	// Store all the files
	form
		.parse(request)

		// Index all the files
		.then(function (data) {
			var tags = data.parameters.tags ? data.parameters.tags.split(',') : [],
				promises = [];

			_.each(data.files, function (file) {
				promises.push(inodeManager.indexer.index({
					filename: file.filename,
					tags: tags,
					owner: request.user.login,
					groups: request.user.groups,
					file: file
				}));

			});

			return Promise.all(promises);
		})

		// Send inodes to client
		.then(function (inodes) {
			response.json(201, inodes);
		})
		.catch(tools.errorHandler(response));

});

/*
app.put('/api/data/:id', inodeManager.inodeHandler, function(request, response) {

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
*/

app.get('/api/data/:id', inodeManager.inodeHandler, function (request, response) {
	var s = new storage.retrieval(request.inode.file.id);
	s.on('error', tools.errorHandler(response));
	s.pipe(response);

});
