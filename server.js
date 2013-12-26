var express = require('express');
var _ = require('underscore');

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
app.use(express.logger());
app.use(function(error, request, response, next) {
    if (!err) {
        return next();
    }
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

    var inode = _.extend(request.inode, request.body);

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

        var inode = inodeManager.inode({
            id : s.id() ,
            filename : s.id() ,
            'content-type' : request.headers['content-type'],
            owner : request.user.login,
            groups : request.user.groups,
            size : s.processedBytes(),
            data : 'http://'+ config.get('httpHost') +':'+ config.get('httpPort') +'/data/'+ s.id()
	});

        indexer.indexInode(inode, function() {

            var rep = {
                id: s.id(),
                inode: inode,
                file: 'http://'+ config.get('httpHost') +':'+ config.get('httpPort') +'/data/'+ s.id()
            };

            response.send(201, JSON.stringify(rep, null, 4));
            
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

    s.on('error', function(error) {
          s.clean();
          tools.errorHandler(response)(error);
    });

    s.process(request);

})




app.get('/tags/*', inodeManager.tagsHandler, function(request, response) {

    var query = {"bool": {"must":[]}};

    _.each(request.tags, function(tag) {
        query.bool.must.push({ "term": {"tags":tag} });
    });

    if ( query.bool.must.length===0 ) {
        query = {"match_all" : {}};
    }

    var search = indexer.beginInodeSearch(query);

    search.on('found', function(inodes, tags) {

	var filtered_tags = _.filter(tags, function(tag) {
            return request.tags.indexOf(tag.tag)===-1;
        });

        response.end(JSON.stringify( {"tags": filtered_tags, "inodes": inodes} , undefined, 4));
    });

    search.on('error', tools.errorHandler(response));

    search.process();

});

app.put('/tags/*', inodeManager.tagsHandler, function(request, response) {

    inodeManager.checkSentInode(request.body, function(inode) {

        inode.tags = _.union(inode.tags, request.tags);

        indexer.indexInode(inode, function() {

            response.write(JSON.stringify(inode, null, 4));
            response.end();

        } , tools.errorHandler(response), inode.id);

    } , tools.errorHandler(response) );
});

app.delete('/tags/*', inodeManager.tagsHandler, function(request, response) {

    inodeManager.checkSentInode(request.body, function(inode) {

        inode.tags = _.filter(inode.tags, function(tag) {
            return request.tags.indexOf(tag)!==-1;
        });

        indexer.indexInode(inode, function() {

            response.write(JSON.stringify(inode, null, 4));
            response.end();

        } , tools.errorHandler(response), inode.id);

    } , tools.errorHandler(response) );
});

console.log(config.get('httpPort'));
console.log(config.get('httpHost'));

app.listen(config.get('httpPort'), config.get('httpHost'));

