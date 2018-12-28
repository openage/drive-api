'use strict'

exports.toModel = entity => {
    let model = {
        id: entity.id || entity._id.toString(),
        name: entity.name,
        description: entity.description,
        thumbnail: entity.thumbnail,
        mimeTypes: entity.mimeTypes,
        isPublic: entity.isPublic,
        isVirtual: entity.isVirtual,
        url: entity.url,
        isRequired: entity.isRequired,
        entityType: entity.entityType
    }

    return model
}