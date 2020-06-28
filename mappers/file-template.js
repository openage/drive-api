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
        language: entity.language,
        thumbnail: entity.thumbnail,
        isPublic: entity.isPublic,
        isDynamic: entity.isDynamic,
        isPlaceholder: entity.isPlaceholder,
        isRequired: entity.isRequired,
        mimeTypes: entity.mimeTypes || [],
        tags: entity.tags || [],
        owner: entity.owner,
        status: entity.status,
        folder: entity.folder ? { code: entity.folder } : undefined,
        timeStamp: entity.timeStamp
    }

    if (entity.content) {
        if (entity.content.url) {
            model.url = entity.content.url
        } else if (entity.content.body) {
            model.content = entity.content.body
        }
    }

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

    return model
}

exports.toSummary = function (entity, context) {
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
        language: entity.language,
        thumbnail: entity.thumbnail,
        isPublic: entity.isPublic,
        isDynamic: entity.isDynamic,
        isPlaceholder: entity.isPlaceholder,
        isRequired: entity.isRequired,
        mimeTypes: entity.mimeTypes || [],
        tags: entity.tags || [],
        owner: entity.owner,
        status: entity.status,
        folder: entity.folder ? { code: entity.folder } : undefined,
        timeStamp: entity.timeStamp
    }

    return model
}
