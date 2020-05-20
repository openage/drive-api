'use strict'

const fileTemplates = require('../services/file-templates')
const fileService = require('../services/files')

exports.get = function (req, res) {
    fileTemplates.buildById(req.params.code, req.params.id, req.params.ext, req.context).then(entity => {
        res.contentType(entity.mimeType)
        res.header('Content-disposition', `inline; filename=${entity.name}`)
        res.send(entity.content)
    }).catch(err => res.failure(err))
}

exports.create = function (req, res) {
    fileTemplates.buildByModel(req.params.code, req.body, req.params.ext, req.context).then(entity => {
        res.contentType(entity.mimeType)
        res.header('Content-disposition', `inline; filename=${entity.name}`)
        res.send(entity.content)
    }).catch(err => res.failure(err))
}

exports.parse = async (req) => {
    if (!req.files || !req.files.file) {
        return ''
    }

    return {
        name: req.files.file.name,
        mimeType: 'text/html',
        content: await fileService.toHtml(req.files.file, req.context)
    }
}

exports.preview = async (req) => {
    return fileTemplates.buildByModel(req.params.code, req.body, 'json', req.context)
}
