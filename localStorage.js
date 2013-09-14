var fs = require('fs');
var crypto = require('crypto');

var storagePath = '/Users/max/nodejs/data/';

exports.beginStorage = function() {
    
    return new WriteStorage();
    
};

exports.beginRetrieval = function(id) {

    console.log('Initiating retrieval.');
    return new RetrieveStorage(id);

};

var getFilePath = function(id) {

    return storagePath + id;

};

/**
 * Class used for retrieving a file.
 */
function RetrieveStorage(id) {
    this._id = id;
    this._processedBytes = 0;
    this._handlers = {};
};

RetrieveStorage.prototype.fireEvent = function(event) {
    if ( typeof this._handlers[event]==='function' ) {
        this._handlers[event]();
    }
};

RetrieveStorage.prototype.on = function(event, callback) {
    this._handlers[event] = callback;
};

RetrieveStorage.prototype.processedBytes = function() {
    return this._processedBytes;
};

RetrieveStorage.prototype.process = function(writer) {

    var that = this;
    var filePath = getFilePath(that._id);
    
    fs.exists(filePath, function(exists) {
    
        if ( !exists ) {
            that.fireEvent('notFound');
            return;
        }
    
        that._file = fs.createReadStream(getFilePath(id));
        
        writer.on('error', function() {
            that.fireEvent('error');
        });
        
        that._file.on('error', function() {
            that.fireEvent('error');
        });
        
        that._file.on('drain', function() {
            that._file.resume();
        });

        that._file.on('end', function(chunk) {
            console.log('End of data.');
            writer.end(chunk);
            if ( chunk ) that._processedBytes += chunk.length;
            that.fireEvent('end');
        
        });

        that._file.on('data', function(chunk) {
            console.log('Sending data.');
            var bs = writer.write(chunk);
            that._processedBytes += chunk.length;
            if ( bs===false )
            {
                that._file.pause();
            }
        
        });
    
    });

};


/**
 * Class used for storing a file.
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



WriteStorage.prototype.fireEvent = function(event) {
    if ( typeof this._handlers[event]==='function' ) {
        this._handlers[event]();
    }
};

WriteStorage.prototype.on = function(event, callback) {
    this._handlers[event] = callback;
};

WriteStorage.prototype.id = function() {
    return this._id;
};

WriteStorage.prototype.processedBytes = function() {
    return this._processedBytes;
};

WriteStorage.prototype.clean = function() {
    try {
        this._file.end();
        fs.unlink(getFilePath(that._id), function(){});
    } catch (e) {}
};

WriteStorage.prototype.process = function(reader) {

    var that = this;
    
    fs.exists(storagePath, function(exists) {
    
        if ( !exists ) {
            that.fireEvent('error');
            return;
        }
    
        var filePath = getFilePath(that._id);
        that._file = fs.createWriteStream(getFilePath(that._id));
        
        that._file.on('error', function() {
            that.fireEvent('error');
        });
        
        reader.on('error', function() {
            that.fireEvent('error');
        });
        
        reader.on('drain', function() {
            reader.resume();
        });

        reader.on('end', function(chunk) {
            console.log('End of data.');
            that._file.end(chunk);
            if ( chunk ) that._processedBytes += chunk.length;
            that.fireEvent('end');
        
        });

        reader.on('data', function(chunk) {
            console.log('Receiving data : '+ chunk.length);
            var bs = that._file.write(chunk);
            that._processedBytes += chunk.length;
            if ( bs===false )
            {
                reader.pause();
            }
        
        });
    
    });

};
