let express = require('express'),
    http = require('http'),
    events = require('events');

let userManager = require('../../managers/user');
let tools = require('../../lib/tools');

let app = module.exports = express();

app.post('/api/user/', userManager.administrationRight, function(request, response) {

    let user = request.body;

    authentication.createUser(user, function() {
        response.write(JSON.stringify(user));
        response.end();
    }, tools.errorHandler(response));

});

app.put('/api/user/:login', function(request, response) {

    let sentUser = request.body;

    userManager.indexer.index(sentUser, request.user, function(newUser) {
        response.write(JSON.stringify(newUser));
        response.end();
    }, tools.errorHandler(response));

});

app.get('/api/user/:login', function(request, response) {

    userManager
        .indexer
        .get(request.params.login)
        .then(function(user) {
            response.json(200, user);
        })
        .catch(tools.errorHandler(response));

});
