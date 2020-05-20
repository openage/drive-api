let service = require('../services/folders')
let files = require('../services/files')
let mapper = require('../mappers/folder')

const api = require('./api-base')('folders', 'folder')
const requestHelper = require('../helpers/paging')

api.get = async (req) => {
    let entity
    if (req.params.id.isObjectId()) {
        entity = await service.get(req.params.id, req.context)
    } else {
        const query = requestHelper.query(req)
        let model = {
            code: req.params.id,
            entity: req.body.entity || query.entity,
            owner: req.body.owner || query.owner,
            parent: req.body.parent || query.parent
        }

        entity = await service.get(model, req.context)

        if (!entity && model.code) {
            entity = await service.create(model, req.context)
        }
    }

    if (!entity) {
        throw new Error(`RESOURCE_NOT_FOUND`)
    }

    entity.folders = await service.search({ parent: entity }, null, req.context)
    entity.files = await files.search({ folder: entity }, null, req.context)

    return mapper.toModel(entity, req.context)
}

api.bulkRemove = async (req) => {
    let count = 0

    for (let item of req.body) {
        await service.remove(item.id, req.context).then(() => { count += 1 })
    }

    return `${count} items removed`
}

module.exports = api
