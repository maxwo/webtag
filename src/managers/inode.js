import CachedIndexer from '../lib/cachedIndexer';
import equal from 'deep-equal';
import moment from 'moment';
import mongoose from 'mongoose';
import { errorHandler } from '../lib/tools';

const invisibleFields = [
    'documentDay',
    'documentMonth',
    'documentYear',
    'creationDay',
    'creationMonth',
    'creationYear',
    'textContent',
];

const readOnlyFields = [
    'id',
    'owner',
    'groups',
    'creationDate',
    'states',
];

const inodeTemplate = {
    id: null,
    filename: null,
    contentType: null,
    tags: [],
    owner: null,
    groups: [],
    uploadDate: null,
    creationDate: null,
    creationDay: null,
    creationMonth: null,
    creationYear: null,
    indexedDate: null,
    archivedDate: null,
    deletionDate: null,
    documentDate: null,
    documentDay: null,
    documentMonth: null,
    documentYear: null,
    textContent: null,
    states: {
        received: false,
        indexed: false,
        archived: false,
        deleted: false,
    },
};

const inodeModel = {
    id: String,
    filename: String,
    contentType: String,
    tags: [],
    owner: String,
    groups: [],
    uploadDate: {
        type: Date,
        default: Date.now,
    },
    creationDate: {
        type: Date,
        default: Date.now,
    },
    indexedDate: Date,
    archivedDate: Date,
    deletionDate: Date,
    documentDate: {
        type: Date,
        default: Date.now,
    },
    textContent: {
        type: String,
        default: '',
    },
    received: {
        type: Boolean,
        default: true,
    },
    indexed: {
        type: Boolean,
        default: false,
    },
    archived: {
        type: Boolean,
        default: false,
    },
    deleted: {
        type: Boolean,
        default: false,
    },
};

export const inodeIndexer = new CachedIndexer('inode', inodeModel, 1);

export const inodeAggregations = {
    tags: {
        terms: {
            field: 'tags',
        },
    },
    owners: {
        terms: {
            field: 'owner',
        },
    },
    groups: {
        terms: {
            field: 'groups',
        },
    },
    document_years: {
        terms: {
            field: 'documentYear',
        },
    },
    document_months: {
        terms: {
            field: 'documentMonth',
        },
    },
    document_days: {
        terms: {
            field: 'documentDay',
        },
    },
    creation_years: {
        terms: {
            field: 'creationYear',
        },
    },
    creation_months: {
        terms: {
            field: 'creationMonth',
        },
    },
    creation_days: {
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
    inode[`${type}Day`] = m.format('YYYYMMDD');
    inode[`${type}Month`] = m.format('YYYYMM');
    inode[`${type}Year`] = m.format('YYYY');

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
