export default function buildQuery(user,
                                    tags,
                                    words,
                                    owners,
                                    groups,
                                    creationDays,
                                    creationMonths,
                                    creationYears,
                                    documentDays,
                                    documentMonths,
                                    documentYears) {
    const query = {};
    const bool = {};
    const must = [];
    const should = [];

    if (typeof user === 'object') {
        should.push({ term: { owner: user.userName } });
        user.groups.forEach((group) => {
            should.push({ term: { groups: group } });
        });
    }

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

    if (typeof groups === 'object') {
        for (const group of groups) {
            const term = {
                term: {
                    groups: group,
                },
            };
            must.push(term);
        }
    }

    if (typeof owners === 'object') {
        for (const owner of owners) {
            const term = {
                term: {
                    owner,
                },
            };
            must.push(term);
        }
    }

    if (typeof creationDays === 'object') {
        for (const creationDay of creationDays) {
            const term = {
                term: {
                    creationDay,
                },
            };
            must.push(term);
        }
    }

    if (typeof creationMonths === 'object') {
        for (const creationMonth of creationMonths) {
            const term = {
                term: {
                    creationMonth,
                },
            };
            must.push(term);
        }
    }

    if (typeof creationYears === 'object') {
        for (const creationYear of creationYears) {
            const term = {
                term: {
                    creationYear,
                },
            };
            must.push(term);
        }
    }

    if (typeof documentDays === 'object') {
        for (const documentDay of documentDays) {
            const term = {
                term: {
                    documentDay,
                },
            };
            must.push(term);
        }
    }

    if (typeof documentMonths === 'object') {
        for (const documentMonth of documentMonths) {
            const term = {
                term: {
                    documentMonth,
                },
            };
            must.push(term);
        }
    }

    if (typeof documentYears === 'object') {
        for (const documentYear of documentYears) {
            const term = {
                term: {
                    documentYear,
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

    if (must.length === 0 && should.length === 0) {
        query.match_all = {};
    } else {
        if (must.length > 0) {
            bool.must = must;
        }
        if (should.length > 0) {
            bool.should = should;
            bool.minimum_should_match = 1;
        }
        query.bool = bool;
    }

    return query;
}
