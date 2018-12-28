let user = require('./user-summary')
let file = require('./file-summary')
let folder = require('./folder-summary')

let tenant = require('./tenants')
let organization = require('./organizations')

module.exports = {

    id: 'string',

    thumbnail: 'string',

    name: 'string',
    description: 'string',

    isPublic: 'boolean',

    parent: {
        id: 'string',
        thumbnail: 'string',
        name: 'string'
    },

    folders: [folder],
    files: [file],

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
