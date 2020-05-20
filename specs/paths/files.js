module.exports = [{
    url: '',
    post: {
        summary: 'upload a file to a folder',
        description: 'upload file to root folder of the entity',
        operationId: 'upload-file',
        permissions: ['tenant.user'],
        consumes: ['multipart/form-data'],
        query: [
            { name: 'entity-type' },
            { name: 'entity-id' },
            { name: 'folder-code' },
            { name: 'folder-id' },
            { name: 'owner-email' },
            { name: 'owner-role-id' },
            { name: 'owner-role-code' },
            { name: 'code' },
            { name: 'name' },
            { name: 'isPublic', type: 'boolean' },
            { name: 'isTemplate', type: 'boolean' },
            { name: 'isVirtual', type: 'boolean' },
            { name: 'isFavourite', type: 'boolean' }
        ],
        parameters: [
            { in: 'formData', name: 'file', type: 'file', required: true }
        ]
    },
    get: {
        permissions: ['tenant.guest', 'tenant.user'],
        query: [
            { name: 'entity-type' },
            { name: 'entity-id' },
            { name: 'folder-code' },
            { name: 'folder-id' },
            { name: 'owner-email' },
            { name: 'owner-role-id' },
            { name: 'owner-role-code' },
            { name: 'code' },
            { name: 'name' },
            { name: 'isPublic', type: 'boolean' },
            { name: 'isTemplate', type: 'boolean' },
            { name: 'isVirtual', type: 'boolean' },
            { name: 'isFavourite', type: 'boolean' },
            { name: 'sort', description: 'name,timeStamp' }
        ]
    }
}, {
    url: '/:id',
    // post: {
    //     summary: 'create by name',
    //     description: 'upload file to root folder of the entity',
    //     operationId: 'upload-file-by-name',
    //     consumes: ['multipart/form-data'],
    //     parameters: [
    //         'x-role-key',
    //         { in: 'path', name: 'entityType', type: 'string', required: true },
    //         { in: 'path', name: 'entityId', type: 'string', required: true },
    //         { in: 'path', name: 'name', type: 'string', required: true },
    //         { in: 'formData', name: 'file', type: 'file', required: true },
    //         { in: 'query', name: 'folder-name', description: 'default is root', type: 'string', required: false },
    //         { in: 'query', name: 'folder-id', type: 'string', required: false },
    //         { in: 'query', name: 'owner-role-id', type: 'string', required: false },
    //         { in: 'query', name: 'owner-role-code', type: 'string', required: false },
    //         { in: 'query', name: 'is-public', description: 'if folder is created, it would have same value', type: 'boolean', required: false }
    //     ]
    // },
    get: {
        permissions: ['tenant.guest', 'tenant.user']
        // parameters: [
        //     'x-role-key',
        //     { in: 'path', name: 'entityType', type: 'string', required: true },
        //     { in: 'path', name: 'entityId', type: 'string', required: true },
        //     { in: 'path', name: 'name', type: 'string', required: true },
        //     { in: 'query', name: 'owner-role-id', type: 'string', required: false },
        //     { in: 'query', name: 'owner-role-code', type: 'string', required: false },
        //     { in: 'query', name: 'is-public', type: 'boolean', required: false }
        // ]
    },
    put: { permissions: ['tenant.user'] },
    delete: { permissions: ['tenant.user'] }
}, {
    url: '/:id/streams',
    get: {
        summary: 'streams file',
        description: 'read stream file',
        method: 'streams',
        permissions: ['tenant.guest', 'tenant.user']
    }
}, {
    url: '/:provider/success',
    post: {
        summary: 'success hook for signing provider',
        description: 'success hook for signing provider',
        method: 'providerCallback',
        permissions: ['guest', 'tenant.guest', 'tenant.user']
    }
}, {
    url: '/:provider/error',
    post: {
        summary: 'failure hook for signing provider',
        description: 'failure hook for signing provider',
        method: 'providerCallback',
        permissions: ['guest', 'tenant.guest', 'tenant.user']
    }
}]
