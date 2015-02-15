var express = require('express'),
    events = require('events'),
    _ = require('underscore');

var tools = require('../tools');
var inodeManager = require('../managers/inode');
var inodeIndexer = require('../managers/indexer').indexer('inode');

var app = module.exports = express();

app.get('/api/tags/*', inodeManager.tagsHandler, function(request, response) {

    var query = {"bool": {"must":[]}};
    _.each(request.tags, function(tag) {
        query.bool.must.push({ "term": {"tags":tag} });
    });
    if ( query.bool.must.length===0 ) {
        query = {"match_all" : {}};
    }

    inodeIndexer
        .search(query, 0, 100)
        .then(function(results) {
            var filtered_tags = _.filter(results.tags, function(tag) {
                return request.tags.indexOf(tag.tag)===-1;
            });
            response.end(JSON.stringify( {"tags": filtered_tags, "inodes": results.documents} , undefined, 4));
        })
        .catch(tools.errorHandler(response));

});