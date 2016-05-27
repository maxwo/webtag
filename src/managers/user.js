import { log } from '../lib/tools';

export function userFromRequest(request) {
    const pc = request.socket.getPeerCertificate();
    if (typeof pc.subject.OU === 'string') {
        pc.subject.OU = [pc.subject.OU];
    }

    return {
        userName: pc.subject.UID,
        groups: pc.subject.OU,
        firstName: pc.subject.SN,
        lastName: pc.subject.GN,
        email: pc.subject.emailAddress,
        city: pc.subject.L,
        state: pc.subject.ST,
        country: pc.subject.C,
    };
}

export function userMiddleware(request, response, next) {
    const user = userFromRequest(request);
    log.info(`User ${user.userName} connected.`);
    request.user = user;
    next();
}
