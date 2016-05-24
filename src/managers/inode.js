import Indexer from '../lib/indexer';
import { errorHandler } from '../lib/tools';

const inodeTemplate = {
    id: undefined,
    filename: undefined,
    contentType: undefined,
    size: undefined,
    location: undefined,
    tags: [],
    metadata: [],
    owner: undefined,
    groups: [],
    uploadDate: undefined,
    indexedDate: undefined,
    archivedDate: undefined,
    deletionDate: undefined,
    documentDate: undefined,
    states: {
        received: false,
        indexed: false,
        archived: false,
        deleted: false,
    },
};


export const inodeIndexer = new Indexer('inode', inodeTemplate);

export function inodeHandler(request, response, next) {

    const id = request.params.id;

    inodeIndexer
        .get(id)
        .then((inode) => {
            request.inode = inode;
            next();
        })
        .catch(errorHandler(response));
}

export function tagsHandler(request, response, next) {
    const tags = request.path.substr(10).split('/');
    request.tags = tags.filter((tag) => typeof tag !== 'undefined');

    next();
}
