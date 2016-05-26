import { log } from './tools';

export default function buildQuery(tags, words) {
    const query = {};
    const bool = {};
    const must = [];

    if (typeof tags === 'object') {
        for (const tag of tags) {
            const term = {
                term: {
                    tags: tag,
                },
            };
            must.push(term);
        }
    }

    if (typeof words === 'object') {
        words.forEach((t) => {
            must.push({
                match: {
                    textContent: t,
                },
            });
        });
    }

    if (must.length === 0) {
        query.match_all = {};
    } else {
        bool.must = must;
        query.bool = bool;
    }

    return query;
}
