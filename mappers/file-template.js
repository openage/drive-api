'use strict'

exports.toModel = function (entity, context) {
    if (!entity) {
        return
    }

    if (entity._bsontype === 'ObjectId') {
        return {
            id: entity.toString()
        }
    }

    let model = {
        id: entity.id,
        code: entity.code,
        name: entity.name,
        summary: entity.summary,
        config: entity.config,
        timeStamp: entity.timeStamp
    }

    if (entity.content) {
        if (entity.content.url) {
            model.url = entity.content.url
        } else if (entity.content.body) {
            model.content = entity.content.body
        }
    }
    model.tags = entity.tags
    model.owner = entity.owner

    if (entity.folder) {
        model.folder = {
            code: entity.folder
        }
    }

    model.language = entity.language
    model.thumbnail = entity.thumbnail
    model.isPublic = entity.isPublic
    model.isDynamic = entity.isDynamic
    model.isPlaceholder = entity.isPlaceholder
    model.isRequired = entity.isRequired
    model.mimeTypes = entity.mimeTypes || []

    model.hooks = (entity.hooks || []).map(m => {
        return {
            trigger: m.trigger,
            url: m.url,
            action: m.action,
            config: m.config,
            data: m.data
        }
    })

    if (entity.dataSource) {
        model.dataSource = {
            type: entity.dataSource.type,
            connectionString: entity.dataSource.connectionString,
            config: entity.dataSource.config || {},
            params: entity.dataSource.params || [],
            field: entity.dataSource.field || ''
        }
    }

    model.status = entity.status

    return model
}
