var util = require('util'),
    events = require('events'),
    _ = require('underscore');

var EventPhaser = function() {
    this._operations = [];
    this._done = 0;
    this._error = 0;
}

util.inherits(EventPhaser, events.EventEmitter);

EventPhaser.prototype.addOperation = function(operation, options) {

    var that = this,
        o,
        defaultOptions = {
            finishEvent: 'finish',
            errorEvent: 'error'
        };

    _.extend(defaultOptions, options);

    o = {
        operation: operation,
        success: false,
        error: false,
        cancel: false,
        options: options
    };

    this._operations.push(o);

    operation.on(defaultOptions.finishEvent, function() {
        that._done++;
        that._operationDone();
    });
    operation.on(defaultOptions.errorEvent, function() {
        that._done++;
        that._error++;
        that._operationDone();
    });
};

EventPhaser.prototype._operationDone = function() {
    if ( this._done===this._operations.length ) {
        this.emit('finish', this);
    }
};

EventPhaser.prototype.cancelOperation = function(operation) {
    var o;
    for (o in this._operations) {
        if ( o.operation===operation && o.cancel===false ) {
            o.cancel = true;
            that._done++;
            this._operationDone();
        }
    }
};

EventPhaser.prototype.each = function(callback) {
    var o;
    for (o in this._operations) {
        callback(o.operation, o.options);
    }
};

EventPhaser.prototype.hasError = function() {
    var o;
    for (o in this._operations) {
        if ( o.error ) {
            return true;
        }
    }
    return false;
};

exports.EventPhaser = EventPhaser;