var indexer = require('./indexer');
var tools = require('../lib/tools');

var inodeTemplate = {
    id: undefined,
    tags: [],
    metadata: [],
    owner: '',
    groups: []
};


exports.indexer = indexer.indexer('inode', inodeTemplate);

exports.inodeHandler = function(request, response, next) {

    var id = request.params.id;

    exports
        .indexer
        .get(id)
        .then(function(inode) {
            request.inode = inode;
            next();
        })
        .catch(tools.errorHandler(response))

};

exports.tagsHandler = function(request, response, next)
{
    var tags = request.path.substr(10).split('/');
    request.tags = [];

    for ( var i=0 ; i<tags.length ; i++ ) {
        if ( tags[i] ) {
            request.tags.push(tags[i]);
        }
    }

    next();
};
