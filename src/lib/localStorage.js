var fs = require('fs');
var crypto = require('crypto');
var util = require('util');

var tools = require('./tools');
var config = require('./config');

var storagePath = config.get('localStoragePath');




exports.delete = function(id) {
    fs.unlink(getFilePath(id), function(){});
};

var getFilePath = function(id) {
    return storagePath + id;
};



util.inherits(retrieval, fs.ReadStream);

/**
 * Object used to retrieve a file.
 */
function retrieval(id) {
    this._id = id;
	this._fullPath = getFilePath(this._id);

    fs.ReadStream.apply(this, [this._fullPath]);
}

exports.retrieval = retrieval;




util.inherits(storage, fs.WriteStream);

function storage(id) {

    if ( typeof id==='undefined' ) {
        var shasum = crypto.createHash('sha512');
        shasum.update('$*_salt'+ Math.random());
        id = shasum.digest('hex');
    }

	this._id = id;
	this._fullPath = getFilePath(this._id);

	tools.logger.info('Destination file: '+ this._fullPath);

	fs.WriteStream.apply(this, [this._fullPath]);

}

storage.prototype.id = function() {
    return this._id;
};

storage.prototype.size = function() {
    return this.bytesWritten;
};

storage.prototype.location = function() {
    return 'file://'+ this._fullPath;
};

storage.prototype.process = function(reader) {

    var that = this;
	
    //fs.exists(storagePath, function(exists) {
    
        /*if ( !exists ) {
			tools.logger.error('%s does not exist.', storagePath);
            that.emit('error', new tools.DataError(storagePath));
            return;
        }*/

	    that.on('error', that.clean);
	    that.on('finish', function() {
	        tools.logger.info('file %s done.', that._fullPath);
	    });

		tools.logger.info('writing file %s.', that._fullPath);

        reader.on('end', function() {
            that.end();
        });
		return reader.pipe(that);
    
    //});

};

storage.prototype.clean = function() {
    try {
        this.end();
    } catch (e) {}
    try {
        fs.unlink(this._fullPath, function(){});
    } catch (e) {}
};

storage.prototype.isDone = function() {
    return this._done;
};

storage.prototype.hasError = function() {
    return this._error;
};

exports.storage = storage;



exports.delete = function(id) {

    fs.unlink( getFilePath(id) , function(){});

};