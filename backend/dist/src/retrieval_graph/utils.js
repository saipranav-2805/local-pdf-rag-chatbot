export function formatDoc(doc) {
    const metadata = doc.metadata || {};
    const meta = Object.entries(metadata)
        .map(([k, v]) => ` ${k}=${v}`)
        .join('');
    const metaStr = meta ? ` ${meta}` : '';
    return `<document${metaStr}>\n${doc.pageContent}\n</document>`;
}
export function formatDocs(docs) {
    /**Format a list of documents as XML. */
    if (!docs || docs.length === 0) {
        return '<documents></documents>';
    }
    const formatted = docs.map(formatDoc).join('\n');
    return `<documents>\n${formatted}\n</documents>`;
}
