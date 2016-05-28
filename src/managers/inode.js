import CachedIndexer from '../lib/cachedIndexer';
import equal from 'deep-equal';
import moment from 'moment';
import { errorHandler } from '../lib/tools';

const readOnlyFields = {
    id: null,
    contentType: null,
    owner: null,
    groups: null,
    uploadDate: null,
    states: null,
    documentMonth: null,
    documentYear: null,
    uploadMonth: null,
    uploadYear: null,
};

const invisibleFields = [
    'documentDay',
    'documentMonth',
    'documentYear',
    'uploadDay',
    'uploadMonth',
    'uploadYear',
    'textContent',
];

const inodeTemplate = {
    id: null,
    filename: null,
    contentType: null,
    tags: [],
    owner: null,
    groups: [],
    uploadDate: null,
    indexedDate: null,
    archivedDate: null,
    deletionDate: null,
    documentDate: null,
    states: {
        received: false,
        indexed: false,
        archived: false,
        deleted: false,
    },
};


export const inodeIndexer = new CachedIndexer('inode', inodeTemplate, 1);

export const inodeAggregations = {
    group_by_tags: {
        terms: {
            field: 'tags',
        },
    },
    group_by_document_year: {
        terms: {
            field: 'documentYear',
        },
    },
    group_by_document_month: {
        terms: {
            field: 'documentMonth',
        },
    },
    group_by_document_day: {
        terms: {
            field: 'documentDay',
        },
    },
    group_by_creation_year: {
        terms: {
            field: 'creationYear',
        },
    },
    group_by_creation_month: {
        terms: {
            field: 'creationMonth',
        },
    },
    group_by_creation_day: {
        terms: {
            field: 'creationDay',
        },
    },
};

export function inodeHandler(request, response, next) {
    inodeIndexer
        .get(request.params.id)
        .then((inode) => {
            request.inode = inode;
            next();
        })
        .catch(errorHandler(response));
}

export function cleanUpInode(inode) {
    const i = Object.assign({}, inode);

    i.file.location = undefined;
    for (const f of invisibleFields) {
        i[f] = undefined;
    }

    return i;
}

export function setAggregatedDate(inode, type, date) {
    const m = moment(date);
    const fullDate = m.format('YYYY-MM-DD');
    const fullTime = m.format('HH:mm:ss.SSS');

    inode[`${type}Date`] = `${fullDate}T${fullTime}Z`;
    inode[`${type}Day`] = '' + m.format('YYYYMMDD');
    inode[`${type}Month`] = '' + m.format('YYYYMM');
    inode[`${type}Year`] = '' + m.format('YYYY');

    return inode;
}

export function checkInodeModification(inodeSent, currentInode) {
    // Check if new unknown fields
    for (const f of inodeTemplate) {
        if (typeof inodeSent[f] === 'undefined') {
            return false;
        }
    }

    // Check for read-only fields
    for (const f of readOnlyFields) {
        if (!equal(inodeSent[f], currentInode[f])) {
            return false;
        }
    }

    return true;
}
