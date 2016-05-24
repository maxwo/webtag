import { createChannel, listenTopic } from '../lib/amqp';
import config from '../lib/config';

createChannel(config.get('amqpHost'))
    .then((channel) => {
        listenTopic(channel, 'logs', ['my.*.*'], (message) => {
            console.log(message.fields.routingKey);
            console.log(message.content.toString());
        });
    })
    .catch(console.error);
