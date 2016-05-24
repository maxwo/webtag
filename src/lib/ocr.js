import tesseract from 'node-tesseract';

const options = {
    l: 'fra',
    binary: '/usr/local/bin/tesseract',
};

export default function ocr(image) {
    return new Promise((resolve, reject) => {
        tesseract.process(image, options, (err, text) => {
            if (err) {
                reject(err);
            } else {
                resolve(text);
            }
        });
    });
}
