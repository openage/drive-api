module.exports = [{
    url: '',
    post: { permissions: ['tenant.user'] },
    get: {
        permissions: ['tenant.user'],
        query: [
            { name: 'folder-code' },
            { name: 'status' },
            { name: 'code' },
            { name: 'name' },
            { name: 'isPublic', type: 'boolean' },
            { name: 'isFavourite', type: 'boolean' }
        ]
    }
}, {
    url: '/:id',
    get: { permissions: ['tenant.guest', 'tenant.user'] },
    put: { permissions: ['tenant.user'] },
    delete: { permissions: ['tenant.user'] }
}]
