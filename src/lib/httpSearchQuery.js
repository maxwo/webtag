function extractParameter(request, name) {
    let values;
    if (typeof request.query[name] === 'string') {
        request.query[name] = [request.query[name]];
    }

    if (typeof request.query[name] === 'object') {
        values = request.query[name];
    }

    return values;
}

export default function extractParameters(request) {
    let words;
    const tags = extractParameter(request, 'tag');
    const owners = extractParameter(request, 'owner');
    const groups = extractParameter(request, 'group');
    const creationDays = extractParameter(request, 'creation_day');
    const creationMonths = extractParameter(request, 'creation_month');
    const creationYears = extractParameter(request, 'creation_year');
    const documentDays = extractParameter(request, 'document_day');
    const documentMonths = extractParameter(request, 'document_month');
    const documentYears = extractParameter(request, 'document_year');

    if (typeof request.query.text === 'string') {
        words = request.query.text
            .split(',')
            .filter((t) => t.length > 0);
    }

    return {
        words,
        tags,
        owners,
        groups,
        creationDays,
        creationMonths,
        creationYears,
        documentDays,
        documentMonths,
        documentYears,
    };
}
