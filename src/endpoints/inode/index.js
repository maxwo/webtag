var express = require('express'),
    events = require('events'),
    _ = require('underscore');

var storage = require('../../lib/localStorage');
var tools = require('../../lib/tools');
var inodeManager = require('../../managers/inode');



var app = module.exports = express();


app.get('/api/inode/:id', inodeManager.inodeHandler, function(request, response) {

    response.end(JSON.stringify(request.inode));

});

app.put('/api/inode/:id', inodeManager.inodeHandler, function(request, response) {

    var inode = _.extend({}, request.inode, request.body);

    inodeManager
        .indexer
        .index(inode)
        .then(function() {
            response.write(JSON.stringify(inode, null, 4));
            response.end();
        })
        .catch(tools.errorHandler(response));

});

app.delete('/api/inode/:id', inodeManager.inodeHandler, function(request, response) {

    inodeManager
        .indexer
        .delete(request.inode)
        .then(function() {
            console.log('OK!!!');
            response.write('');
            response.end();
            storage.delete(request.inode.id);
        })
        .catch(tools.errorHandler(response));

});
