import { createChannel, createTopic } from '../lib/amqp';
import config from '../lib/config';

let amqpChannel;

createChannel(config.get('amqpHost'))
    .then((channel) => {
        amqpChannel = channel;
        return createTopic(channel, 'logs');
    })
    .then(() => {
        amqpChannel.publish('logs', 'my.routing.key', new Buffer('coucou'));
    })
    .catch(console.error);
