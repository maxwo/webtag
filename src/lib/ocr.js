import tesseract from 'node-tesseract';
import { log } from '../lib/tools';

const options = {
    l: 'fra',
    binary: '/usr/local/bin/tesseract',
};

export default function ocr(image) {
    return new Promise((resolve, reject) => {
        log.info(`OCR of file ${image} ready.`);
        tesseract.process(image, options, (err, text) => {
            if (err) {
                log.error(`OCR of file ${image} failed.`);
                reject(err);
            } else {
                log.info(`OCR of file ${image} done.`);
                resolve(text);
            }
        });
    });
}
