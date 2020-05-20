module.exports = [{
    url: '',
    post: { permissions: ['tenant.user'] },
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
            { name: 'isFavourite', type: 'boolean' },
            { name: 'sort', description: 'name,timeStamp' }
        ]
    }
}, {
    url: '/:id',
    get: { permissions: ['tenant.guest', 'tenant.user'] },
    put: { permissions: ['tenant.user'] },
    delete: { permissions: ['tenant.user'] }
}]
