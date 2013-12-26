var _ = require('underscore');

var indexer = require('../indexer');
var tools = require('../tools');

exports.inode = function(inode) {

    var inodeTemplate = {
       id: '',
       filename: '',
       'content-type': '',
       size: 0,
       tags: [],
       metadata: [],
       owner: '',
       groups: []
   };

   return _.extend(inodeTemplate, inode);

};

exports.inodeHandler = function(request, response, next) {

    var id = request.params.id;
    
    var search = indexer.beginInodeGet(id);

    search.on('found', function(inode) {
        console.log('found');
        request.inode = inode;
        next();
    });

    search.on('notFound', function() {
        console.log('not found');
        response.writeHead(404);
        response.end('This inode doesn\'t exists.');
        tools.errorHandler(response)({notFound: true, type: 'inode', id: id});
    });

    search.on('error', tools.errorHandler(response));

    search.process();

};

exports.tagsHandler = function(request, response, next)
{
    var tags = request.path.substr(6).split('/');
    request.tags = [];

    for ( var i=0 ; i<tags.length ; i++ ) {
        if ( tags[i] ) {
            request.tags.push(tags[i]);
        }
    }

    next();
};

exports.checkSentInode = function(sentInode, foundCallback, errorCallback) {

    var search = indexer.beginInodeGet(sentInode.id);

    search.on('found', function(inode) {
        foundCallback(inode);
    });

    search.on('notFound', function() {
        errorCallback({notFound: true, type: 'inode', inode: sentInode, id: sentInode.id});
    });

    search.on('error', function() {
        errorCallback({error: true, type: 'inode', inode: sentInode, id: sentInode.id});
    });

    search.process();

};
