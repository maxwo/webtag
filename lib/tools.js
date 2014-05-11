var fs = require('fs');
var winston = require('winston');

exports.logger = new winston.Logger({
    transports: [
      new (winston.transports.Console)()
    ]
});

exports.drain = function(readStream) {
    return function() {
        exports.doDrain(readStream);
    };
};

exports.doDrain = function(readStream) {
    readStream.pipe( fs.createWriteStream('/dev/null') );
};

exports.readParam = function(stream, callback) {
    var value = '';
    stream.on('end', function() {
        callback(value);
    });
    stream.on('data', function(chunk) {
        value += chunk;
    });
};

/**
 * Error object for generic errors
 */
exports.Error = function(context) {

    context = context ? context : 'An error occured.';
    context = typeof context==='string' ? {message: context} : context;

    this.context = context;
};
exports.Error.prototype = new Error();

/**
 * Error object for inode errors
 */
exports.InodeError = function(inode, context) {

    context = context ? context : {};
    context.type = 'inode';
    context.inode = inode;
    context.id = inode.id;

    exports.Error.apply(this, [context]);
}
exports.InodeError.prototype = new exports.Error();

/**
 * Error object for user errors
 */
exports.UserError = function(user, context) {

    context = context ? context : {};
    context.type = 'user';
    context.user = user;
    context.login = typeof user==='string' ? user : user.login;

    exports.Error.apply(this, [context]);
}
exports.UserError.prototype = new exports.Error();


exports.DataError = function(stream, context) {

    context = context ? context : {};
    context.type = 'data';
    context.stream = stream;

    exports.Error.apply(this, [context]);

};




exports.errorHandler = function(response) {

    return function(error) {

        console.log('error while processing a request');

		var status = 500;

        if ( error && error.context && error.context.notFound ) {
            status = 404;
        } else if ( error && error.context && error.context.badRequest ) {
            status = 400;
        }

        response.send(status, JSON.stringify(error, null, 4));
		response.write('Une erreur');
		response.end();

    };

};
