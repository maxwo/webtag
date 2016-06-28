

import fs from 'fs';
import util from 'util';
import uuid from 'node-uuid';

import { log } from './tools';
import config from './config';

let storagePath = config.get('localStoragePath');




exports.delete = function(id) {
    fs.unlink(getFilePath(id), function() {});
};

let getFilePath = function(id) {
    return storagePath + id;
};



util.inherits(Retrieval, fs.ReadStream);

/**
 * Object used to retrieve a file.
 */
function Retrieval(id) {
    this._id = id;
    this._fullPath = getFilePath(this._id);

    fs.ReadStream.apply(this, [this._fullPath]);
}

exports.Retrieval = Retrieval;




util.inherits(Storage, fs.WriteStream);

function Storage(id) {

    if (typeof id === 'undefined') {
        id = uuid.v4();
    }

    this._id = id;
    this._fullPath = getFilePath(this._id);

    log.info('Destination file: ' + this._fullPath);

    fs.WriteStream.apply(this, [this._fullPath]);

}

Storage.prototype.id = function() {
    return this._id;
};

Storage.prototype.size = function() {
    return this.bytesWritten;
};

Storage.prototype.location = function() {
    return 'file://' + this._fullPath;
};

Storage.prototype.process = function(reader) {

    let that = this;

    //fs.exists(storagePath, function(exists) {

    /*if ( !exists ) {
			tools.log.error('%s does not exist.', storagePath);
            that.emit('error', new tools.DataError(storagePath));
            return;
        }*/

    that.on('error', that.clean);
    that.on('finish', function() {
        log.info('file %s done.', that._fullPath);
    });

    log.info('writing file %s.', that._fullPath);

    reader.on('end', function() {
        that.end();
    });
    return reader.pipe(that);

    //});

};

Storage.prototype.clean = function() {
    try {
        this.end();
    } catch (e) {}
    try {
        fs.unlink(this._fullPath, function() {});
    } catch (e) {}
};

Storage.prototype.isDone = function() {
    return this._done;
};

Storage.prototype.hasError = function() {
    return this._error;
};

exports.Storage = Storage;

exports.delete = function(id) {
    fs.unlink(getFilePath(id), function() {});
};
