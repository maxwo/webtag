var ElasticSearchClient = require('elasticsearchclient');

var serverOptions = {
    host: 'localhost',
    port: 9200
};

var index = 'webtag';
var inodeType = 'inode';

var client = new ElasticSearchClient(serverOptions);

exports.indexInode = function(inode, done, error) {
    var ci = client.index(index, inodeType, inode);
    ci.on('data', done);
    ci.on('error', error);
    console.log('indexation of '+ inode.id +' ready.');
    ci.exec();
};

exports.beginInodeSearch = function(query) {
    return new InodeSearch(query);
};

function InodeSearch(query) {
    this._query = query;
    this._handlers = {};
};

InodeSearch.prototype.process = function() {

    console.log('initializing search');
    console.log(this._query);
    var that = this;
    var cs = client.search(index, inodeType, {"query":{"term": this._query}});
    cs.on('data', function(data) {
        console.log('search complete');
        var result = JSON.parse(data);
        if ( result.hits.total>0 ) {
            that.fireEvent('found', result.hits.hits[0]._source);
        } else {
            that.fireEvent('notFound');
        }
    });
    cs.on('error', function(error) {
        console.log('error while searching');
        that.fireEvent('error', error);
    });
    cs.exec();
    
};

InodeSearch.prototype.on = function(event, callback) {
    this._handlers[event] = callback;
};

InodeSearch.prototype.fireEvent = function(event, object) {
    if ( typeof this._handlers[event]==='function' ) {
        this._handlers[event](object);
    }
};