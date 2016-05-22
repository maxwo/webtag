let indexer = require('./indexer');
let tools = require('../lib/tools');

let inodeTemplate = {
    id: undefined,
    tags: [],
    metadata: [],
    owner: '',
    groups: []
};


exports.indexer = indexer.indexer('inode', inodeTemplate);

exports.inodeHandler = function(request, response, next) {

    let id = request.params.id;

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
    let tags = request.path.substr(10).split('/');
    request.tags = [];

    for ( let i=0 ; i<tags.length ; i++ ) {
        if ( tags[i] ) {
            request.tags.push(tags[i]);
        }
    }

    next();
};
