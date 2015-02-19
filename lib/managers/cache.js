/**
 * Created by max on 15/02/15.
 */

var redis = require("redis");
var tools = require('../tools');

client = redis.createClient(6379, '192.168.1.5');

exports.cachedIndexer = function(indexer) {

    var cacheKey = function(id) {
        return 'cache.'+ indexer.type + '.'+ id;
    }

    return {

        type: indexer.type,

        index: function(document) {

            client.set(cacheKey(id), JSON.stringify(document));
            return indexer.index(document);

        },

        get: function(id) {

            tools.logger.info('Check for cache %s %s.', indexer.type, id);

            return new Promise(function(resolve, reject) {

                client.get(cacheKey(id), function(err, reply) {

                    if ( err || reply===null ) {

                        tools.logger.info('Not found or error. Get sent for %s %s.', indexer.type, id);
                        indexer
                            .get(id)
                            .then(function(document) {

                                resolve(document);
                                client.set(cacheKey(id), JSON.stringify(document));

                            })
                            .catch(reject);

                    } else {

                        tools.logger.info('Document %s %s found in cache.', indexer.type, id);
                        resolve( JSON.parse(reply) );

                    }

                })

            });


            return indexer.get(id)
        },

        search: indexer.search,

        delete: function(id) {

            client.set(cacheKey(id), null);
            return indexer.delete(id);

        }

    };

};