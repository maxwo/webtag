var express = require('express'),
    http = require('http'),
    events = require('events'),
    _ = require('underscore');

var authentication = require('../authentication');
var notification = require('../notification');
var tools = require('../tools');

var app = module.exports = express();

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