'use strict'

const entityFileService = require('../services/entity-files')
const mapper = require('../mappers/entity-file')

exports.create = async (req) => {
    let log = req.context.logger.start('api:entity-files:create')

    return entityFileService.getOrCreate(req.body, req.context).then((entityFile) => {
        log.end()
        return mapper.toModel(entityFile)
    })
}