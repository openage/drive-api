'use strict'
let files = require('../services/files')
let mapper = require('../mappers/file')
// const paging = require('../helpers/paging')

const extractQuery = (req, context) => {
    let query = {
        name: req.query.name || req.params.name || req.body.name,
        isPublic: req.query['is-public'] || req.params.isPublic || req.body.isPublic,
        isTemplate: req.query['is-template'] || req.params.isTemplate || req.body.isTemplate,
        isVirtual: req.query['is-virtual'] || req.params.isVirtual || req.body.isVirtual,
        isFavourite: !!(req.query.isFavourite === 'true' || req.query.isFavourite === true),
        isMostViewed: !!(req.query.isMostViewed === 'true' || req.query.isMostViewed === true),
        isRecent: !!(req.query.isRecent === 'true' || req.query.isRecent === true)
    }

    if (req.body.entity) {
        query.entity = req.body.entity
    } else if (req.query['entity-type']) {
        query.entity = {
            type: req.query['entity-type'],
            id: req.query['entity-id']
        }
    } else if (req.params.entityType) {
        query.entity = {
            type: req.params.entityType,
            id: req.params.entityId
        }
    }

    if (req.body.folder) {
        query.folder = req.body.folder
    } else if (req.query['folder-name'] || req.query['folder-id'] || req.params.folderName || req.params.folderId) {
        query.folder = {
            name: req.query['folder-name'] || req.params.folderName,
            id: req.query['folder-id'] || req.params.folderId
        }
    }

    if (req.body.owner) {
        query.owner = req.body.owner
    } else if (req.query['owner-role-id']) {
        query.owner = {
            role: {
                id: req.query['owner-role-id']
            }
        }
    } else if (req.query['owner-role-code']) {
        query.owner = {
            role: {
                code: req.query['owner-role-code']
            }
        }
    } else if (req.query['owner-id']) {
        query.owner = {
            id: req.query['owner-id']
        }
    }

    if (req.body.entityOrganization) {
        query.entityOrganization = req.body.entityOrganization
    } else if (req.query['entity-organization-id']) {
        query.entityOrganization = {
            id: req.query['entity-organization-id']
        }
    } else if (req.query['entity-organization-code']) {
        query.entityOrganization = {
            code: req.query['entity-organization-code']
        }
    }

    return query
}

exports.create = async (req) => {
    let entity = {}

    if (req.body.entity) {
        entity = req.body.entity
    } else if (req.query['entity-type']) {
        entity.type = req.query['entity-type']
        entity.id = req.query['entity-id']
    } else if (req.params.entityType) {
        entity.type = req.params.entityType
        entity.id = req.params.entityId
    } else {
        entity.type = 'role'
        entity.id = req.context.role.id
    }

    let folder = {}

    if (req.body.folder) {
        folder = req.body.folder
    } else if (req.query['folder-name']) {
        folder.name = req.query['folder-name']
    } else if (req.query['folder-id']) {
        folder.id = req.query['folder-id']
    } else if (req.params.folderName) {
        folder.name = req.params.folderName
    } else if (req.params.folderId) {
        folder.id = req.params.folderId
    } else {
        folder.name = 'root'
        folder.isPublic = true
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

    let entityOrganization = {}

    if (req.body.entityOrganization) {
        entityOrganization = req.body.entityOrganization
    } else if (req.query['entity-organization-id']) {
        entityOrganization.id = req.query['entity-organization-id']
    } else if (req.query['entity-organization-code']) {
        entityOrganization.code = req.query['entity-organization-code']
    } else {
        entityOrganization = req.context.organization
    }

    let isPublic = req.query['is-public'] || req.params.isPublic || req.body.isPublic
    let isTemplate = req.query['is-template'] || req.params.isTemplate || req.body.isTemplate
    let isVirtual = req.query['is-virtual'] || req.params.isVirtual || req.body.isVirtual
    let name = req.query.name || req.params.name || req.body.name

    let document = await files.create({
        name: name,
        description: req.body.description,
        owner: owner,
        isPublic: isPublic,
        isTemplate: isTemplate,
        isVirtual: isVirtual,
        entity: entity,
        folder: folder,
        entityOrganization: entityOrganization,
        file: req.files.file
    }, req.context)

    return mapper.toModel(document)
}

exports.get = async (req) => {
    let query = extractQuery(req, req.context)
    let list = await files.get(query, req.context)
    return mapper.toModel(list)
}

exports.getById = async (req) => {
    let log = req.context.logger.start('api/files:getById')

    let file = await files.getById(req.params.id, req.context)

    log.end()
    return mapper.toModel(file)
}

exports.search = async (req) => {
    let query = extractQuery(req, req.context)
    let list = await files.search(query, req.context)
    return mapper.toSearchModel(list)
}

exports.update = async (req) => {
    let log = req.context.logger.start('api/files:update')

    let model = req.body

    let file = await files.update(model, req.params.id, req.context)

    log.end()
    return mapper.toModel(file)
}

exports.remove = async (req, res) => {
    await files.remove(req.params.id, req.context)

    return true
}

exports.streams = async (req, res) => {
    req.context.logger.start('api/files:streams')

    return files.streams(req.params.id, req.headers.range, res, req.context)
}
