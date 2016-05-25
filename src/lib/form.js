/**
 * Created by max on 10/02/15.
 */

import { log } from '../lib/tools';
import multiparty from 'multiparty';
import storage from '../lib/localStorage';
import { receivingFile } from '../managers/notification';

function readParam(stream, callback) {
    let value = '';
    stream.on('end', () => {
        callback(value);
    });
    stream.on('data', (chunk) => {
        value += chunk;
    });
}

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
                part.resume();
                return;
            }

            // A parameter has been sent
            if (!part.filename) {
                readParam(part, (value) => {
                    result.parameters[part.name] = value;
                });
                endPromiseIfNeeded();
            } else {
                ((p) => {
                    log.info('Receiving file...');

                    const store = new storage.Storage();

                    const file = {
                        id: store.id(),
                        filename: p.filename,
                        uploadDate: new Date(),
                    };

                    fileCount++;

                    receivingFile(request.user, store.id(), p.filename);

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
