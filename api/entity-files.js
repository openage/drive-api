'use strict'

const entityFileService = require('../services/entity-files')
const mapper = require('../mappers/entity-file')

exports.create = async (req) => {
    let log = req.context.logger.start('api/entity-files:create')

    let model = req.body

    let entityType

    if (req.params.entityType) {
        entityType = req.params.entityType
    } else if (req.body.entityType) {
        entityType = req.body.entityType
    } else {
        entityType = 'role'
    }

    model.entityType = entityType

    return entityFileService.getOrCreate(model, req.context).then((entityFile) => {
        log.end()
        return mapper.toModel(entityFile)
    })
}

exports.get = async (req) => {
    let log = req.context.logger.start('api/entity-file:get')

    return entityFileService.getById(req.params.id, req.context).then((entityFile) => {
        log.end()
        return mapper.toModel(entityFile)
    })
}

exports.search = (req) => {
    let log = req.context.logger.start('api/entity-file:search')

    let query = {}

    if (req.context.organization) {
        query.organization = req.context.organization
    }

    if (req.query.entityType) {
        query.entityType = req.query.entityType
    }

    return entityFileService.search(query, req.context).then((files) => {
        log.end()
        return mapper.toSearchModel(files)
    })
}
