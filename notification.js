var tools = require('./tools');

exports.notifyProgress = function(stream) {

    var bytesProcessed = 0;

    stream.on('data', function(chunk) {
        bytesProcessed += chunk.length;
        tools.logger.info('Bytes processed: ', bytesProcessed);
    });

};