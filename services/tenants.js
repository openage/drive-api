'use strict'
var db = require('../models')

const set = async (model, entity, context) => {
    if (model.name) {
        entity.name = model.name
    }

    if (model.logo) {
        entity.logo = {
            url: model.logo.url,
            thumbnail: model.thumbnail.url
        }
    }

    if (model.status) {
        entity.status = model.status
    }

    if (model.config) {
        entity.config = model.config
    }

    if (model.store) {
        entity.store = entity.store || {}

        if (model.store.provider) {
            entity.store.provider = model.store.provider
        }

        if (model.store.config) {
            entity.store.config = model.store.config
        }
    }

    if (model.sign) {
        entity.sign = entity.sign || {}

        if (model.sign.provider) {
            entity.sign.provider = model.sign.provider
        }

        if (model.sign.config) {
            entity.sign.config = model.sign.config
        }
    }

    if (model.owner) {
        let user = await db.user.findOrCreate({
            email: model.owner.email
        }, {
            email: model.owner.email,
            name: model.owner.name,
            tenant: entity
        })

        entity.owner = user.result
    }
}

exports.update = async (id, model, context) => {
    let tenant = await this.get(id, context)
    await set(model, tenant, context)
    return tenant.save()
}

exports.create = async (model, context) => {
    let log = context.logger.start('services/tenants:create')

    let tenant = await exports.get(model, context)

    if (!tenant) {
        tenant = new db.tenant({
            code: model.code.toLowerCase(),
            status: 'active'
        }).save()
    }

    await set(model, tenant, context)
    log.end()
    return tenant
}

exports.get = async (query, context) => {
    if (!query) {
        return
    }
    if (
        query === 'my' || query.code === 'my' || query.id === 'my' ||
        query === 'me' || query.code === 'me' || query.id === 'me'
    ) {
        query.id = context.tenant.id
    }

    if (typeof query === 'string') {
        if (query.isObjectId()) {
            return db.tenant.findById(query).populate('owner')
        } else {
            return db.tenant.findOne({ code: query.toLowerCase() }).populate('owner')
        }
    }

    if (query.id) {
        return db.tenant.findById(query.id).populate('owner')
    }

    if (query.code) {
        return db.tenant.findOne({ code: query.code.toLowerCase() }).populate('owner')
    }

    return null
}

exports.search = async (query, page, context) => {
    let where = {
    }
    if (!page || !page.limit) {
        return {
            items: await db.tenant.find(where)
        }
    }
    return {
        items: await db.tenant.find(where).limit(page.limit).skip(page.skip),
        count: await db.tenant.count(where)
    }
}
