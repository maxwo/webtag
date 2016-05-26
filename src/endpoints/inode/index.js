import storage from '../../lib/localStorage';
import { log, errorHandler } from '../../lib/tools';
import buildQuery from '../../lib/elasticSearchQuery';
import { inodeIndexer, inodeHandler,
         cleanUpInode, checkInodeModification } from '../../managers/inode';

const aggregations = {
    group_by_state: {
        terms: {
            field: 'tags',
            size: 20,
        },
    },
};

function getInodes(request, response) {
    let words;
    let tags;

    if (typeof request.query.tag === 'string') {
        request.query.tag = [request.query.tag];
    }

    if (typeof request.query.tag === 'object') {
        tags = request.query.tag;
    }

    if (typeof request.query.text === 'string') {
        words = request.query.text
            .split(',')
            .filter((t) => t.length > 0);
    }

    const query = buildQuery(tags, words);

    inodeIndexer
        .search(query, 0, 100, aggregations)
        .then((results) => {
            response
                .status(200)
                .send(JSON.stringify(results, null, 4));
        })
        .catch(errorHandler(response));
}

function getInode(request, response) {
    response.end(JSON.stringify(cleanUpInode(request.inode)));
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
