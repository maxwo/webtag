import parse from '../../lib/form';
import storage from '../../lib/localStorage';
import { logger as log, errorHandler } from '../../lib/tools';
import mime from 'mime-types';
import { inodeIndexer, inodeHandler, cleanUpInode } from '../../managers/inode';
import { inodeSaved } from '../../managers/notification';

function postData(request, response) {
    // Store the files
    parse(request)

    // Save the inodes
    .then((data) => {
        const tags = [];
        const promises = [];

        if (data.parameters.tags) {
            tags.push.apply(tags,
                data.parameters.tags.split(',')
                    .map((tag) => tag.trim())
                    .filter((tag) => tag !== ''));
        }

        if (data.files) {
            for (const file of data.files) {
                promises.push(inodeIndexer.index({
                    filename: file.filename,
                    contentType: mime.lookup(file.filename),
                    tags,
                    owner: request.user.login,
                    groups: request.user.groups,
                    file,
                }));
            }
        }

        return Promise.all(promises);
    })

    // Send inodes to client
    .then((inodes) => {
        response
            .status(201)
            .send(JSON.stringify(inodes.map((i) => cleanUpInode(i)), null, 4));

        inodes.forEach(inodeSaved);
    })

    .catch(errorHandler);
}

function getData(request, response) {
    const s = new storage.retrieval(request.inode.file.id);
    s.on('error', errorHandler(response));
    s.pipe(response);
}

export default function initDataEndPoints(app) {
    log.info('Initializing data end points.');
    app.post('/api/data/', postData);
    app.get('/api/data/:id', inodeHandler, getData);
    log.info('End initialization data end points.');
}
