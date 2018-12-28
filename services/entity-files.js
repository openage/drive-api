'use strict'

const create = async (model, context) => {
   context.logger.start('services:entity-files:create')

    return new db.entityFile({
        name: model.name,
        description: model.description,
        thumbnail: model.thumbnail,
        mineTypes: model.mineTypes,
        isPublic: model.isPublic,
        isRequired: model.isRequired,
        entityType: model.entityType,
        tenant: context.tenant
    }).save()
}

const getOrCreate = async (data, context) => {
    let log = context.logger.start('services:entity-files:getOrCreate')

    let entityFile = await db.entityFile.findOne({
        tenant: context.tenant,
        name: data.name,
        entityType: data.entityType
    })

    if (!entityFile) {
        return create(data, context)
    }
     log.end()
    return entityFile
}

exports.create = create
exports.getOrCreate = getOrCreate