var ElasticSearchClient = require('elasticsearchclient');
var util = require('util');
var events = require('events');
var _ = require('underscore');

var tools = require('./tools');
var config = require('./config');

var serverOptions = {
    host: config.get('elasticSearchHost'),
    port: config.get('elasticSearchPort')
};

var index = config.get('elasticSearchIndex');
var inodeType = 'inode';

var client = new ElasticSearchClient(serverOptions);





exports.indexInode = function(inode, doneCallback, errorCallback) {

    var ci = client.index(index, inodeType, inode, inode.id);
    ci.on('done', function() {
        tools.logger.info('indexation of %s done.', inode.id);
        doneCallback(inode);
    });
    ci.on('error', function(error) {
        errorCallback( new tools.InodeError(inode, {source: error}) );
    });
    tools.logger.info('indexation of %s ready.', inode.id);
    ci.exec();

};






util.inherits(InodeIndexer, events.EventEmitter);

function InodeIndexer() {};

InodeIndexer.prototype.index = function(inode) {

    var that = this;
    var ci = client.index(index, inodeType, inode, inode.id);
    ci.on('done', function() {
        tools.logger.info('indexation of %s done.', inode.id);
        that.emit('finish', inode);
    });
    ci.on('error', function(error) {
        tools.logger.info('indexation of %s failed.', inode.id);
        that.emit('error',  new tools.InodeError(inode, {source: error}) );
    });
    tools.logger.info('indexation of %s ready.', inode.id);
    ci.exec();

};

exports.InodeIndexer = InodeIndexer;









exports.deleteInode = function(inode, doneCallback, errorCallback) {

    var ci = client.deleteByQuery(index, inodeType, {query:{term:{id:inode.id}}});
    ci.on('done', doneCallback);
    ci.on('error', function(error) {
        errorCallback( new tools.InodeError(inode, {source: error}) );
    });
    tools.logger.info('delete of '+ inode.id +' ready.');
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

    tools.logger.info('initializing GET of '+ this._id);

    var that = this;
    var cs = client.get(index, inodeType, this._id);

    cs.on('data', function(data) {
        tools.logger.info('got '+ data);
        var result = JSON.parse(data);
        if ( result.exists ) {
            that.emit('found', result._source);
        } else {
            that.emit('error', new tools.InodeError({id: that._id}, {notFound: true}));
        }
    });

    cs.on('error', function(error) {
        tools.logger.info('error while getting '+ this._id);
        that.emit('error', new tools.InodeError(inode, {source: error}));
    });

    cs.exec();

};






exports.beginInodeSearch = function(parameters) {
    return new InodeSearch(parameters);
};

function InodeSearch(parameters) {
    this.parameters = _.extend({
        "page" : 1
    }, parameters);
};

util.inherits(InodeSearch, events.EventEmitter);

InodeSearch.prototype.process = function() {

    tools.logger.info('initializing search');

    var setSize = 50;
    var from = (this.parameters.page-1) * setSize;
    var that = this;
    var cs = client.search(index, inodeType, {
        "from" : from,
        "size" : setSize,
        "query" : this.parameters.query,
        "facets" : {
              "tags" : {
                  "terms" : {
                      "field" : "tags",
                      "size" : setSize
                  }
              }
        }
    });

    cs.on('data', function(data) {
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
        tools.logger.info('error while searching');
        that.emit('error', new tools.Error({source: error}) );
    });
    cs.exec();
    
};
