'use strict'
const db = require('../models')
const entities = require('./entities')
const users = require('./users')
const folders = require('./folders')
const imageService = require('./images')

const config = require('config')
const storeConfig = config.get('store')

const getStore = context => {
    if (context.organization && context.organization.store && context.organization.store.provider) {
        return context.organization.store
    } else if (context.tenant && context.tenant.store && context.tenant.store.provider) {
        return context.tenant.store
    } else {
        return {
            provider: storeConfig.provider,
            config: config.get(`providers.${storeConfig.provider}`)
        }
    }
}

const create = async (model, context) => {
    let store = getStore(context)

    let provider = require(`../providers/${store.provider}`)

    let file = await provider.config(store.config).store(model.file)

    file.thumbnail = await imageService.thumbnailFromUrl(file.url)

    let entity = await entities.get(model.entity, context)

    if (!entity) {
        throw new Error('entity is required')
    }

    let owner = await users.get(model.owner, context) || context.user

    if (model.folder) {
        model.folder.isPublic = model.isPublic
    }

    let folder = await folders.get(model.folder || {
        name: 'root',
        owner: owner,
        isPublic: true
    }, context)

    if (model.isPublic === undefined) {
        model.isPublic = folder.isPublic
    }

    let tags = {
        folder: folder.name
    }

    const existingFiles = await search(model, context)

    let version = 0
    let previous

    if (existingFiles && existingFiles.length) {
        for (let fileItem of existingFiles) {
            if (fileItem.version > version) {
                version = fileItem.version
                previous = {
                    version: fileItem.version,
                    path: fileItem.path,
                    url: fileItem.url,
                    uploadedBy: fileItem.uploadedBy,
                    timeStamp: fileItem.timeStamp
                }
            }
            await fileItem.remove()
        }
    }

    return new db.file({
        entity: entity,
        url: file.url,
        thumbnail: file.thumbnail,
        path: file.path,
        version: version + 1,
        previous: previous,
        identifier: model.identifier,
        isPublic: model.isPublic,
        isVirtual: model.isVirtual,
        isTemplate: model.isTemplate,
        name: model.name || model.file.name,
        mimeType: model.file.type,
        folder: folder,
        tags: tags,
        owner: owner,
        uploadedBy: context.user,
        store: store.provider,
        organization: context.organization,
        tenant: context.tenant
    }).save()
}

const remove = async (id, context) => {
    return db.file(id).remove()
}

const get = async (query, context) => {
    let where = {
        tenant: context.tenant.id
    }

    if (query.folder && query.folder.id) {
        where.folder = query.folder.id
    } else if (query.folder && query.folder.name) {
        where['tags.folder'] = query.folder.name
    }

    if (query.owner) {
        let owner = await users.get(query.owner, context)
        if (owner) {
            where.owner = owner.id
        }
    }

    if (query.entity) {
        where.entity = (await entities.get(query.entity, context)).id
    }

    if (query.name) {
        where.name = query.name
    }

    if (query.version) {
        where.version = query.version
    }

    return db.file.findOne(where).populate('entity owner folder uploadedBy')
}

const search = async (query, context) => {
    let log = context.logger.start('services:files:search')

    let where = {
        tenant: context.tenant.id
    }

    if (query.folder && query.folder.id) {
        where.folder = query.folder.id
    } else if (query.folder && query.folder.name) {
        where['tags.folder'] = query.folder.name
    }

    if (query.owner) {
        let owner = await users.get(query.owner, context)
        if (owner) {
            where.owner = owner.id
        }
    }

    if (query.entity) {
        where.entity = await entities.get(query.entity, context)
    }
    if (query.name) {
        where.name = query.name
    }

    let files = await db.file.find(where).populate('entity owner folder uploadedBy')

    let fileNames = files.map(file => file.name)

    let entityFiles = await db.entityFile.find({             //todo for folders
        $and: [{
            tenant: context.tenant,
            entityType: where.entity.entityType
        }, {
            name: {
                $nin: fileNames
            }
        }]
    })

    log.end()
    return files.concat(entityFiles)
}

exports.get = get
exports.create = create
exports.search = search
exports.remove = remove
