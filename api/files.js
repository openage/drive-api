'use strict'
let files = require('../services/files')
let mapper = require('../mappers').file

const extractQuery = (req, context) => {
    let query = {
        name: req.query.name || req.params.name || req.body.name,
        isPublic: req.query['is-public'] || req.params.isPublic || req.body.isPublic,
        isTemplate: req.query['is-template'] || req.params.isTemplate || req.body.isTemplate,
        isVirtual: req.query['is-virtual'] || req.params.isVirtual || req.body.isVirtual
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
        file: req.files.file
    }, req.context)

    return mapper.toModel(document)
}

exports.get = async (req) => {
    let query = extractQuery(req, req.context)
    let list = await files.get(query, req.context)
    return mapper.toModel(list)
}

exports.search = async (req) => {
    let query = extractQuery(req, req.context)
    let list = await files.search(query, req.context)
    return mapper.toModels(list)
}
