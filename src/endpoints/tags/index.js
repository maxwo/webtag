let express = require('express'),
    events = require('events'),
    _ = require('underscore');

let tools = require('../../lib/tools');
let inodeManager = require('../../managers/inode');

let app = module.exports = express();

let facets = {
    "tags" : {
        "terms" : {
            "field" : "tags",
            "size" : 20
        }
    }
};

app.get('/api/tags/*', inodeManager.tagsHandler, function(request, response) {

    let query = {
        "bool":
        {
            "must":[]
        }
    };
    _.each(request.tags, function(tag) {
        query.bool.must.push({
            "term": {
                "tags":tag
            }
        });
    });
    if ( query.bool.must.length===0 ) {
        query = {
            "match_all" : {}
        };
    }

    inodeManager
        .indexer
        .search(query, 0, 100, facets)
        .then(function(results) {
            let filtered_tags = _.filter(results.tags, function(tag) {
                return request.tags.indexOf(tag.tag)===-1;
            });
            response.end(JSON.stringify( {"tags": filtered_tags, "inodes": results.documents} , undefined, 4));
        })
        .catch(tools.errorHandler(response));

});
