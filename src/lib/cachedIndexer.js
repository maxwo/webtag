/**
 * Created by max on 15/02/15.
 */

import redis from 'redis';
import { log } from '../lib/tools';
import config from '../lib/config';
import Indexer from './indexer';

log.info('Connecting to redis on %s:%s', config.get('redisHost'), config.get('redisPort'));
const client = redis.createClient(config.get('redisPort'), config.get('redisHost'));

export default class CachedIndexer extends Indexer {

    constructor(type, template, ttl = 60) {
        super(type, template);
        this.ttl = ttl;
    }

    cacheKey(id) {
        return `cache.${this.type}.${id}`;
    }

    index(document) {
        return super
            .index(document)
            .then((doc) => {
                const cacheId = this.cacheKey(doc.id);
                log.info(`Setting ${cacheId} into cache.`);
                client.set(cacheId, JSON.stringify(doc));
                client.expire(cacheId, this.ttl);
                return doc;
            });
    }

    get(id) {
        log.info('Check for cache %s %s.', this.type, id);

        return new Promise((resolve, reject) => {
            const cacheId = this.cacheKey(id);
            client.get(cacheId, (err, reply) => {
                if (err || reply === null) {
                    log.info('Not found or error. Get sent for %s %s.', this.type, id);
                    super
                        .get(id)
                        .then((document) => {
                            resolve(document);

                            client.set(cacheId, JSON.stringify(document));
                            client.expire(cacheId, this.ttl);
                        })
                        .catch(reject);
                } else {
                    log.info('Document %s %s found in cache.', this.type, id);
                    resolve(JSON.parse(reply));
                }
            });
        });
    }

    delete(id) {
        client.set(this.cacheKey(id), null);
        return super.delete(id);
    }

}
