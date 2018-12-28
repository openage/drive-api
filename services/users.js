'use strict'
let db = require('../models')

exports.get = async (query, context) => {
    let log = context.logger.start('services:users:get')
    let user = null
    if (!query) {
        user = null
    } else if (typeof query === 'string' && query.isObjectId()) {
        user = await db.user.findById(query)
    } else if (query.id) {
        user = await db.user.findById(query.id)
    } else {
        let roleCode = query.code || query.uniqueCode || query.roleCode || (query.role && query.role.code)

        if (query.role && query.role.code) {
            roleCode = query.role.code
        }

        let roleId = query.roleId || query.uId || query.uniqueId || query.qrCode || (query.role && query.role.id)

        if (query.role && query.role.id) {
            roleId = query.role.id
        }

        if (roleId) {
            user = await db.user.findOne({
                'role.id': roleId,
                tenant: context.tenant.id
            })
            // if not user - create
        } else if (roleCode) {
            user = await db.user.findOne({
                'role.code': roleCode,
                tenant: context.tenant.id
            })
            // if not user - create
        }
    }
    log.end()

    return user
}
