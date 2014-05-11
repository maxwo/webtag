var express = require('express'),
    http = require('http'),
    multiparty = require('multiparty'),
    events = require('events'),
    _ = require('underscore');

var storage = require('../localStorage');
var indexer = require('../indexer');
var notification = require('../notification');
var tools = require('../tools');
var inodeManager = require('../managers/inode');
var eventPhaser = require('../eventPhaser');




var app = module.exports = express();


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