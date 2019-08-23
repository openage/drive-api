let folders = require('../services/folders')

let files = require('../services/files')

const userService = require('../services/users')

const db = require('../models')

let mapper = require('../mappers/folder')

let users = require('../services/users')


exports.get = async (req) => {
    let entity = null

    if (req.body.entity) {
        entity = req.body.entity
    } else if (req.query['entity-type']) {
        entity = {
            type: req.query['entity-type'],
            id: req.query['entity-id']
        }
    } else if (req.params.entityType) {
        entity = {
            type: req.params.entityType,
            id: req.params.entityId
        }
    }

    let owner = {
        role: {}
    }

    if (req.body.owner) {
        owner = req.body.owner
    } else if (req.query['owner-role-id']) {
        owner.role.id = req.query['owner-role-id']
    } else if (req.query['owner-role-code']) {
        owner.role.code = req.query['owner-role-code']
    } else if (req.query['owner-id']) {
        owner.id = req.query['owner-id']
    } else {
        owner = req.context.user
    }

    let folder = await folders.get(req.params.id.isObjectId()
        ? req.params.id : {
            name: req.params.id,
            owner: owner
        }, req.context)

    folder.files = await files.search({
        entity: entity,
        folder: folder,
        owner: owner
    }, req.context)

    folder.folders = await folders.getChildren(folder.id, req.context)

    return mapper.toModel(folder)
}

exports.create = async (req) => {
    let log = req.context.logger.start('api/folders:create')

    const model = req.body

    let owner = {
        role: {}
    }

    if (req.body.owner) {
        owner = req.body.owner
    } else if (req.query['owner-role-id']) {
        owner.role.id = req.query['owner-role-id']
    } else if (req.query['owner-role-code']) {
        owner.role.code = req.query['owner-role-code']
    } else if (req.query['owner-id']) {
        owner.id = req.query['owner-id']
    } else {
        owner = req.context.user
    }

    model.owner = owner

    const folder = await folders.get(req.body, req.context)

    log.end()
    return mapper.toModel(folder)
}

exports.search = async (req) => {
    let log = req.context.logger.start('api/folders:search')

    let query = {}

    let isParent = !!(req.query.isParent === 'true' || req.query.isParent === true)

    if (isParent) {
        query.parent = null
    }

    if (req.query.status) {
        query.status = req.query.status
    } else {
        query.status = { $ne: 'trash' }
    }

    if (req.context.organization) {
        query.organization = req.context.organization
    }

    let owner = {
        role: {}
    }

    if (req.query['owner-role-id']) {
        owner.role.id = req.query['owner-role-id']
    } else if (req.query['owner-role-code']) {
        owner.role.code = req.query['owner-role-code']
    } else if (req.query['owner-id']) {
        owner.id = req.query['owner-id']
    } else {
        owner = req.context.user
    }

    query.owner = await userService.get(owner, req.context)

    if (req.query.isPublic) {
        query.isPublic = !!(req.query.isPublic === 'true' || req.query.isPublic === true)
    }

    const folderList = await db.folder.find(query)

    log.end()
    return mapper.toSearchModel(folderList)
}

exports.remove = async (req) => {
    await folders.remove(req.params.id, req.context)
    return true
}

exports.bulkRemove = async (req) => {
    let folderList = req.body

    let count = 0

    for (let file of folderList) {
        await folders.remove(file.id, req.context).then(() => count += 1)
    }

    return `Total ${count} folder's removed`
}
