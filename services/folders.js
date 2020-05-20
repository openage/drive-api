'use strict'
let db = require('../models')
let users = require('./users')
const entities = require('./entities')
const shareService = require('./shares')

const offline = require('@open-age/offline-processor')

const rootCode = 'root'

const populate = 'owner parent'

const set = async (model, entity, context) => {
    if (model.code && model.code !== entity.code) {
        // if (await this.get(model.code, context)) {
        //     throw new Error(`${model.code} already exists`)
        // }

        model.code = model.code.trim().toLowerCase().replace(' ', '-')

        // code needs to some thing like
        // parent-2|parent-1|folder

        let parentCode = ''

        if (entity.parent) {
            parentCode = entity.parent.code
        } else if (model.parent && model.parent.code) {
            parentCode = model.parent.code.toLowerCase()
        }

        if (parentCode && !model.code.startsWith(parentCode)) {
            model.code.replace('|', '-')
            model.code = `${parentCode}|${model.code}`
        }

        entity.code = model.code.toLowerCase()
    }

    if (model.name) {
        entity.name = model.name
    }

    if (model.description) {
        entity.description = model.description
    }

    if (model.status && entity.status != model.status) {
        if (entity.status === 'trash' && model.status === 'active') {
            // take out all the files from trash
            await db.file.update({ folder: entity.id }, {
                $set: {
                    status: 'active'
                }
            }, { multi: true })
        }
        entity.status = model.status
    }

    if (model.isPublic !== undefined) {
        entity.isPublic = model.isPublic
    }

    if (model.owner) {
        entity.owner = await users.get(model.owner, context)
    } else {
        if (model.isPublic == undefined || model.isPublic == null) {
            entity.isPublic = true
        } else {
            entity.isPublic = model.isPublic
        }
    }

    if (model.parent) {
        let parent = await this.get(model.parent, context)
        if (!parent) {
            parent = await this.create(model.parent, context)
        }

        entity.parent = parent
    }

    if (model.meta) {
        entity.meta = model.meta
    }
}

exports.create = async (model, context) => {
    let log = context.logger.start('services:folders:create')

    if (!model.code) {
        model.code = rootCode
    }

    if (!model.name) {
        model.name = model.code
    }

    if (!model.parent && model.code !== rootCode) {
        model.parent = {
            code: rootCode
        }
    }

    if (model.parent && !model.code.startsWith(model.parent.code)) {
        model.code = `${model.parent.code}|${model.code}`
    }

    let entity = await this.get(model, context)

    if (!entity) {
        entity = new db.folder({
            status: 'active',
            owner: context.user,
            organization: context.organization,
            tenant: context.tenant
        })
    }

    await set(model, entity, context)

    await entity.save()

    await offline.queue('folder', 'create', entity, context)
    log.end()

    return entity
}

exports.get = async (query, context) => {
    let log = context.logger.start('services:folders:get')

    let folder = null
    if (typeof query === 'string') {
        if (query.isObjectId()) {
            return db.folder.findById(query).populate(populate)
        }
        let where = {
            tenant: context.tenant,
            code: query.toLowerCase()
        }
        if (context.user) {
            where.owner = context.owner
            // TODO: add shared with me
        } else {
            where.isPublic = true
        }

        if (context.organization) {
            where.organization = context.organization
        }

        return db.folder.findOne(where).populate(populate)
    }
    if (query.id) {
        return db.folder.findById(query.id).populate(populate)
    }

    if (query.name) {
        query.code = query.name
    }

    if (query.code) {
        query.code = query.code.toLowerCase()

        if (!query.code.startsWith(rootCode)) {
            query.code = `${rootCode}|${query.code}`
        }
        let where = {
            isPublic: query.isPublic,
            code: query.code.toLowerCase(),
            tenant: context.tenant
        }

        if (query.entity) {
            where.entity = await entities.get(query.entity, context)
        }

        if (query.owner) {
            where.owner = await users.get(query.owner, context)
        } else if (context.owner) {
            where.owner = context.owner
        } else {
            where.isPublic = true
        }

        if (context.organization) {
            where.organization = context.organization
        }

        return db.folder.findOne(where).populate(populate)
    }
    log.end()

    return folder
}

exports.update = async (id, model, context) => {
    let entity = await this.get(id, context)

    await set(model, entity, context)

    await entity.save()

    await offline.queue('folder', 'update', entity, context)
    // if name is updated - update all the  files.tag.folder

    return entity
}

exports.getChildren = async (parentId, context) => {
    let log = context.logger.start('services/folders:getChildren')

    if (!parentId) {
        throw new Error(`parentId required`)
    }

    log.debug(`fetching child folder's for folder id: ${parentId}`)

    let children = await db.folder.find({
        parent: parentId
    })

    log.end()

    return children
}

exports.remove = async (id, context) => {
    let entity = await this.get(id, context)

    if (!entity) {
        return 'folder does not exist'
    }

    if (entity.code == rootCode) {
        return `${rootCode} folder can not deleted`
    }

    await db.file.update({ folder: entity.id }, {
        $set: {
            status: 'trash'
        }
    }, { multi: true })

    entity.status = 'trash'

    await entity.save()

    await offline.queue('folder', 'remove', entity, context)
}

exports.search = async (query, paging, context) => {
    let log = context.logger.start('services/folders:search')

    if (query.isFavourite || query.shared) {
        let shared = await shareService.get({
            user: context.user,
            foldersOnly: true,
            isFavourite: query.isFavourite
        }, context)

        return {
            items: shared.items.map(item => {
                let file = item.file
                file.isFavourite = true
                return file
            })
        }
    }
    let sorting = ''
    if (paging && paging.sort) {
        sorting = paging.sort
    }

    let sort = {}

    switch (sorting) {
        default:
            sort['code'] = 1
            break
    }

    query = query || {}

    let where = {
        tenant: context.tenant,
        status: query.status || 'active'
    }

    if (query.name) {
        where['name'] = {
            $regex: query.name,
            $options: 'i'
        }
    }
    if (query.code) {
        where['code'] = {
            $regex: query.code,
            $options: 'i'
        }
    }

    if (query.entity) {
        where.entity = await entities.get(query.entity, context)
    }

    if (query.owner) {
        where.owner = await users.get(query.owner, context)
    }

    if (query.isPublic !== undefined) {
        where.isPublic = !!(query.isPublic === 'true' || query.isPublic === true)
    }

    let count = 0
    let items
    if (paging) {
        items = await db.folder.find(where).sort(sort).skip(paging.skip).limit(paging.limit).populate(populate)
        count = await db.folder.find(where).count()
    } else {
        items = await db.folder.find(where).sort(sort).populate(populate)
        count = items.length
    }
    log.end()

    return {
        count: count,
        items: items
    }
}
