import { logger as log } from '../lib/tools';
import config from '../lib/config';
import { createChannel, createQueue, createTopic } from '../lib/amqp';

let amqpChannel;

function notifyUsers(inode, buffer) {
    log.info(`Notifying user ${inode.owner}`);
    amqpChannel.publish('events', `user.${inode.owner}`, buffer);

    for (const g of inode.groups) {
        log.info(`Notifying group ${g}`);
        amqpChannel.publish('events', `group.${g}`, buffer);
    }
}

export function receivingFile(user, id, fileName) {
    const buffer = new Buffer(JSON.stringify({
        id,
        fileName,
    }));
}

export function inodeSaved(inode) {
    log.info('Preparing inode saved message...');

    const buffer = new Buffer(inode.id);
    amqpChannel.sendToQueue('imageIndexation', buffer);
    notifyUsers(inode, buffer);

    log.info('Inode saved message sent.');
}

export function inodeIndexed(inode) {
    log.info('Preparing inode indexed message...');

    const buffer = new Buffer(inode.id);
    amqpChannel.sendToQueue('imageArchive', buffer);
    notifyUsers(inode, buffer);

    log.info('Inode indexed message sent.');
}

export function inodeArchived(inode) {
    log.info('Preparing inode archived message...');

    const buffer = new Buffer(inode.id);
    amqpChannel.publish('events', `user.${inode.owner}`, buffer);
    notifyUsers(inode, buffer);

    log.info('Inode archived message sent.');
}

export function initNotification() {
    log.info('Initializing AMQP notifications.');
    return createChannel(config.get('amqpHost'))
        .then((channel) => {
            const creationPromises = [
                createQueue(channel, 'imageIndexation'),
                createQueue(channel, 'imageArchive'),
                createTopic(channel, 'events'),
            ];
            amqpChannel = channel;
            return Promise.all(creationPromises);
        })
        .then(() => {
            log.info('Working queues created');
        })
        .catch(log.error);
}

export function getChannel() {
    return amqpChannel;
}
