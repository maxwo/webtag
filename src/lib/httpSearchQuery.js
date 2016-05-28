export default function extractParameters(request) {
    let words;
    let tags;

    if (typeof request.query.tag === 'string') {
        request.query.tag = [request.query.tag];
    }

    if (typeof request.query.tag === 'object') {
        tags = request.query.tag;
    }

    if (typeof request.query.text === 'string') {
        words = request.query.text
            .split(',')
            .filter((t) => t.length > 0);
    }

    return {
        words,
        tags,
    };
}
