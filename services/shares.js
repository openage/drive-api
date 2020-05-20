'use strict'

const db = require('../models')
const users = require('./users')
const offline = require('@open-age/offline-processor')

const populate = 'user file folder createdBy'

const set = async (model, entity, context) => {
    if (model.expires) {
        entity.expires = model.expires
    }

    if (model.role) {
        entity.role = model.role
    }

    if (model.isFavourite !== undefined) {
        entity.isFavourite = model.isFavourite
    }
}

exports.create = async (data, context) => {
    let log = context.logger.start('services/shares:create')

    let entity = await this.get(data, context)

    if (!entity) {
        entity = new db.share({
            date: new Date(),
            file: data.file,
            folder: data.folder,
            user: await users.get(data.user, context),
            createdBy: context.user,
            tenant: context.tenant
        })
    }

    await set(data, entity, context)

    await entity.save()

    await offline.queue('share', 'create', entity, context)

    log.end()
    return entity
}

exports.update = async (data, context) => {
    let log = context.logger.start('services/shares:create')

    let entity = await this.get(data, context)

    await set(data, entity, context)

    await entity.save()

    await offline.queue('share', 'update', entity, context)

    log.end()
    return entity
}

exports.get = async (query, context) => {
    context.logger.start('services/shares:get')

    if (typeof query === 'string' && query.isObjectId()) {
        return db.share.findById(query).populate(populate)
    }

    if (query.user && (query.file || query.folder)) {
        let where = {
            user: await users.get(query.user, context),
            tenant: context.tenant
        }

        if (query.folder) {
            where.folder = query.folder
        }

        if (query.file) {
            where.file = query.file
        }
        return db.share.find(where).populate(populate)
    }
}

exports.search = async (query, paging, context) => {
    context.logger.start('services/shares:search')

    if (typeof query === 'string' && query.isObjectId()) {
        return db.share.findById(query).populate(populate)
    }

    let where = {
        tenant: context.tenant
    }

    if (query.user) {
        where.user = await users.get(query.user, context)
    } else {
        where.user = context.user
    }

    if (query.isFavourite !== undefined) {
        where.isFavourite = query.isFavourite
    }

    if (query.folder) {
        where.folder = query.folder
    }

    if (query.file) {
        where.file = query.file
    }

    return {
        items: await db.share.find(where).populate(populate)
    }
}
