'use strict'

const fileTemplateService = require('../../../../services/file-templates')
const fileService = require('../../../../services/files')

exports.process = async (entity, context) => {
    context.logger.silly(`getting file templates for folder ${entity.code}`)

    var fileTemplates = await fileTemplateService.search({
        folder: {
            code: entity.code
        }
    }, null, context)

    context.logger.debug(`${fileTemplates.count} template(s) found`)
    for (const item of fileTemplates.items) {
        context.logger.debug(`creating file ${item.code}`)

        await fileService.create({
            folder: {
                id: entity.id
            },
            template: {
                id: item.id
            }
        }, context)
    }
}
