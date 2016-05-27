import express from 'express';
import methodOverride from 'method-override';
import bodyParser from 'body-parser';
import logger from 'express-logger';
import fs from 'fs';
import https from 'https';

import { initNotification } from './managers/notification';
import { initClientNotification } from './managers/clientNotification';
import { log, errorHandler } from './lib/tools';
import { userMiddleware } from './managers/user';
import config from './lib/config';

import initDataEndPoints from './endpoints/data';
import initInodeEndPoints from './endpoints/inode';

const options = {
    key: fs.readFileSync(config.get('httpsKey')),
    cert: fs.readFileSync(config.get('httpsCert')),
    ca: fs.readFileSync(config.get('httpsCA')),
    crl: fs.readFileSync(config.get('httpsCRL')),
    requestCert: true,
    rejectUnauthorized: true,
};

const app = express();
const server = https.createServer(options, app);

app.use(methodOverride('X-HTTP-Method-Override'));
app.use(logger({
    path: 'access.log',
}));

app.use(userMiddleware);
app.use(express.static('static'));

app.use('/api/user/', bodyParser.json());
app.use('/api/inode/', bodyParser.json());
app.use('/api/tags/', bodyParser.json());
app.use((error, request, response, next) => {
    if (!error) {
        return next();
    }
    return errorHandler(response)({
        error: true,
        source: error,
    });
});

initDataEndPoints(app);
initInodeEndPoints(app);

const initPromises = [
    initNotification(),
    initClientNotification(server),
];

Promise
    .all(initPromises)
    .then(() => {
        log.info('Preparing to listen on %s:%d', config.get('httpsHost'), config.get('httpsPort'));
        server.listen(config.get('httpsPort'), config.get('httpsHost'));
        log.info('Listening on %s:%d', config.get('httpsHost'), config.get('httpsPort'));
    });
