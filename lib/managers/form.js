/**
 * Created by max on 10/02/15.
 */


var tools = require('../tools'),
    multiparty = require('multiparty'),
    storage = require('../localStorage'),
    notification = require('../notification');

exports.parse = function(request) {

    var fileCount = 0;

    return new Promise(function (resolve, reject) {

        var error = false, formEnded = false,
            form = new multiparty.Form(),
            result = {
                files: [],
                parameters: {}
            };

        var endPromiseIfNeeded = function() {

            if ( fileCount>0 || !formEnded ) {
                return;
            }
            if ( !error )
                resolve(result);
            else
                reject(error);

        };

        form.on('part', function(part) {

            if ( error ) {
                tools.drain(part);
                return;
            }

            // A parameter has been sent
            if ( !part.filename ) {
                tools.readParam(part, function(value) {
                    result.parameters[part.name] = value;
                });
                endPromiseIfNeeded();

            } else {

                (function(p) {

                    var progress = new notification.ProgressNotification({
                        expected: p.byteCount
                    });
                    progress.start();

                    fileCount++;

                    var store = new storage.storage();
                    store.on('finish', function() {

                        result.files.push({
                            'id': store.id(),
                            'filename': p.filename,
                            'content-type': p.headers['content-type'],
                            'size': store.size(),
                            'location': store.location()
                        });

                        progress.end();
                        fileCount--;

                        endPromiseIfNeeded();

                    });
                    store.on('error', function(_error) {
                        error = _error
                    });

                    store.process(p);
                    progress.stream(p);

                })(part);
            }

        });
        form.on('error', function(_error) {
            error = _error
        });
        form.on('close', function() {

            formEnded = true;

        });

        form.parse(request);
    });

};