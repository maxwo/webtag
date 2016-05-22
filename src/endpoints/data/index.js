import form from '../../managers/form';
import storage from '../../lib/localStorage';
import tools from '../../lib/tools';
import { inodeIndexer, inodeHandler } from '../../managers/inode';

function postData(request, response) {

    // Store all the files
    form.parse(request)

        // Index all the files
        .then((data) => {
            const tags = data.parameters.tags ? data.parameters.tags.split(',') : [];
            const promises = [];

            if (!data.files) {
                console.log('dkfjslqkjfkqsjfkldq');
                    console.log(data);
                throw new tools.DocumentError();
            }

            for (const file of data.files) {
                promises.push(inodeIndexer.index({
                    filename: file.filename,
                    tags,
                    owner: request.user.login,
                    groups: request.user.groups,
                    file,
                }));
            }

            return Promise.all(promises);
        })

        // Send inodes to client
        .then((inodes) => {
            response
                .status(201)
                .send(inodes);
        })

        .catch(tools.errorHandler(response));
}

function getData(request, response) {
    const s = new storage.retrieval(request.inode.file.id);
    s.on('error', tools.errorHandler(response));
    s.pipe(response);
}

export default function initDataEndPoints(app) {
    tools.logger.info('Initializing data end points.');
    app.post('/api/data/', postData);
    app.get('/api/data/:id', inodeHandler, getData);
    tools.logger.info('End initialization data end points.');
}

/*
app.put('/api/data/:id', inodeManager.inodeHandler, function(request, response) {

    tools.logger.info('PUT on %s.', request.inode.id);

    let inode = request.inode;

    let store = new storage.storage(inode.id);
    store.on('finish', function() {

        inode['size'] = store.size();
        inode['location'] = store.location();

        indexer.indexInode(inode, function(inode) {
            response.json(inode);
            response.end();
        } , tools.errorHandler(response), request.inode.id);

    });
    store.on('error', tools.errorHandler(response));

    store.process(request);

    notification.notifyProgress(request);

});
*/
