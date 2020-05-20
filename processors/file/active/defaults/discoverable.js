'use strict'

const discover = require('@open-age/discover-client')

exports.process = async (file, context) => {
    let log = context.logger.start('processors/entity/create:default')

    if (!file || !file.isPublic) {
        return
    }

    await discover.profiles.create({
        entity: {
            id: file.id,
            type: 'file',
            provider: 'drive'
        },
        name: file.name,
        about: file.description,
        meta: {
            code: file.code,
            mimeTypes: file.mimeTypes,
            size: file.content.size,
            mimeType: file.content.mimeType,
            version: file.version,
            folderName: file.folderName
        },
        status: file.status,
        pic: {
            url: file.content.thumbnail
        }
    }, context)
}
