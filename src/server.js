import express from 'express';
import bodyParser from 'body-parser';
import logger from 'express-logger';
import path from 'path';
import fs from 'fs';
import https from 'https';

import notification from './lib/notification';
import { logger as log, errorHandler } from './lib/tools';
import config from './lib/config';

import initDataEndPoints from './endpoints/data';
//import inodeEndPoint from './endpoints/inode';
//import userEndPoint from './endpoints/user';
//import tagsEndPoint from './endpoints/tags';

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

// app.use(express.methodOverride());
app.use(logger({
    path: 'access.log',
}));

// app.use(express.basicAuth( userManager.authenticate ));
app.use((request, response, next) => {
    const userName = request.socket.getPeerCertificate().subject.CN;
    log.info(`Utilisateur ${userName} connecte.`);
    request.user = {
        login: userName,
        groups: [],
    };
    next();
});

// app.use(express.basicAuth( userManager.authenticate ));
app.use((request, response, next) => {
    console.log(request.user);
    next();
});

// app.get('/*', express.static(path.join(__dirname, 'static')));

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

initDataEndPoints(app);
// app.post('/api/data', )
// app.use(dataEndPoint);
// app.use(inodeEndPoint);
// app.use(userEndPoint);
// app.use(tagsEndPoint);

notification.initNotification(app, server);

log.info('Preparing to listen on %s:%d', config.get('httpsHost'), config.get('httpsPort'));
server.listen(config.get('httpsPort'), config.get('httpsHost'));
log.info('Listening on %s:%d', config.get('httpsHost'), config.get('httpsPort'));
