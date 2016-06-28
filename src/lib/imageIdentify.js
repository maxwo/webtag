import imagemagick from 'imagemagick-native';
import { log } from './tools';
import fs from 'fs';

export default function identify(fileName) {
    return new Promise((resolve, reject) => {
        log.info(`Identification of file ${fileName} ready.`);
        imagemagick.identify({
            srcData: fs.readFileSync(fileName),
        }, (err, result) => {
            if (err) {
                log.error(`Identification of file ${fileName} failed.`);
                reject(err);
            } else {
                log.info(`Identification of file ${fileName} done.`);
                resolve(result);
            }
        });
    });
}
