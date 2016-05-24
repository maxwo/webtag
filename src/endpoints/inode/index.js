let express = require('express'),
    events = require('events'),
    _ = require('underscore');

let storage = require('../../lib/localStorage');
let tools = require('../../lib/tools');
let inodeManager = require('../../managers/inode');



let app = module.exports = express();


app.get('/api/inode/:id', inodeManager.inodeHandler, function(request, response) {

    response.end(JSON.stringify(request.inode));

});

app.put('/api/inode/:id', inodeManager.inodeHandler, function(request, response) {

    let inode = _.extend({}, request.inode, request.body);

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