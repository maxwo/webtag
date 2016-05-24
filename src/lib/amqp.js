import { logger as log } from './tools';
import amqplib from 'amqplib';
import config from './config';

export function createTopic(channel, topicName) {
    log.info(`Creating topic ${topicName}.`);
    return channel
        .assertExchange(topicName, 'topic', {
            durable: false,
        })
        .then((exchange) => {
            log.info(`Topic ${topicName} created.`);
            return exchange;
        });
}

export function listenTopic(channel, topicName, routingKey, onMessage) {
    log.info(`Listen to topic ${topicName}.`);
    return channel
        .assertExchange(topicName, 'topic', {
            durable: false,
        })
        .then(() => channel.assertQueue('', {
            exclusive: true,
        }))
        .then((qok) => {
            const bindQueuePromises = routingKey
                .map((rk) => {
                    channel.bindQueue(qok.queue, topicName, rk)
                });
            return Promise
                .all(bindQueuePromises)
                .then(() => qok.queue);
            
            return channel.bindQueue(qok.queue, topicName, routingKey)
                .then(() => {
                    return qok.queue;
                });
        })
        .then((queue) => {
            log.info(`Listening to topic ${topicName}...`);
            return channel.consume(queue, onMessage, {
                noAck: true,
            });
        })
        .catch(log.error);
}

export function createFanOut(channel, fanOutName) {
    log.info(`Creating fanout ${fanOutName}.`);
    return channel
        .assertExchange(fanOutName, 'fanout', {
            durable: false,
        })
        .then((exchange) => {
            log.info(`Fanout ${fanOutName} created.`);
            return exchange;
        });
}

export function listenFanOut(channel, fanOutName, onMessage) {
    log.info(`Listen to fanout ${fanOutName}.`);
    return channel
        .assertExchange(fanOutName, 'fanout', {
            durable: false,
        })
        .then(() => channel.assertQueue('', {
            exclusive: true,
        }))
        .then((qok) => {
            return channel.bindQueue(qok.queue, fanOutName, '')
                .then(() => qok.queue);
        })
        .then((queue) => {
            log.info(`Listening to fanout ${fanOutName}...`);
            return channel.consume(queue, onMessage, {
                noAck: true,
            });
        })
        .catch(log.error);
}

export function createQueue(channel, queueName) {
    log.info(`Creating queue ${queueName}.`);
    return channel
        .assertQueue(queueName)
        .then(() => {
            log.info(`Queue ${queueName} created.`);
        })
        .catch(log.error);
}

export function createChannel(host) {
    log.info('Connecting to AMQP on %s', host);
    return amqplib
        .connect(config.get('amqpHost'))
        .then((connection) => connection.createChannel());
}
