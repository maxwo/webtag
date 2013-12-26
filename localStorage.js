var fs = require('fs');
var crypto = require('crypto');
var util = require('util');
var events = require('events');
var tools = require('./tools');
var config = require('./config');

var storagePath = config.get('localStoragePath');

exports.beginStorage = function() {
    
    return new WriteStorage();
    
};

exports.beginRetrieval = function(id) {

    tools.logger.info('Initiating retrieval.');
    return new RetrieveStorage(id);

};

exports.delete = function(id) {
	
};

var getFilePath = function(id) {

    return storagePath + id;

};



/**
 * Class used to retrieve a file.
 */
function RetrieveStorage(id) {
    this._id = id;
    this._processedBytes = 0;
};

util.inherits(RetrieveStorage, events.EventEmitter);

RetrieveStorage.prototype.processedBytes = function() {
    return this._processedBytes;
};

RetrieveStorage.prototype.process = function(writer) {

    var that = this;
    var filePath = getFilePath(that._id);

    fs.exists(filePath, function(exists) {

        if ( exists===false ) {
            that.emit('error', new tools.DataError(filePath));
            return;
        }

        that._file = fs.createReadStream(getFilePath(that._id));

        pipe(that, that._file, writer);

    });

};


/**
 * Class used to store a file.
 */
function WriteStorage(id) {

    if ( !id ) {
        var shasum = crypto.createHash('sha512');
        shasum.update('$*_salt'+ Math.random());
        this._id = shasum.digest('hex');
    } else {
        this._id = id;
    }
    this._fullPath = 'file:'+ getFilePath(this._id);
    this._processedBytes = 0;
    this._handlers = {};
};

util.inherits(WriteStorage, events.EventEmitter);


WriteStorage.prototype.id = function() {
    return this._id;
};

WriteStorage.prototype.processedBytes = function() {
    return this._processedBytes;
};

WriteStorage.prototype.clean = function() {
    try {
        this._file.end();
    } catch (e) {}
    try {
        fs.unlink(getFilePath(that._id), function(){});
    } catch (e) {}
};

WriteStorage.prototype.process = function(reader) {

    var that = this;

    fs.exists(storagePath, function(exists) {
    
        if ( !exists ) {
            that.emit('error', new tools.DataError(storagePath));
            return;
        }
    
        var filePath = getFilePath(that._id);
        that._file = fs.createWriteStream(getFilePath(that._id));

        pipe(that, reader, that._file);
    
    });

};




var pipe = function(obj, _in, _out) {

    _out.on('error', function(error) {
       obj.emit('error', new tools.DataError(_out, {source: error}));
    });

    _in.on('error', function(error) {
        obj.emit('error', new tools.DataError(_in, {source: error}));
    });

    _in.on('drain', function() {
    //that._file.resume();
    });

    _in.on('data', function(chunk) {
        tools.logger.info('Sending data.');
        var bs = _out.write(chunk);
        obj._processedBytes += chunk.length;
        if ( bs===false ) {
        //that._file.pause();
        }
    });

    _in.on('end', function(chunk) {
        tools.logger.info('End of data.');
        _out.end(chunk);
        if ( chunk ) {
            that._processedBytes += chunk.length;
        }
        obj.emit('end');
    });

};
