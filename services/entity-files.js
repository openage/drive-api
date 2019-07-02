'use strict'
const db = require('../models')

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
        organization: context.organization,
        tenant: context.tenant
    }).save()
}

const getOrCreate = async (data, context) => {
    let log = context.logger.start('services:entity-files:getOrCreate')

    let query = {
        name: data.name,
        tenant: context.tenant,
        entityType: data.entityType
    }

    if (context.organization) {
        query.organization = context.organization
    }

    let entityFile = await db.entityFile.findOne(query)

    if (!entityFile) {
        return create(data, context)
    }

    log.end()
    return entityFile
}

const get = async (id, context) => {
    let log = context.logger.start('services/entity-files:get')

    let entityFile = db.entityFile.findById(id)

    log.end()
    return entityFile
}

const search = async (query, context) => {
    let log = context.logger.start('services/entity-files:search')

    let entityFiles = db.entityFile.find(query)

    log.end()
    return entityFiles
}

exports.create = create
exports.get = get
exports.search = search
exports.getOrCreate = getOrCreate
