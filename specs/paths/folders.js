module.exports = [{
    url: '/',
    post: {
        summary: 'create a folder in root',
        description: 'create a folder in root of the entity',
        parameters: ['x-role-key',
            { in: 'query', name: 'owner-role-id', type: 'string', required: false },
            { in: 'query', name: 'owner-role-code', type: 'string', required: false },
            { in: 'query', name: 'owner-id', type: 'string', required: false }
        ]
    },
    get: {
        parameters: ['x-role-key',
            { in: 'query', name: 'owner-role-id', type: 'string', required: false },
            { in: 'query', name: 'owner-role-code', type: 'string', required: false },
            { in: 'query', name: 'owner-id', type: 'string', required: false },
            { in: 'query', name: 'isPublic', type: 'boolean', required: false },
            { in: 'query', name: 'isParent', type: 'boolean', required: false }
        ]
    }
}, {
    url: '/{id}',
    // post: {
    //     summary: 'create a folder inside folder',
    //     description: 'create a folder in a folder by given id/name',
    //     operationId: 'create-folder-in-folder-id',
    //     parameters: [
    //         'x-role-key',
    //         { in: 'path', name: 'id', description: 'id or name', type: 'string', required: true },
    //         'body'
    //     ]
    // },
    get: {
        parameters: ['x-role-key',
            { in: 'path', name: 'id', description: 'id or name', type: 'string', required: true },
            { in: 'query', name: 'entity-id', type: 'string', required: false },
            { in: 'query', name: 'entity-type', type: 'string', required: false },
            { in: 'query', name: 'owner-role-id', type: 'string', required: false },
            { in: 'query', name: 'owner-role-code', type: 'string', required: false },
            { in: 'query', name: 'owner-id', type: 'string', required: false }
        ]
    }
    // put: { parameters: ['x-role-key'] },
    // delete: { parameters: ['x-role-key'] }
}]
