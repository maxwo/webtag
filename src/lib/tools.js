import winston from 'winston';

export const log = new winston.Logger({
    transports: [
        new winston.transports.Console(),
    ],
});


/**
 * Error object for generic errors
 */
export function Error(context = 'An error occured.') {
    context = typeof context === 'string' ? {
        message: context,
    } : context;

    this.context = context;
}

/**
 * Error object for inode errors
 */
export function DocumentError(inode, context = {}) {
    context.type = 'inode';
    context.inode = inode;
    context.id = inode.id;

    exports.Error.apply(this, [context]);
}
DocumentError.prototype = new Error();

/**
 * Error object for user errors
 */
export function UserError(user, context = {}) {
    context.type = 'user';
    context.user = user;
    context.login = typeof user === 'string' ? user : user.login;

    exports.Error.apply(this, [context]);
}
UserError.prototype = new Error();

export function DataError(stream, context = {}) {
    context.type = 'data';
    context.stream = stream;

    exports.Error.apply(this, [context]);
}

export function errorHandler(response) {
    return (error) => {
        log.error('Error while processing a request: %s', error);

        let status = 500;

        if (error && error.context && error.context.notFound) {
            status = 404;
        } else if (error && error.context && error.context.badRequest) {
            status = 400;
        }

        response.send(status, JSON.stringify(error, null, 4));
        response.end();
    };
}
