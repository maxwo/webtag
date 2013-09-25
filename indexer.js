var ElasticSearchClient = require('elasticsearchclient');

var util = require('util');
var events = require('events');

var serverOptions = {
    host: 'localhost',
    port: 9200
};

var index = 'webtag';
var inodeType = 'inode';

var client = new ElasticSearchClient(serverOptions);





exports.indexInode = function(inode, done, error) {

    var ci = client.index(index, inodeType, inode, inode.id);
    ci.on('done', done);
    ci.on('error', error);
    console.log('indexation of '+ inode.id +' ready.');
    ci.exec();

};


exports.deleteInode = function(inode, done, error) {

    var ci = client.deleteByQuery(index, inodeType, {query:{term:{id:inode.id}}});
    ci.on('done', done);
    ci.on('error', error);
    console.log('delete of '+ inode.id +' ready.');
    ci.exec();

};






exports.beginInodeGet = function(id) {
    return new InodeGet(id);
};

function InodeGet(id) {
    this._id = id;
};

util.inherits(InodeGet, events.EventEmitter);

InodeGet.prototype.process = function() {

    console.log('initializing GET of '+ this._id);

    var that = this;
    var cs = client.get(index, inodeType, this._id);

    cs.on('data', function(data) {
        console.log('got '+ data);
        var result = JSON.parse(data);
        if ( result.exists ) {
            that.emit('found', result._source);
        } else {
            that.emit('notFound', that._id);
        }
    });

    cs.on('error', function(error) {
        console.log('error while getting '+ this._id);
        that.emit('error', error, that._id);
    });

    cs.exec();

};






exports.beginInodeSearch = function(query) {
    return new InodeSearch(query);
};

function InodeSearch(query) {
    this._query = query;
};

util.inherits(InodeSearch, events.EventEmitter);

InodeSearch.prototype.process = function() {

    console.log('initializing search');

    var that = this;
    var cs = client.search(index, inodeType, {
        "query" : this._query,
        "facets" : {
              "tags" : { "terms" : {"field" : "tags"} }
        }
    });

    cs.on('data', function(data) {
        console.log('search complete : '+ JSON.stringify(data, undefined, 4));
        var result = JSON.parse(data);
        var inodes = [];
        var tags = [];
        if ( result.hits.total>0 ) {
            for ( var i=0 ; i<result.hits.hits.length  ; i++ ) {
                inodes.push(result.hits.hits[i]._source);
            }
        }
        if ( result.facets.tags.terms.length>0 ) {
            for ( var j=0 ; j<result.facets.tags.terms.length ; j++ ) {
                tags.push({ "tag" : result.facets.tags.terms[j].term , "count" : result.facets.tags.terms[j].count });
            }
        }
        that.emit('found', inodes, tags);
    });

    cs.on('error', function(error) {
        console.log('error while searching');
        that.emit('error', error);
    });
    cs.exec();
    
};