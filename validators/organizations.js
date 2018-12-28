'use strict'

const organizationService = require('../services/organizations')

exports.canCreate = async (req) => {
    if (!req.body.name) { return 'organization name required' }

    if (!req.body.code) { return 'organization code required' }

    // if (!req..owner) { return 'organization owner required' }

    let organization = await organizationService.getByCode(req.body.code)
    if (organization) {
        return 'organization already exist'
    }
    // let user = await userService.getOrCreate(req.body.owner.user, req.context)
    // req.body.owner.user = user
}

exports.canUpdate = async (req) => {
    if (req.body.code) {
        let organization = await organizationService.getByCode(req.body.code)

        if (organization) { return 'organization already exist' }
    }
}
