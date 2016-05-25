import ocr from '../lib/ocr';
import { log } from '../lib/tools';
import { inodeIndexer } from '../managers/inode';
import { initNotification, getChannel, inodeIndexed } from '../managers/notification';
import { listenQueue } from '../lib/amqp';
import { ExifImage } from 'exif';

const imageContentTypes = [
    'image/bmp',
    'image/gif',
    'image/jpeg',
    'image/png',
    'image/tiff',
];

let channel;

function readExif(fileName) {
    return new Promise((resolve, reject) => {
        try {
            log.info(`Reading EXIF of file ${fileName} done.`);
            new ExifImage({ image : fileName }, (error, exifData) => {
                if (error) {
                    reject(error);
                } else {
                    log.info(`EXIF of file ${fileName} read.`);
                    resolve(exifData);
                }
            });
        } catch (error) {
            reject(error.message);
        }
    });
}

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
                // If so, OCR it
                log.info(`OCR of inode:file ${id}:${fileName}`);

                result = ocr(fileName)
                    .then((text) => {
                        log.info(`OCR of inode ${id} done.`);
                        inode.textContent = text;
                    })
                    .then(() => readExif(fileName))
                    .then((exif) => {
                        log.info(JSON.stringify(exif, null, 4));
                        if (exif && exif.exif && exif.exif.CreateDate) {
                            inode.documentDate = exif.exif.CreateDate;
                        }
                    })
                    .then(() => {
                        inode.states.indexed = true;
                        return inodeIndexer.index(inode);
                    })
                    .then(() => {
                        inodeIndexed(inode);
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
