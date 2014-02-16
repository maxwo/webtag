var tools = require('./tools'),
    authentication = require('./authentication'),
    io = require('socket.io'),
    _ = require('underscore'),
    uuid = require('node-uuid');

var amqp       = require('amqp');
var config = require('./config');

var exchange;
var connection;

exports.initNotification = function(app, server) {

    var socketHandler = io.listen(server);
    socketHandler.on('connection', function (socket) {

        connection.queue('tmp-' + Math.random(), {
                exclusive: true
            },
            function(queue) {
                queue.bind(config.get('amqpEventsExchangeName'), '#');
                queue.subscribe(function(msg) {
                    try {
                        socket.emit(msg.event, msg.object);
                    } catch (e) {
                        console.error(e);
                    }
                });
                socket.on('disconnect', function() {
                    queue.destroy();
                });
            });

    });


    tools.logger.info("Connecting to RabbitMQ on %s:%d", config.get('rabbitMQHost'), config.get('rabbitMQPort'));
    connection = amqp.createConnection({
        host: config.get('amqpHost'),
        port: config.get('amqpPort')
    });
    connection.on('ready', function() {
        tools.logger.info('Connected to RabbitMQ');
        connection.exchange(config.get('amqpEventsExchangeName'), config.get('amqpEventsExchangeParameters'), function(ex) {
            tools.logger.info('Exchange established');
            exchange = ex;
        });
    });
    connection.on('error', function(error) {
        tools.logger.error(error);
    });

};

var notify = function(event, object) {

    exchange.publish(event, {
        event: event,
        object: object
    });
};

var timestamp = function() {
    return new Date().getTime();
};

var ProgressNotification = function(data) {
    this.latestNotificationTime = 0;
    this.uuid = uuid.v1();
    this.data = _.extend({
        uuid: this.uuid
    }, data);
};

exports.ProgressNotification = ProgressNotification;

ProgressNotification.prototype.start = function() {
    this.latestNotificationTime = timestamp();
    notify('uploadStart', this.data);
};

ProgressNotification.prototype.stream = function(stream) {
    var that = this;
    that.data.processed = 0;
    stream.on('data', function(chunk) {
        var delta = timestamp() - that.latestNotificationTime;
        that.data.processed += chunk.length;
        if ( delta>config.get('amqpEventsRate') ) {
            that.latestNotificationTime += delta;
            notify('uploadProgress', that.data);
        }
    });
};

ProgressNotification.prototype.end = function() {
    notify('uploadFinish', this.data);
};
