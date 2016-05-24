import storage from '../../lib/localStorage';
import { logger as log, errorHandler } from '../../lib/tools';
import { inodeIndexer, inodeHandler,
         cleanUpInode, checkInodeModification } from '../../managers/inode';

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
    app.get('/api/inode/:id', inodeHandler, getInode);
    app.put('/api/inode/:id', inodeHandler, putInode);
    app.delete('/api/inode/:id', inodeHandler, deleteInode);
    log.info('End initialization inode end points.');
}
