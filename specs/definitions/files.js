let user = require('./user-summary')
let folder = require('./folder-summary')
let tenant = require('./tenants')
let organization = require('./organizations')

module.exports = {
    id: 'string',

    url: 'string',
    thumbnail: 'string',
    mimeType: 'string',

    name: 'string',
    identifier: 'string',
    description: 'string',
    version: 'number',

    isTemplate: 'boolean',
    isVirtual: 'boolean',
    isPublic: 'boolean',

    folder: folder,

    owner: user,
    uploadedBy: user,
    sharedWith: [{
        role: 'string',
        expires: 'date',
        user: user
    }],
    organization: organization,
    tenant: tenant

}
