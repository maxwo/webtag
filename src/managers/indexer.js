/**
 * Created by max on 09/02/15.
 */

import ElasticSearchClient from 'elasticsearchclient';
import crypto from 'crypto';

import { logger as log, DocumentError, Error } from '../lib/tools';
import config from '../lib/config';

const serverOptions = {
    host: config.get('elasticSearchHost'),
    port: config.get('elasticSearchPort'),
};

const client = new ElasticSearchClient(serverOptions);
const index = config.get('elasticSearchIndex');

export default class Indexer {

    constructor(type, template) {
        this.type = type;
        this.template = template;
    }

    index(document) {
        console.log('***************');
        console.log(document);
        if (typeof document.id === 'undefined') {
            const shasum = crypto.createHash('sha512');
            shasum.update('$*_salt');
            shasum.update(''+Math.random());

            document.id = shasum.digest('hex');
        }

        document = Object.assign({}, this.template, document);
        console.log(document);

        return new Promise((resolve, reject) => {
            const ci = client.index(index, this.type, document, document.id);

            ci.on('done', () => {
                log.info('Indexation of %s %s done.', this.type, document.id);
                resolve(document);
            });

            ci.on('error', (error) => {
                log.error('Error while indexing %s %s.', this.type, document.id);
                reject(new DocumentError(document, {
                    source: error,
                }));
            });

            log.info('Indexation of %s %s ready.', this.type, document.id);
            ci.exec();
        });
    }

    delete(document) {
        return new Promise((resolve, reject) => {
            const ci = client.deleteByQuery(index, this.type, {
                query: {
                    term: {
                        id: document.id,
                    },
                },
            });

            ci.on('done', () => {
                log.info('Deletion of %s %s done.', this.type, document.id);
                resolve(document.id);
            });

            ci.on('error', (error) => {
                log.error(error);
                reject(new DocumentError(document, {
                    source: error,
                }));
            });

            log.info('Deletion of %s %s ready.', this.type, document.id);
            ci.exec();
        });
    }

    get(id) {
        log.info('Preparing retrieval of %s %s ready.', this.type, id);
        return new Promise((resolve, reject) => {
            const cs = client.get(index, this.type, id);

            cs.on('data', (data) => {
                const result = JSON.parse(data);
                if (result.found) {
                    log.info('Document %s %s found.', this.type, id);
                    resolve(result._source);
                } else {
                    log.info('Document %s %s not found.', this.type, id);
                    reject(new DocumentError({
                        id,
                    }, {
                        notFound: true,
                    }));
                }
            });

            cs.on('error', (error) => {
                log.info('error while getting %s %s', this.type, id);
                reject(new DocumentError(document, {
                    source: error,
                }));
            });

            cs.exec();
            log.info('Retrieval of %s %s ready.', this.type, id);
        });
    }

    search(query, from, limit, facets) {
        return new Promise((resolve, reject) => {
            log.info('Initializing search of %s.', this.type);

            const sendQuery = {
                from,
                size: limit,
                query,
            };

            if (facets) {
                sendQuery.facets = facets;
            }

            const cs = client.search(index, this.type, sendQuery);

            cs.on('data', (data) => {
                const result = JSON.parse(data);
                const documents = [];
                const tags = [];

                if (result.hits.total > 0) {
                    for (let i = 0; i < result.hits.hits.length; i++) {
                        documents.push(result.hits.hits[i]._source);
                    }
                }

                if (result.facets.tags.terms.length > 0) {
                    for (let j = 0; j < result.facets.tags.terms.length; j++) {
                        tags.push({
                            tag: result.facets.tags.terms[j].term,
                            count: result.facets.tags.terms[j].count,
                        });
                    }
                }

                resolve({
                    documents,
                    tags,
                });
            });

            cs.on('error', (error) => {
                log.info('Error while searching %s.', this.type);
                reject(new Error({
                    source: error,
                }));
            });

            cs.exec();
        });
    }
}
