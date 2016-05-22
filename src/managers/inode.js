import Indexer from './indexer';
import { errorHandler } from '../lib/tools';

const inodeTemplate = {
    id: undefined,
    tags: [],
    metadata: [],
    owner: '',
    groups: [],
};


export const inodeIndexer = new Indexer('inode', inodeTemplate);

export function inodeHandler(request, response, next) {

    const id = request.params.id;

    inodeIndexer
        .get(id)
        .then((inode) => {
            console.log('rzerarez');
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
