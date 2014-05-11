var express = require('express'),
    http = require('http'),
    events = require('events'),
    _ = require('underscore');

var storage = require('../localStorage');
var indexer = require('../indexer');
var notification = require('../notification');
var tools = require('../tools');
var inodeManager = require('../managers/inode');

var app = module.exports = express();



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
        console.log('OK!!!');
        response.write('');
        response.end();

        storage.delete(request.inode.id);

    } , tools.errorHandler(response));

});

