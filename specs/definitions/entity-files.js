const tenant = require('./tenants')

module.exports = {
    id: 'string',
    name: 'string',
    description: 'string',
     thumbnail: 'string',
     mimeTypes: ['string'],
     isPublic: 'boolean',
     url: 'string',
     isVirtual: 'boolean',
     folder: 'string',
     entityType: 'string',
     tenant: tenant
}