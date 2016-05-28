import { log, errorHandler } from '../../lib/tools';
import buildQuery from '../../lib/elasticSearchQuery';
import extractParameters from '../../lib/httpSearchQuery';
import { inodeIndexer, inodeAggregations } from '../../managers/inode';


function getAggregates(request, response) {
    const { words, tags } = extractParameters(request);
    const query = buildQuery(tags, words);

    inodeIndexer
        .search(query, 0, 100, inodeAggregations)
        .then((results) => {
            response
                .status(200)
                .type('json')
                .end(JSON.stringify(results.aggs, null, 4));
        })
        .catch(errorHandler(response));
}

export default function initAggregatesEndPoints(app) {
    log.info('Initializing aggregates end points.');
    app.get('/api/aggregates', getAggregates);
    log.info('End initialization aggregates end points.');
}
