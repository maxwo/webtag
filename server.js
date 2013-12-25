var express = require('express');
var authentication = require('./authentication');
var storage = require('./localStorage');
var indexer = require('./indexer');
var tools = require('./tools');
var inodeManager = require('./managers/inode');
var config = require('./config');

var app = express();

app.use('/user/', express.bodyParser());
app.use('/inode/', express.bodyParser());
app.use('/tags/', express.bodyParser());
app.use(express.methodOverride());
app.use(express.basicAuth( authentication.authenticate ));
app.use(express.limit(1*1024*1024*1024));
app.use(express.logger());
app.use(function(error, request, response, next) {
    if (!err) return next();
    tools.errorHandler(response)({error:true, source: err});
});





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







app.get('/inode/:id', inodeManager.inodeHandler, function(request, response) {

    response.end(JSON.stringify(request.inode));

});

app.put('/inode/:id', inodeManager.inodeHandler, function(request, response) {

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
    } , tools.errorHandler(response));


    response.end();

});

app.delete('/inode/:id', inodeManager.inodeHandler, function(request, response) {

    indexer.deleteInode(request.inode, function() {
        response.write(JSON.stringify(inode, null, 4));
        response.end();
    } , tools.errorHandler(response));


    response.end();

});







app.get('/data/:id', inodeManager.inodeHandler, function(request, response) {

    var inode = request.inode;

    var s = storage.beginRetrieval(inode.id);

    s.on('end', function() {
        tools.logger.info('End of transfert');
    });
    s.on('error', tools.errorHandler(response));

    s.process(response);

});

app.post('/data', function(request, response) {

    var s = storage.beginStorage();

    s.on('end', function() {

        tools.logger.info('End of transfert, beginning indexation');

        var inode = inodeManager.inode();
        inode['id'] = s.id();
        inode['filename'] = s.id();
        inode['content-type'] = request.headers['content-type'];
        inode['owner'] = request.user.login;
        inode['groups'] = request.user.groups;
        inode['size'] = s.processedBytes();
        inode['data'] = 'http://'+ config.get('httpHost') +':'+ config.get('httpPort') +'/data/'+ s.id();

        indexer.indexInode(inode, function() {

            var rep = {
                id: s.id(),
                inode: inode,
                file: 'http://'+ config.get('httpHost') +':'+ config.get('httpPort') +'/data/'+ s.id()
            };

            response.write(JSON.stringify(rep, null, 4));
            response.end();
        } , tools.errorHandler(response), s.id());

    });

    s.on('error', function(error) {
          s.clean();
          tools.errorHandler(response)(error);
    });

    s.process(request);

});

app.put('/data/:id', inodeManager.inodeHandler, function(request, response) {

    var s = storage.beginStorage(request.inode.id);

    s.on('end', function() {

        request.inode.size = s.processedBytes();

        indexer.indexInode(inode, function() {

            response.write(JSON.stringify(inode, null, 4));
            response.end();

        } , tools.errorHandler(response), request.inode.id);

    });

    s.on('error', function(response) {
          s.clean();
          tools.errorHandler(response)();
    });

    s.process(request);

})




app.get('/tags/*', inodeManager.tagsHandler, function(request, response) {

    var query = {"bool": {"must":[]}};
    for ( var i=0 ; i<request.tags.length ; i++ ) {
        if ( request.tags[i] ) {
            query.bool.must.push({ "term": {"tags":request.tags[i]} });
        }
    }

    if ( query.bool.must.length===0 ) {
        query = {"match_all" : {}};
    }

    var search = indexer.beginInodeSearch(query);

    search.on('found', function(inodes, tags) {

        var filtered_tags = [];
        for ( var i=0 ; i<tags.length ; i++ ) {
            var found = false;
            for ( var j=0 ; j<request.tags.length ; j++ ) {
                if ( request.tags[j]===tags[i].tag ) {
                    found = true;
                }
            }
            if ( !found ) {
                filtered_tags.push(tags[i]);
            }
        }
        response.end(JSON.stringify( {"tags": filtered_tags, "inodes": inodes} , undefined, 4));
    });

    search.on('error', tools.errorHandler(response));

    search.process();

});

app.put('/tags/*', inodeManager.tagsHandler, function(request, response) {

    inodeManager.checkSentInode(request.body, function(inode) {

        for ( var i=0 ; i<request.tags.length ; i++ ) {
            var t = request.tags[i];
            if ( inode.tags.indexOf(t)===-1 ) {
                inode.tags.push(t);
            }
        }

        indexer.indexInode(inode, function() {

            response.write(JSON.stringify(inode, null, 4));
            response.end();

        } , tools.errorHandler(response), inode.id);

    } , tools.errorHandler(response) );
});

app.delete('/tags/*', inodeManager.tagsHandler, function(request, response) {

    inodeManager.checkSentInode(request.body, function(inode) {

        var newTags = [];
        for ( var i=0 ; i<inode.tags.length ; i++ ) {
            if ( request.tags.indexOf(inode.tags[i])==-1 ) {
                newTags.push(inode.tags[i]);
            }
        }

        inode.tags = newTags;

        indexer.indexInode(inode, function() {

            response.write(JSON.stringify(inode, null, 4));
            response.end();

        } , tools.errorHandler(response), inode.id);

    } , tools.errorHandler(response) );
});

console.log(config.get('httpPort'));
console.log(config.get('httpHost'));

app.listen(config.get('httpPort'), config.get('httpHost'));

