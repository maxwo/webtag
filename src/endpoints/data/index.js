import form from '../../managers/form';
import storage from '../../lib/localStorage';
import tools from '../../lib/tools';
import inodeManager from '../../managers/inode';

tools.logger.info('Initializing data end point.');

export const postDataMiddlewares = [inodeManager.inodeHandler];
export function postDataProcessor(request, response) {
    // Store all the files
    form.parse(request)

    // Index all the files
    .then((data) => {
        const tags = data.parameters.tags ? data.parameters.tags.split(',') : [];
        const promises = [];

        for (const file of data.file) {
            promises.push(inodeManager.indexer.index({
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
        response.json(201, inodes);
    })

    .catch(tools.errorHandler(response));
}

export const getDataMiddlewares = [inodeManager.inodeHandler];
export function getData(request, response) {
    const s = new storage.retrieval(request.inode.file.id);
    s.on('error', tools.errorHandler(response));
    s.pipe(response);
}


/*
app.put('/api/data/:id', inodeManager.inodeHandler, function(request, response) {

    tools.logger.info('PUT on %s.', request.inode.id);

    var inode = request.inode;

    var store = new storage.storage(inode.id);
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
