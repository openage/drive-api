'use strict'
let db = require('../models')

exports.get = async (query, context) => {
    let log = context.logger.start('services/entities:get')
    let entity = null
    if (typeof query === 'string' && query.isObjectId()) {
        entity = await db.entity.findById(query)
    } else if (query.id && query.type) {
        entity = await db.entity.findOne({
            entityId: query.id,
            entityType: query.type,
            tenant: context.tenant
        })

        if (!entity) {
            entity = await new db.entity({
                entityId: query.id,
                entityType: query.type,
                organization: context.organization,
                tenant: context.tenant
            }).save()
        }
    }
    log.end()

    return entity
}
