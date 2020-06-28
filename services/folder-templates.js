'use strict'

const db = require('../models')
const templateHelper = require('../helpers/template')
const fileTemplateService = require('./file-templates')
const userService = require('./users')

const extractContext = (context) => {
    const pic = (item) => {
        item = item || {}
        return {
            url: item.url,
            thumbnail: item.thumbnail
        }
    }

    let result = {}

    if (context.tenant) {
        result.tenant = {
            id: context.tenant.id,
            code: context.tenant.code,
            name: context.tenant.name,
            logo: pic(context.tenant.logo)
        }
    }

    if (context.organization) {
        result.organization = {
            id: context.organization.id,
            code: context.organization.code,
            shortName: context.organization.shortName,
            name: context.organization.name,
            logo: pic(context.organization.logo),
            address: {}
        }

        if (context.organization.address) {
            result.organization.address = {
                line1: result.organization.address.line1,
                line2: result.organization.address.line2,
                district: result.organization.address.district,
                city: result.organization.address.city,
                state: result.organization.address.state,
                pinCode: result.organization.address.pinCode,
                country: result.organization.address.country
            }
        }
    }

    if (context.user) {
        result.user = {
            id: context.user.id,
            code: context.user.code,
            email: context.user.email,
            phone: context.user.phone,
            profile: {
                firstName: context.user.profile.firstName,
                lastName: context.user.profile.lastName,
                pic: pic(context.user.profile.pic)
            },
            role: {
                id: context.user.role.id
            }
        }
    }

    return result
}

const merge = (model, data) => {
    if (!data) {
        return model
    }

    for (const field of Object.getOwnPropertyNames(data)) {
        if (!model[field]) {
            model[field] = data[field]
        } else {
            model[field] = merge(model[field], data[field])
        }
    }

    return model
}

const set = async (model, entity, context) => {
    if (model.code !== undefined && model.code !== entity.code) {
        let exists = await exports.get(model.code, context)

        if (exists) {
            throw new Error('code ' + model.code + ' already exists')
        }
        entity.code = model.code.toLowerCase()
    }

    if (model.name !== undefined) {
        entity.name = model.name
    }

    if (model.description !== undefined) {
        entity.description = model.description
    }

    if (model.tags) {
        entity.tags = model.tags
    }

    if (model.owner) {
        entity.owner = model.owner
    }

    if (model.parent && model.parent.code) {
        entity.parent = model.parent.code.toLowerCase()
    }

    if (model.thumbnail) {
        entity.thumbnail = model.thumbnail
    }

    if (model.isPublic !== undefined) {
        entity.isPublic = model.isPublic
    }

    if (model.feed) {
        entity.feed = {
            url: model.feed,
            period: model.period
        }
    }

    if (model.files) {
        entity.files = []
        if (model.files.length) {
            for (let file of model.files) {
                let fileTemplate = await fileTemplateService.get({ code: file.code }, context)
                entity.files.push(fileTemplate)
            }
        }
    }

    if (model.status) {
        entity.status = model.status
    }

    return entity
}

exports.create = async (model, context) => {
    if (!model.code) {
        throw new Error('code is required')
    }

    let entity = await exports.get(model, context)

    // if (entity) {
    //     throw new Error('code ' + model.code + ' already exists')
    // }

    if (!entity) {
        entity = new db.folderTemplate({
            code: model.code.toLowerCase(),
            // organization: context.organization,
            tenant: context.tenant
        })
    }

    await set(model, entity, context)

    await entity.save()

    return entity
}

exports.update = async (id, model, context) => {
    let entity = await exports.get(id, context)
    await set(model, entity, context)
    return entity.save()
}

exports.search = async (query, page, context) => {
    let where = {
        tenant: context.tenant
    }

    if (query.folder) {
        where.folder = query.folder.code
    }

    if (query.status) {
        where.status = query.status
    }

    const count = await db.folderTemplate.find(where).count()
    let items
    if (page) {
        items = await db.folderTemplate.find(where).skip(page.skip).limit(page.limit)
    } else {
        items = await db.folderTemplate.find(where)
    }

    return {
        count: count,
        items: items
    }
}

const folderBuilder = async (model, template, meta, context) => {
    let data = {
        context: extractContext(context),
        meta: meta
    }
    model.code = template.code
    model.name = templateHelper.formatter(template.name || '').inject(data)
    model.description = templateHelper.formatter(template.description || '').inject(data)
    model.tags = []
    template.tags.forEach(tag => {
        model.tags.push(templateHelper.formatter(tag || '').inject(data))
    })

    if (template.owner) {
        model.owner = template.owner.inject(data)
    }

    if (template.feed) {
        model.feed = {
            url: model.feed.url,
            period: model.feed.period || 60
        }
    }
    model.thumbnail = template.thumbnail
    model.isPublic = template.isPublic

    return model
}

exports.build = async (template, model, meta, context) => {
    context.logger.silly('services/folder-templates:build')

    meta = meta || {}

    meta.name = model.name
    meta.description = model.description

    meta = merge(meta, template.meta)

    meta = JSON.parse(templateHelper.formatter(JSON.stringify(meta)).inject({
        context: context,
        meta: meta
    }))

    return folderBuilder(model, template, meta, context)
}

exports.get = async (query, context) => {
    context.logger.silly('services/folder-templates:get')

    if (typeof query === 'string') {
        if (query.isObjectId()) {
            return db.folderTemplate.findById(query)
        } else {
            return db.folderTemplate.findOne({
                code: query.toLowerCase(),
                tenant: context.tenant
            })
        }
    } else if (query.id) {
        return db.folderTemplate.findById(query.id)
    } else if (query.code) {
        return db.folderTemplate.findOne({
            code: query.code.toLowerCase(),
            tenant: context.tenant
        })
    }
}
