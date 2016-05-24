import Indexer from '../lib/indexer';
import equal from 'deep-equal';
import { errorHandler } from '../lib/tools';

const readOnlyTemplate = {
    id: null,
    contentType: null,
    owner: null,
    groups: null,
    uploadDate: null,
    states: null,
};

const inodeTemplate = {
    id: null,
    filename: null,
    contentType: null,
    tags: [],
    metadata: [],
    owner: null,
    groups: [],
    uploadDate: null,
    indexedDate: null,
    archivedDate: null,
    deletionDate: null,
    documentDate: null,
    states: {
        received: false,
        indexed: false,
        archived: false,
        deleted: false,
    },
};


export const inodeIndexer = new Indexer('inode', inodeTemplate);

export function inodeHandler(request, response, next) {
    inodeIndexer
        .get(request.params.id)
        .then((inode) => {
            request.inode = inode;
            next();
        })
        .catch(errorHandler(response));
}

export function cleanUpInode(inode) {
    const i = Object.assign({}, inode);
    i.file.location = undefined;
    i.textContent = undefined;
    return i;
}

export function checkInodeModification(inodeSent, currentInode) {
    // Check if new unknown fields
    for (const f of inodeTemplate) {
        if (typeof inodeSent[f] === 'undefined') {
            return false;
        }
    }
    
    // Check for read-only fields
    for (const f of readOnlyTemplate) {
        if (!equal(inodeSent[f], currentInode[f])) {
            return false;
        }
    }

    return true;
}

export function tagsHandler(request, response, next) {
    const tags = request.path.substr(10).split('/');
    request.tags = tags.filter((tag) => typeof tag !== 'undefined');

    next();
}
