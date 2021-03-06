/**
 * Created by max on 09/02/15.
 */

import ElasticSearchClient from 'elasticsearchclient';
import uuid from 'node-uuid';
import { log, DocumentError, Error } from '../lib/tools';
import { setAggregatedDate } from '../managers/inode';
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
        if (typeof document.id === 'undefined') {
            document.id = uuid.v4();
        }

        document = Object.assign({}, this.template, document);

        // Dirty. Put this in inode.
        // document.uploadDate = document.file.uploadDate;
        document = setAggregatedDate(document, 'creation', new Date());
        document.states.received = true;

        document.file.uploadDate = undefined;
        // End of dirty stuffs.

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
                    /* eslint-disable no-underscore-dangle */
                    resolve(result._source);
                    /* eslint-enable no-underscore-dangle */
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

    search(query, aggregations = {}, from = 0, limit = 100) {
        return new Promise((resolve, reject) => {
            log.info('Initializing search of %s.', this.type);

            const sendQuery = {
                from,
                size: limit,
                query,
            };

            console.log(JSON.stringify(sendQuery, null, 4));

            if (aggregations) {
                sendQuery.aggregations = aggregations;
            }

            const cs = client.search(index, this.type, sendQuery);

            cs.on('data', (data) => {
                const result = JSON.parse(data);
                const documents = [];
                const aggs = {};

                if (typeof result.hits !== 'undefined' && result.hits.total > 0) {
                    for (let i = 0; i < result.hits.hits.length; i++) {
                        /* eslint-disable no-underscore-dangle */
                        documents.push(result.hits.hits[i]._source);
                        /* eslint-enable no-underscore-dangle */
                    }
                }

                if (result.aggregations) {
                    for (const agg in result.aggregations) {
                        const buckets = result.aggregations[agg].buckets;
                        aggs[agg] = [];
                        buckets.forEach((b) => {
                            aggs[agg].push({
                                key: b.key,
                                count: b.doc_count,
                            });
                        });
                    }
                }

                resolve({
                    documents,
                    aggregations: aggs,
                    from,
                    limit,
                    total: (result.hits ? result.hits.total : 0),
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
