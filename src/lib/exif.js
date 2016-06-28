import { ExifImage } from 'exif';
import { log } from '../lib/tools';

export default function exif(fileName) {
    return new Promise((resolve, reject) => {
        try {
            log.info(`Reading EXIF of file ${fileName} ready.`);
            /* eslint-disable no-new */
            new ExifImage({ image: fileName }, (error, exifData) => {
            /* eslint-enable no-new */
                if (error) {
                    log.info(`EXIF of file ${fileName} failed.`);
                    reject(error);
                } else {
                    log.info(`EXIF of file ${fileName} read.`);
                    resolve(exifData);
                }
            });
        } catch (error) {
            log.info(`EXIF of file ${fileName} failed.`);
            reject(error.message);
        }
    });
}
