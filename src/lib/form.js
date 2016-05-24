/**
 * Created by max on 10/02/15.
 */

import tools from '../lib/tools';
import multiparty from 'multiparty';
import storage from '../lib/localStorage';
import { receivingFile } from '../managers/notification';
// notification = require('../lib/notification');

export default function parse(request) {
    let fileCount = 0;

    return new Promise((resolve, reject) => {
        const form = new multiparty.Form();
        const result = {
            files: [],
            parameters: {},
        };

        let error = false;
        let formEnded = false;

        function endPromiseIfNeeded() {
            if (fileCount > 0 || !formEnded) {
                return;
            }
            if (!error) {
                resolve(result);
            } else {
                reject(error);
            }
        }

        form.on('part', (part) => {
            if (error) {
                tools.drain(part);
                return;
            }

            // A parameter has been sent
            if (!part.filename) {
                tools.readParam(part, (value) => {
                    result.parameters[part.name] = value;
                });
                endPromiseIfNeeded();
            } else {
                ((p) => {
                    tools.logger.info('Receiving file...');

                    let store = new storage.storage();

                    const file = {
                        id: store.id(),
                        filename: p.filename,
                        uploadDate: new Date(),
                    };

                    fileCount++;

                    receivingFile(file);

                    store.on('finish', () => {
                        file.size = store.size();
                        file.location = store.location();

                        result.files.push(file);

                        fileCount--;

                        endPromiseIfNeeded();
                    });

                    store.on('error', (err) => {
                        error = err;
                    });

                    store.process(p);
                })(part);
            }
        });

        form.on('error', (err) => {
            error = err;
        });

        form.on('close', () => {
            formEnded = true;
            endPromiseIfNeeded();
        });

        form.parse(request);
    });
}
