var port = 1227;
var host = '192.168.1.10';

var express = require('express');
var storage = require('./localStorage');
var indexer = require('./indexer');

var app = express();

app.use(express.basicAuth('max', 'secret'));

app.get('/data/:id', function(request, response) {

    var id = request.params.id;
    var s = storage.beginRetrieval(id);
    
    s.on('end', function() {
        console.log('End of transfert');
    });
  
    s.on('notFound', function() {
        response.writeHead(404);
        response.end('This file doesn\'t exists.');
    });
  
    s.on('error', defaultErrorHandler);
  
    s.process(response);
  
});

app.post('/data', function(request, response)
{

    var s = storage.beginStorage();
    
    var postErrorHandler = function() {
        s.clean();
        defaultErrorHandler();
    };
    
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
        } , postErrorHandler);
            
    });
  
    s.on('error', postErrorHandler);
  
    s.process(request);
   
});
    
var defaultErrorHandler = function() {
    console.log('Error while processing a request');
    response.writeHead(500);
    response.end('An error occured while completing your request.');
};

app.listen(process.env.PORT || port);

