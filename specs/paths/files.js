module.exports = [{
    url: '{entityType}/{entityId}/files',
    post: {
        summary: 'upload a file to a folder',
        description: 'upload file to root folder of the entity',
        operationId: 'upload-file',
        consumes: ['multipart/form-data'],
        parameters: [
            'x-role-key',
            { in: 'path', name: 'entityType', type: 'string', required: true },
            { in: 'path', name: 'entityId', type: 'string', required: true },
            { in: 'formData', name: 'file', type: 'file', required: true },
            { in: 'query', name: 'folder-name', description: 'default is root', type: 'string', required: false },
            { in: 'query', name: 'folder-id', type: 'string', required: false },
            { in: 'query', name: 'owner-role-id', type: 'string', required: false },
            { in: 'query', name: 'owner-role-code', type: 'string', required: false },
            { in: 'query', name: 'name', type: 'string', required: false },
            { in: 'query', name: 'is-public', description: 'if folder is created, it would have same value', type: 'boolean', required: false }
        ]
    },
    get: {
        summary: 'gets the files',
        description: 'gets files of the entity',
        operationId: 'get-files',
        parameters: [
            'x-role-key',
            { in: 'path', name: 'entityType', type: 'string', required: true },
            { in: 'path', name: 'entityId', type: 'string', required: true },
            { in: 'query', name: 'folder-name', description: 'default is root', type: 'string', required: false },
            { in: 'query', name: 'folder-id', type: 'string', required: false },
            { in: 'query', name: 'owner-role-id', type: 'string', required: false },
            { in: 'query', name: 'owner-role-code', type: 'string', required: false },
            { in: 'query', name: 'name', type: 'string', required: false },
            { in: 'query', name: 'is-public', type: 'boolean', required: false },
            { in: 'query', name: 'isFavourite', type: 'boolean', required: false },
            { in: 'query', name: 'isMostViewed', type: 'boolean', required: false },
            { in: 'query', name: 'isRecent', type: 'boolean', required: false }
        ]
    }
}, {
    url: '{entityType}/{entityId}/files/{name}',
    post: {
        summary: 'create by name',
        description: 'upload file to root folder of the entity',
        operationId: 'upload-file-by-name',
        consumes: ['multipart/form-data'],
        parameters: [
            'x-role-key',
            { in: 'path', name: 'entityType', type: 'string', required: true },
            { in: 'path', name: 'entityId', type: 'string', required: true },
            { in: 'path', name: 'name', type: 'string', required: true },
            { in: 'formData', name: 'file', type: 'file', required: true },
            { in: 'query', name: 'folder-name', description: 'default is root', type: 'string', required: false },
            { in: 'query', name: 'folder-id', type: 'string', required: false },
            { in: 'query', name: 'owner-role-id', type: 'string', required: false },
            { in: 'query', name: 'owner-role-code', type: 'string', required: false },
            { in: 'query', name: 'is-public', description: 'if folder is created, it would have same value', type: 'boolean', required: false }
        ]
    },
    get: {
        summary: 'get by name',
        description: 'gets files of the entity',
        operationId: 'get-file-by-name',
        parameters: [
            'x-role-key',
            { in: 'path', name: 'entityType', type: 'string', required: true },
            { in: 'path', name: 'entityId', type: 'string', required: true },
            { in: 'path', name: 'name', type: 'string', required: true },
            { in: 'query', name: 'owner-role-id', type: 'string', required: false },
            { in: 'query', name: 'owner-role-code', type: 'string', required: false },
            { in: 'query', name: 'is-public', type: 'boolean', required: false }
        ]
    }
}, {
    url: '/{id}',
    put: { parameters: ['x-role-key'] },
    get: { parameters: ['x-role-key'] }
    // delete: { parameters: ['x-role-key'] }
}, {
    url: '/{id}/streams',
    get: {
        summary: 'streams file',
        description: 'read stream file',
        parameters: [
            'x-role-key',
            { in: 'path', name: 'id', description: 'document id', type: 'string', required: true }
        ]
    }
}, {

}]
