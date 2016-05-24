import ocr from '../lib/ocr';
import config from '../lib/config';
import { logger as log } from '../lib/tools';
import { inodeIndexer } from '../managers/inode';
import amqplib from 'amqplib';

const imageContentTypes = [
    'image/bmp',
    'image/gif',
    'image/jpeg',
    'image/png',
    'image/tiff',
];

let channel;

function indexInode(message) {
    channel.ack(message);

    const id = message.content.toString();

    log.info(`Inode ${id} to index.`);

    inodeIndexer
        .get(id)
        .then((inode) => {
            // Check if this is an image
            if (imageContentTypes.indexOf(inode.contentType) !== -1) {
                const fileName = inode.file.location.substr(7);
                // If so, OCR it
                log.info(`OCR of inode:file ${id}:${fileName}`);

                return ocr(fileName)
                    .then((text) => {
                        log.info(`OCR of inode ${id} done.`);
                        inode.textContent = text;
                        inodeIndexer.index(inode);
                    })
                    .catch((err) => {
                        log.error(`Error while OCR of ${id}: ${err}`);
                    });
            } else {
                log.info(`Inode ${id} not an image, nothing to do...`);
                return null;
            }
        })
        .then(() => {})

}

function initQueue() {
    log.info('Connecting to AMQP on %s', config.get('amqpHost'));
    amqplib
        .connect(config.get('amqpHost'))
        .then((connection) => {
            connection
                .createChannel()
                .then((chan) => {
                    channel = chan;
                    channel.consume('imageIndexation', indexInode, {
                        noAck: false,
                    });
                })
        })
        .catch(console.error);
}

log.info('Preparing an indexation worker.');
initQueue();
