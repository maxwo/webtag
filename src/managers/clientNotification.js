import { log } from '../lib/tools';
import config from '../lib/config';
import { createChannel, listenTopic } from '../lib/amqp';
import { inodeIndexer, cleanUpInode } from './inode';
import ioInitializer from 'socket.io';

let amqpChannel;
let io;

function initClient(socket) {
    const userName = socket.request.socket.getPeerCertificate().subject.CN;

    listenTopic(amqpChannel, 'events', [`user.${userName}`], (message) => {
        if (message !== null) {
            const id = message.content.toString();
            inodeIndexer
                .get(id)
                .then((inode) => {
                    const i = cleanUpInode(inode);
                    socket.emit('inodeChanged', i);
                })
                .catch(log.error);
        } else {
            log.info('Queue deleted.');
        }
    })
    .then((queue) => {
        socket.on('disconnect', () => {
            log.info('User is gone, deleting the queue...');
            amqpChannel.deleteQueue(queue);
        });
    })
    .catch(log.error);
}

export function initClientNotification(server) {
    log.info('Initializing client notifications.');

    return createChannel(config.get('amqpHost'))
        .then((channel) => {
            amqpChannel = channel;
            io = ioInitializer(server);
            io.on('connection', initClient);
        })
        .then(() => {
            log.info('Client notifications initialized.');
        })
        .catch(log.error);
}
