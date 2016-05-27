import ocr from '../lib/ocr';
import exif from '../lib/exif';
import { log } from '../lib/tools';
import moment from 'moment';
import { inodeIndexer, setAggregatedDate } from '../managers/inode';
import { initNotification, getChannel, inodeIndexed } from '../managers/notification';
import { listenQueue } from '../lib/amqp';
import { imageContentTypes } from '../lib/imageContentTypes';

let channel;

function indexInode(message) {
    channel.ack(message);

    const id = message.content.toString();

    log.info(`Inode ${id} to index.`);

    inodeIndexer
        .get(id)
        .then((inode) => {
            let result = null;
            // Check if this is an image
            if (imageContentTypes.indexOf(inode.contentType) !== -1) {
                const fileName = inode.file.location.substr(7);
                let indexedInode = inode;
                // If so, OCR it
                log.info(`Indexation of inode:file ${id}:${fileName}`);

                const indexPromises = [
                    ocr(fileName),
                    exif(fileName),
                ];

                result = Promise
                    .all(indexPromises)
                    .then((results) => {
                        const [text, exifData] = results;

                        // Indexation of text
                        if (text) {
                            indexedInode.textContent = text;
                        }

                        // Indexation of EXIF contents
                        if (exifData && exifData.exif && exifData.exif.CreateDate) {
                            const documentDate =
                                moment(exifData.exif.CreateDate, 'YYYY/MM/DD HH:mm:ss')
                                    .toDate();

                            indexedInode = setAggregatedDate(indexedInode,
                                'document', documentDate);
                        }

                        indexedInode.states.indexed = true;

                        return inodeIndexer.index(indexedInode);
                    })
                    .then(() => {
                        inodeIndexed(indexedInode);
                    })
                    .catch((err) => {
                        log.error(`Error while OCR of ${id}: ${err}`);
                    });
            } else {
                log.info(`Inode ${id} not an image, nothing to do...`);
            }

            return result;
        });
}

log.info('Preparing an indexation worker...');
initNotification()
    .then(() => {
        channel = getChannel();
        return listenQueue(channel, 'imageIndexation', indexInode);
    })
    .then(() => {
        log.info('Indexation worker running, waiting for inodes...');
    })
    .catch((error) => {
        log.error(error);
    });
