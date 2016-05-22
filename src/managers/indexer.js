/**
 * Created by max on 09/02/15.
 */

let ElasticSearchClient = require('elasticsearchclient');
let _ = require('underscore');

let tools = require('../lib/tools');
let config = require('../lib/config');
let crypto = require('crypto');

let serverOptions = {
    host: config.get('elasticSearchHost'),
    port: config.get('elasticSearchPort')
};

let client = new ElasticSearchClient(serverOptions);
let index = config.get('elasticSearchIndex');

exports.indexer = function(type, template) {

    return {

        type: type,

        index: function(document) {

            if (typeof document.id === 'undefined') {
                let shasum = crypto.createHash('sha512');
                shasum.update('$*_salt' + Math.random());
                document.id = shasum.digest('hex');
            }

            document = _.extend({}, template, document);

            return new Promise(function(resolve, reject) {

                let ci = client.index(index, type, document, document.id);
                ci.on('done', function() {
                    tools.logger.info('Indexation of %s %s done.', type, document.id);
                    resolve(document);
                });
                ci.on('error', function(error) {
                    tools.logger.error('Error while indexing %s %s.', type, document.id);
                    reject(new tools.DocumentError(document, {
                        source: error
                    }));
                });
                tools.logger.info('Indexation of %s %s ready.', type, document.id);
                ci.exec();

            });

        },

        delete: function(document) {

            return new Promise(function(resolve, reject) {

                let ci = client.deleteByQuery(index, type, {
                    query: {
                        term: {
                            id: document.id
                        }
                    }
                });
                console.log({
                    query: {
                        term: {
                            id: document.id
                        }
                    }
                });
                ci.on('done', function() {
                    tools.logger.info('Deletion of %s %s done.', type, document.id);
                    resolve(document.id);
                });
                ci.on('error', function(error) {
                    tools.logger.error(error);
                    reject(new tools.DocumentError(document, {
                        source: error
                    }));
                });
                tools.logger.info('Deletion of %s %s ready.', type, document.id);
                ci.exec();

            });

        },

        get: function(id) {

            return new Promise(function(resolve, reject) {

                let cs = client.get(index, type, id);
                cs.on('data', function(data) {
                    let result = JSON.parse(data);
                    if (result.found) {
                        tools.logger.info('Document %s %s found.', type, id);
                        resolve(result._source);
                    } else {
                        tools.logger.info('Document %s %s not found.', type, id);
                        reject(new tools.DocumentError({
                            id: id
                        }, {
                            notFound: true
                        }));
                    }
                });
                cs.on('error', function(error) {
                    tools.logger.info('error while getting %s %s', type, id);
                    reject(new tools.DocumentError(document, {
                        source: error
                    }));
                });
                cs.exec();
                tools.logger.info('Retrieval of %s %s ready.', type, id);

            });

        },

        search: function(query, from, limit, facets) {

            return new Promise(function(resolve, reject) {

                tools.logger.info('Initializing search of %s.', type);

                let sendQuery = {
                    "from": from,
                    "size": limit,
                    "query": query
                };

                if (facets) {
                    sendQuery.facets = facets;
                }

                let cs = client.search(index, type, sendQuery);

                cs.on('data', function(data) {

                    let result = JSON.parse(data);

                    console.log(data);

                    let documents = [];
                    let tags = [];
                    if (result.hits.total > 0) {
                        for (let i = 0; i < result.hits.hits.length; i++) {
                            documents.push(result.hits.hits[i]._source);
                        }
                    }
                    if (result.facets.tags.terms.length > 0) {
                        for (let j = 0; j < result.facets.tags.terms.length; j++) {
                            tags.push({
                                "tag": result.facets.tags.terms[j].term,
                                "count": result.facets.tags.terms[j].count
                            });
                        }
                    }
                    resolve({
                        documents: documents,
                        tags: tags
                    });
                });
                cs.on('error', function(error) {
                    tools.logger.info('Error while searching %s.', type);
                    reject(new tools.Error({
                        source: error
                    }));
                });
                cs.exec();

            });

        }
    };

};
