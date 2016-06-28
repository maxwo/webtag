import { log } from '../lib/tools';
import config from '../lib/config';
import { createChannel, listenTopic } from '../lib/amqp';
import { inodeIndexer, cleanUpInode } from './inode';
import { userFromRequest } from './user';
import ioInitializer from 'socket.io';

let amqpChannel;
let io;

function routingKeysForUser(user) {
    const routingKeys = [];
    routingKeys.push(`user.${user.userName}`);
    user.groups.forEach((g) => {
        routingKeys.push(`group.${g}`);
    });
    return routingKeys;
}

function initClient(socket) {
    const user = userFromRequest(socket.request);

    // Saved IDs are notified every 200ms, then store them somewhere...
    let savedIDs = [];

    listenTopic(amqpChannel, 'events', routingKeysForUser(user), (message) => {
        if (message !== null) {
            const id = message.content.toString();
            if (savedIDs.indexOf(id) === -1) {
                savedIDs.push(id);
            }
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

    setInterval(() => {
        const idToNotify = savedIDs;
        savedIDs = [];

        idToNotify.forEach((id) => {
            log.info(`Notifying connected user ${user.userName} about ${id}.`);
            inodeIndexer
                .get(id)
                .then((inode) => {
                    const i = cleanUpInode(inode);
                    socket.emit('inodeSaved', i);
                })
                .catch(log.error);
        });
    }, 200);
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
