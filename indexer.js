var ElasticSearchClient = require('elasticsearchclient');

var serverOptions = {
    host: 'localhost',
    port: 9200
};

var index = 'tagfs';

var client = new ElasticSearchClient(serverOptions);

exports.indexInode = function(inode, done, error) {
    var ii = client.index(index, 'inode', inode);
    ii.on('data', done);
    ii.on('error', error);
    console.log('indexation of '+ inode.id +' ready.');
    ii.exec();
};

exports.beginInodeSearch = function(parameters) {
    return new InodeSearch();
};

function InodeSearch(query, resultCallback) {
    this._query = query;
    this._resultCallback = resultCallback;
};

InodeSearch.prototype.on = function(event, callback) {
    this._handlers[event] = callback;
};


InodeSearch.prototype.process = function() {
    
};

InodeSearch.prototype.fireEvent = function(event) {
    if ( typeof this._handlers[event]==='function' ) {
        this._handlers[event]();
    }
};