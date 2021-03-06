'use strict'
let service = require('../services/files')
let mapper = require('../mappers/file')

const api = require('./api-base')('files', 'file')
const requestHelper = require('../helpers/paging')

api.create = async (req) => {
    let log = req.context.logger.start('api/files:create')
    if (req.files && req.files.file && req.body.request) {
        req.body = JSON.parse(req.body.request)
    }
    const query = requestHelper.query(req)
    let model = req.body
    model.entity = query.entity || model.entity
    model.folder = query.folder || model.folder
    model.owner = query.owner || model.owner
    model.isPublic = query.isPublic || model.isPublic
    model.isTemplate = query.isTemplate || model.isTemplate
    model.isVirtual = query.isVirtual || model.isVirtual
    model.trashPrevious = query.trashPrevious || model.trashPrevious
    model.name = query.name || model.name
    model.id = query.id || model.id
    model.description = query.description || model.description
    model.code = query.code || model.code
    model.status = query.status || model.status
    model.timemark = query.timemark || model.timemark
    model.template = query.template || model.template
    model.meta = query.meta || model.meta
    model.overwrite = query.overwrite || model.overwrite
    model.tags = query.tags || []
    model.orderNo = query.orderNo || model.orderNo

    if (req.files) {
        model.content = {
            file: req.files.file
        }
        if (model.timemark) {
            if (model.content && model.content.file) {
                model.content.file.timemark = model.timemark
            }
        }
    }

    let document = await service.create(model, req.context)

    return mapper.toModel(document, req.context)
}

api.streams = async (req, res) => {
    return service.streams(req.params.id, req.headers.range, res, req.context)
}

api.providerCallback = async (req) => {
    let provider = require(`../providers/${req.params.provider}`)

    let item = provider.config(null).parse(req.body, req.context)

    if (!item) {
        throw new Error(`could not parse`)
    }

    if (item.status === 'active') {
        await service.update({
            'signature.trackingId': item.id
        }, item, req.context)
    }

    // return mapper.toModel(entity, req.context)
}

api.bulkRemove = async (req) => {
    let count = 0

    for (let item of req.body) {
        await service.remove(item.id, req.context).then(() => { count += 1 })
    }

    return `${count} items removed`
}

module.exports = api
