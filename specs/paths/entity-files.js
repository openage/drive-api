module.exports = [{
    url: '/',
    post: {
        summary: 'create entity-files',
        parameters: [
            'x-role-key',
            { in: 'body', name: 'body', type: 'string', required: true }
        ]
    }
}]