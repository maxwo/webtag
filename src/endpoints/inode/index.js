import storage from '../../lib/localStorage';
import { log, errorHandler } from '../../lib/tools';
import extractParameters from '../../lib/httpSearchQuery';
import buildQuery from '../../lib/elasticSearchQuery';
import { inodeIndexer, inodeHandler, inodeAggregations,
         cleanUpInode, checkInodeModification } from '../../managers/inode';

function getInodes(request, response) {
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
            results.documents = results.documents.map((d) => d.id);
            results.aggregations = undefined;

            response
                .status(200)
                .type('json')
                .end(JSON.stringify(results, null, 4));
        })
        .catch(errorHandler(response));
}

function getInode(request, response) {
    response
        .type('json')
        .end(JSON.stringify(cleanUpInode(request.inode)));
}

function putInode(request, response) {
    if (!checkInodeModification(request.body, request.inode)) {
        response
            .status(401);
    } else {
        const inode = Object.assign({}, request.inode, request.body);

        inodeIndexer
            .index(inode)
            .then(() => {
                response.write(JSON.stringify(cleanUpInode(request.inode), null, 4));
                response.end();
            })
            .catch(errorHandler(response));
    }
}

function deleteInode(request, response) {
    inodeIndexer
        .delete(request.inode)
        .then(() => {
            response.write('');
            response.end();
            storage.delete(request.inode.id);
        })
        .catch(errorHandler(response));
}

export default function initInodeEndPoints(app) {
    log.info('Initializing inode end points.');
    app.get('/api/inode', getInodes);
    app.get('/api/inode/:id', inodeHandler, getInode);
    app.put('/api/inode/:id', inodeHandler, putInode);
    app.delete('/api/inode/:id', inodeHandler, deleteInode);
    log.info('End initialization inode end points.');
}
