let service = require('../services/folders')
let files = require('../services/files')
let mapper = require('../mappers/folder')

const api = require('./api-base')('folders', 'folder')
const requestHelper = require('../helpers/paging')

api.get = async (req) => {
    let owner
    let entity
    let folder
    let isPublic

    if (!req.context.user) {
        isPublic = true
    }

    if (req.params.id.isObjectId()) {
        folder = await service.get(req.params.id, req.context)
    } else {
        const query = requestHelper.query(req)
        if (query.isPublic !== undefined) {
            isPublic = query.isPublic
        }
        owner = req.body.owner || query.owner
        entity = req.body.entity || query.entity
        let model = {
            code: req.params.id,
            entity: entity,
            owner: owner,
            isPublic: isPublic,
            parent: req.body.parent || query.parent
        }

        folder = await service.get(model, req.context)

        if (!folder && model.code) {
            folder = await service.create(model, req.context)
        }
    }

    if (!folder) {
        throw new Error(`RESOURCE_NOT_FOUND`)
    }

    folder.folders = (await service.search({
        parent: folder,
        entity: entity,
        owner: owner,
        isPublic: isPublic
    }, null, req.context)).items
    folder.files = (await files.search({
        folder: folder,
        entity: entity,
        isPublic: isPublic,
        owner: owner
    }, null, req.context)).items

    return mapper.toModel(folder, req.context)
}

api.bulkRemove = async (req) => {
    let count = 0

    for (let item of req.body) {
        await service.remove(item.id, req.context).then(() => { count += 1 })
    }

    return `${count} items removed`
}

module.exports = api
