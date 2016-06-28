import { log, errorHandler } from '../../lib/tools';
import buildQuery from '../../lib/elasticSearchQuery';
import extractParameters from '../../lib/httpSearchQuery';
import { inodeIndexer, inodeAggregations } from '../../managers/inode';


function getAggregates(request, response) {
    const {
        words,
        tags,
        owners,
        groups,
        creationDays,
        creationMonths,
        creationYears,
        documentDays,
        documentMonths,
        documentYears,
    } = extractParameters(request);

    const query = buildQuery(
        request.user,
        tags,
        words,
        owners,
        groups,
        creationDays,
        creationMonths,
        creationYears,
        documentDays,
        documentMonths,
        documentYears);

    inodeIndexer
        .search(query, inodeAggregations)
        .then((results) => {
            results.documents = undefined;
            results.from = undefined;
            results.limit = undefined;

            response
                .status(200)
                .type('json')
                .end(JSON.stringify(results, null, 4));
        })
        .catch(errorHandler(response));
}

export default function initAggregatesEndPoints(app) {
    log.info('Initializing aggregates end points.');
    app.get('/api/aggregates', getAggregates);
    log.info('End initialization aggregates end points.');
}
