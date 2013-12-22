var winston = require('winston');

exports.logger = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)()
    ]
  });

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

    context.type = 'user';
    context.user = user;
    context.login = typeof user==='string' ? user : user.login;

    exports.Error.apply(this, [context]);
}
exports.UserError.prototype = new exports.Error();


exports.DataError = function(stream, context) {

    context.type = 'data';
    context.stream = stream;

    exports.Error.apply(this, [context]);

};




exports.errorHandler = function(response) {

    return function(error) {

        console.log('error while processing a request');

        if ( error.context.notFound ) {
            response.writeHead(404);
        } else if ( error.context.badRequest ) {
            response.writeHead(400);
        } else {
            response.writeHead(500);
        }

        response.write(JSON.stringify(error, null, 4));
        response.end();

    };

};