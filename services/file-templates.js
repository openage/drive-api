'use strict'

const htmToPdf = require('html-pdf')
const htmlToDocx = require('html-docx-js')

const db = require('../models')
const templateHelper = require('../helpers/template')
const folderService = require('./folders')
const userService = require('./users')
const dataSource = require('../helpers/data-source')

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

    if (model.summary !== undefined) {
        entity.summary = model.summary
    }

    if (model.content) {
        entity.content = entity.content || {}
        entity.content.body = model.content.body || model.content
    }

    if (model.tags) {
        entity.tags = model.tags
    }

    if (model.owner) {
        entity.owner = model.owner
    }

    if (model.folder && model.folder.code) {
        entity.folder = model.folder.code.toLowerCase()
    }

    if (model.language) {
        entity.language = model.language
    }

    if (model.thumbnail) {
        entity.thumbnail = model.thumbnail
    }

    if (model.isPublic !== undefined) {
        entity.isPublic = model.isPublic
    }

    if (model.isDynamic !== undefined) {
        entity.isDynamic = model.isDynamic
    }

    if (model.isPlaceholder !== undefined) {
        entity.isPlaceholder = model.isPlaceholder
    }

    if (model.isRequired !== undefined) {
        entity.isRequired = model.isRequired
    }

    if (model.mimeTypes) {
        entity.mimeTypes = model.mimeTypes
    }

    if (model.hooks) {
        entity.hooks = model.hooks.map(m => {
            return {
                trigger: m.trigger,
                url: m.url,
                action: m.action,
                config: m.config,
                data: m.data
            }
        })
    }

    if (model.dataSource) {
        entity.dataSource = {
            type: model.dataSource.type || 'http',
            connectionString: model.dataSource.connectionString || model.dataSource.url,
            config: model.dataSource.config || {},
            params: model.dataSource.params || [],
            field: model.dataSource.field || 'data'
        }
    }

    if (model.config) {
        entity.config = model.config
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
        entity = new db.fileTemplate({
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
        // organization: context.organization,
        tenant: context.tenant
    }

    if (query.folder) {
        where.folder = query.folder.code
    }

    if (query.status) {
        where.status = query.status
    }

    const count = await db.fileTemplate.find(where).count()
    let items
    if (page) {
        items = await db.fileTemplate.find(where).skip(page.skip).limit(page.limit)
    } else {
        items = await db.fileTemplate.find(where)
    }

    return {
        count: count,
        items: items
    }
}

const fileBuilder = async (model, template, meta, context) => {
    let data = {
        context: context,
        meta: meta
    }

    model.name = templateHelper.formatter(template.name || '').inject(data)
    model.summary = templateHelper.formatter(template.summary || '').inject(data)
    model.content = {
        body: templateHelper.formatter(template.content ? template.content.body : '' || '').inject(data),
        template: template
    }
    model.tags = []
    template.tags.forEach(tag => {
        model.tags.push(templateHelper.formatter(tag || '').inject(data))
    })
    model.owner = await userService.get({ email: template.owner }, context)
    model.code = template.code
    if (template.folder && model.owner) {
        model.folder = await folderService.get({ name: template.folder, ownerId: model.owner.id }, context)
    } else {
        model.folder = await folderService.get({ name: template.folder }, context)
    }
    model.language = template.language
    model.thumbnail = template.thumbnail
    model.isPublic = template.isPublic
    model.isDynamic = template.isDynamic
    model.isPlaceholder = template.isPlaceholder
    model.isRequired = template.isRequired
    model.mimeTypes = template.mimeTypes
    model.status = template.status

    return model
}

const docBuilder = (template, context) => {
    const nameFormatter = templateHelper.formatter(template.name || '')
    const bodyFormatter = templateHelper.formatter(template.content.body || '')
    return {
        toJson: (data) => {
            let model = {
                data: data,
                context: extractContext(context)
            }
            return {
                name: nameFormatter.inject(model),
                mimeType: 'text/json',
                content: bodyFormatter.inject(model)
            }
        },
        toHtml: (data) => {
            let model = {
                data: data,
                context: extractContext(context)
            }
            return {
                name: `${nameFormatter.inject(model)}.html`,
                mimeType: 'text/html',
                content: bodyFormatter.inject(model)
            }
        },
        toXML: (data) => {
            let model = {
                data: data,
                context: extractContext(context)
            }
            return {
                name: `${nameFormatter.inject(model)}.xml`,
                mimeType: 'text/xml',
                content: bodyFormatter.inject(model)
            }
        },
        toDocx: (data) => {
            let model = {
                data: data,
                context: extractContext(context)
            }
            let content = bodyFormatter.inject(model)
            return {
                name: `${nameFormatter.inject(model)}.docx`,
                mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                content: htmlToDocx.asBlob(content)
            }
        },
        toPdf: (data) => {
            let model = {
                data: data,
                context: extractContext(context)
            }
            let content = bodyFormatter.inject(model)

            return new Promise((resolve, reject) => {
                htmToPdf.create(content, template.config).toBuffer((err, buffer) => {
                    if (err) {
                        return reject(err)
                    }
                    resolve({
                        name: `${nameFormatter.inject(model)}.pdf`,
                        mimeType: 'application/pdf',
                        content: buffer
                    })
                })
            })
        }
    }
}

exports.build = async (model, meta, context) => {
    let log = context.logger.start('services/folder-templates:build')

    meta = meta || {}

    meta.name = model.name
    meta.description = model.description

    let template = await this.get(model.template || (model.content ? model.content.template : null), context)

    if (!template) {
        throw new Error(`template does not exist`)
    }

    meta = merge(meta, template.meta)

    meta = JSON.parse(templateHelper.formatter(JSON.stringify(meta)).inject({
        context: context,
        meta: meta
    }))

    let file = await fileBuilder(model, template, meta, context)

    file.meta = meta

    log.end()

    return file
}

exports.buildByModel = async (code, model, type, context) => {
    let template = await this.get(code, context)

    let items = await dataSource.fetch(model, context)

    let builder = docBuilder(template, context)

    switch (type) {
        case 'pdf':
            return builder.toPdf(items[0])
        case 'docx':
            return builder.toDocx(items[0])
        case 'html':
            return builder.toHtml(items[0])
        case 'json':
            return builder.toJson(items[0])
        case 'xml':
            return builder.toXML(items[0])
        default:
            throw new Error('NOT_SUPPORTED')
    }
}

exports.buildById = async (code, id, type, context) => {
    let template = await this.get(code, context)

    let items = await dataSource.fetch({
        dataSource: template.dataSource,
        data: { id: id }
    }, context)

    let builder = docBuilder(template, context)

    switch (type) {
        case 'pdf':
            return builder.toPdf(items[0])
        case 'html':
            return builder.toHtml(items[0])
        case 'docx':
            return builder.toDocx(items[0])
        case 'json':
            return builder.toJson(items[0])
        case 'xml':
            return builder.toXML(items[0])
        default:
            throw new Error('NOT_SUPPORTED')
    }
}

exports.get = async (query, context) => {
    context.logger.silly('services/file-templates:get')

    if (typeof query === 'string') {
        if (query.isObjectId()) {
            return db.fileTemplate.findById(query)
        } else {
            return db.fileTemplate.findOne({
                code: query.toLowerCase(),
                tenant: context.tenant
            })
        }
    } else if (query.id) {
        return db.fileTemplate.findById(query.id)
    } else if (query.code) {
        return db.fileTemplate.findOne({
            code: query.code.toLowerCase(),
            tenant: context.tenant
        })
    }
}
