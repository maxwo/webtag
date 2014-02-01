var util = require('util');
var events = require('events');
var _ = require('underscore');


util.inherits(OperationPool, events.EventEmitter);

function OperationPool() {
    this._operations = [];
    this._done = 0;
    this._error = 0;
}

OperationPool.prototype.addOperation = function(operation, options) {

    var that = this;

    var defaultOptions = {
        finishEvent: 'finish',
        errorEvent: 'error'
    };

    _.extend(defaultOptions, options);

    var o = {
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

OperationPool.prototype._operationDone = function() {
    if ( this._done===this._operations.length ) {
        this.emit('finish', this);
    }
};

OperationPool.prototype.cancelOperation = function(operation) {
    var o;
    for (o in this._operations) {
        if ( o.operation===operation && o.cancel===false ) {
            o.cancel = true;
            that._done++;
            this.operationDone();
        }
    }
};

OperationPool.prototype.batch = function(callback) {
    var o;
    for (o in this._operations) {
        callback(o.operation, o.options);
    }
};

OperationPool.prototype.hasError = function() {
    var o;
    for (o in this._operations) {
        if ( o.error ) {
            return true;
        }
    }
    return false;
};

exports.OperationPool = OperationPool;