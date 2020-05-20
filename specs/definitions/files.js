let user = require('./user-summary')
let folder = require('./folder-summary')
let tenant = require('./tenants')
let organization = require('./organizations')

module.exports = {
    id: 'string',
    code: 'string',
    name: 'string',

    url: 'string',
    thumbnail: 'string',
    mimeType: 'string',

    description: 'string',
    version: 'number',

    isTemplate: 'boolean',
    isVirtual: 'boolean',
    isPublic: 'boolean',

    isFavourite: 'boolean',

    folder: folder,

    owner: user,
    creator: user,

    organization: organization,
    tenant: tenant

}
