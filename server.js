import express from 'express';
import bodyParser from 'body-parser';
import logger from 'express-logger';
import path from 'path';
import fs from 'fs';
import https from 'https';

import notification from './lib/notification';
import { logger as log, errorHandler } from './lib/tools';
import config from './lib/config';

import dataEndPoint from './lib/data';
import inodeEndPoint from './lib/inode';
import userEndPoint from './lib/user';
import tagsEndPoint from './lib/tags';

const options = {
    key: fs.readFileSync('./certificates/server/server-key.pem'),
    cert: fs.readFileSync('./certificates/server/server-crt.pem'),
    ca: fs.readFileSync('./certificates/ca/ca-crt.pem'),
    crl: fs.readFileSync('./certificates/ca/ca-crl.pem'),
    requestCert: true,
    rejectUnauthorized: true,
};

const app = express();
const server = https.createServer(options, app);

// app.use(express.basicAuth( userManager.authenticate ));
app.use(function(request, response, next) {
    const userName = request.socket.getPeerCertificate().subject.CN;
    tools.logger.log(`Utilisateur ${userName} connecte.`);
    request.user = {
        login: userName,
        groups: [],
    };
    return next();
});
// app.use(express.methodOverride());
app.use(logger({
    "path": "logfile.txt",
}));

app.get('/*', express.static(path.join(__dirname, 'static')));

app.use('/api/user/', bodyParser.json());
app.use('/api/inode/', bodyParser.json());
app.use('/api/tags/', bodyParser.json());
app.use(function(error, request, response, next) {
    if (!error) {
        return next();
    }
    errorHandler(response)({
        error: true,
        source: error,
    });
});

app.use(dataEndPoint);
app.use(inodeEndPoint);
app.use(userEndPoint);
app.use(tagsEndPoint);

notification.initNotification(app, server);

log.info('Preparing to listen on %s:%d', config.get('httpHost'), config.get('httpPort'));
server.listen(config.get('httpPort'), config.get('httpHost'));
log.info('Listening on %s:%d', config.get('httpHost'), config.get('httpPort'));
