let folders = require('../services/folders')
let files = require('../services/files')

let mapper = require('../mappers/folder')

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

    return mapper.toModel(folder)
}
