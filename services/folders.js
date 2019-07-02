'use strict'
let db = require('../models')

let users = require('./users')

const create = async (model, context) => {
    let log = context.logger.start('services:folders:create')

    let owner = await users.get(model.owner || context.user, context)

    let parent = model.parent ? await get(model.parent, context) : null

    let folder = await new db.folder({
        name: model.name || 'root',
        parent: parent,
        isPublic: !!model.isPublic,
        owner: owner,
        organization: context.organization,
        tenant: context.tenant
    }).save()

    log.end()

    return folder
}

const get = async (query, context) => {
    let log = context.logger.start('services:folders:get')
    let folder = null
    if (typeof query === 'string') {
        if (query.isObjectId()) {
            folder = await db.folder.findById(query)
        } else {
            folder = await db.folder.findOne({
                name: query,
                'owner.id': context.user.id
            })
        }
    } else if (query.id) {
        folder = await db.folder.findById(query.id)
    } else if (query.name) {
        let ownerId = query.ownerId || context.user.id

        let where = {
            name: query.name,
            tenant: context.tenant.id
        }
        if (query.owner) {
            ownerId = query.owner.id
        }

        let roleCode = query.code || query.uniqueCode || query.roleCode

        if (query.role && query.role.code) {
            roleCode = query.role.code
        }

        let roleId = query.roleId || query.uId || query.uniqueId || query.qrCode

        if (query.role && query.role.id) {
            roleId = query.role.id
        }

        if (roleId) {
            where['owner.role.id'] = roleId
        } else if (roleCode) {
            where['owner.role.code'] = roleCode
        } else if (ownerId) {
            where['owner'] = ownerId
        } else {
            where['owner'] = context.user
            folder = await db.folder.findOne({
                name: query.name,
                owner: context.user
            })
        }

        folder = await db.folder.findOne(where).populate('owner parent')

        if (!folder) {
            folder = await create({
                name: query.name,
                isPublic: !!query.isPublic,
                owner: roleId || roleCode || ownerId ? {
                    id: ownerId,
                    role: {
                        id: roleId,
                        code: roleCode
                    }
                } : null
            }, context)
        }
    }
    log.end()

    return folder
}

const update = async (id, model, context) => {
    // if name is updated - update all the  files.tag.folder
}

const getChildren = async (parentId, context) => {
    let log = context.logger.start('services/folders:getChildrens')

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

exports.get = get
exports.create = create
exports.update = update
exports.getChildren = getChildren
