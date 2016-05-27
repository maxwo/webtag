import parse from '../../lib/form';
import storage from '../../lib/localStorage';
import { log, errorHandler } from '../../lib/tools';
import mime from 'mime-types';
import imagemagick from 'imagemagick-native';
import { inodeIndexer, inodeHandler, cleanUpInode } from '../../managers/inode';
import { inodeSaved } from '../../managers/notification';
import { imageContentTypes } from '../../lib/imageContentTypes';

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
                    owner: request.user.userName,
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
    if (!request.query.thumb) {
        const s = new storage.Retrieval(request.inode.file.id);

        s.on('error', errorHandler(response));
        response.type(request.inode.contentType);
        s.pipe(response);
    } else {
        const [width, height] = request.query.thumb.split('x');
        const resize = imagemagick.streams.convert({
            width,
            height,
            quality: 100,
            format: 'JPG',
            resizeStyle: 'aspectfit',
        });

        const s = new storage.Retrieval(request.inode.file.id);

        s.on('error', errorHandler(response));
        response.type('image/jpg');
        s.pipe(resize).pipe(response);
    }
}

export default function initDataEndPoints(app) {
    log.info('Initializing data end points.');
    app.post('/api/data/', postData);
    app.get('/api/data/:id', inodeHandler, getData);
    log.info('End initialization data end points.');
}
