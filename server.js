var port = 1227;
var host = '192.168.1.10';

var express = require('express');
var storage = require('./localStorage');
var indexer = require('./indexer');

var app = express();

app.use('/inode/', express.bodyParser());
app.use(express.basicAuth('max', 'secret'));
app.use(express.limit(1*1024*1024*1024));


var inodeHandler = function(request, response, next) {

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
    });

    search.on('error', defaultErrorHandler(response));

    search.process();

};



app.get('/inode/:id', inodeHandler, function(request, response) {

    response.end(JSON.stringify(request.inode));

});

app.put('/inode/:id', inodeHandler, function(request, response) {

    var inode = request.inode;
    var sentInode = request.body;
    for ( var i in inode ) {
        if ( sentInode[i] ) {
            inode[i] = sentInode[i];
        }
    }

    indexer.indexInode(inode, function() {
        response.write(JSON.stringify(inode, null, 4));
        response.end();
    } , defaultErrorHandler(response));


    response.end();

});

app.delete('/inode/:id', inodeHandler, function(request, response) {

    var inode = request.inode;
    var sentInode = request.body;
    for ( var i in inode ) {
        if ( sentInode[i] ) {
            inode[i] = sentInode[i];
        }
    }

    indexer.deleteInode(inode, function() {
        response.write(JSON.stringify(inode, null, 4));
        response.end();
    } , defaultErrorHandler(response));


    response.end();

});







app.get('/data/:id', inodeHandler, function(request, response) {

    var inode = request.inode;

    var s = storage.beginRetrieval(inode.id);

    s.on('end', function() {
        console.log('End of transfert');
    });
    s.on('error', defaultErrorHandler(response));

    s.process(response);

});

app.post('/data', function(request, response) {

    var s = storage.beginStorage();

    s.on('end', function() {

        console.log('End of transfert, beginning indexation');
        var inode = {
            id: s.id(),
            filename: s.id(),
            'content-type': request.headers['content-type'],
            tags: [],
            owner: request.user,
            size: s.processedBytes(),
            groups: []
        };

        indexer.indexInode(inode, function() {

            var rep = {
                id: s.id(),
                inode: inode,
                file:'http://'+host+':'+port+'/data/'+ s.id()
            };

            response.write(JSON.stringify(rep, null, 4));
            response.end();
        } , postErrorHandler(response), s.id());

    });

    s.on('error', function(response) {
          s.clean();
          defaultErrorHandler(response)();
    });

    s.process(request);

});




app.get('/tags/*', function(request, response) {

    var tags = request.path.substr(6).split('/');

    var query = {"bool": {"must":[]}};
    for ( var i=0 ; i<tags.length ; i++ ) {
        if ( tags[i] ) {
            query.bool.must.push({ "term": {"tags":tags[i]} });
        }
    }

    if ( query.bool.must.length===0 ) {
        query = {"match_all" : {}};
    }

    console.log(JSON.stringify(query, undefined, 4));

    var search = indexer.beginInodeSearch(query);

    search.on('found', function(inodes, tags) {
        response.end(JSON.stringify( {"tags": tags, "inodes": inodes} , undefined, 4));
    });

    search.on('error', defaultErrorHandler(response));

    search.process();

});




    
var defaultErrorHandler = function(response) {
    return function() {
        console.log('Error while processing a request');
        response.writeHead(500);
        response.end('An error occured while completing your request.');
    };
};

app.listen(process.env.PORT || port);

