exports.toModel = (entity, context) => {
    if (!entity) {
        return
    }

    if (typeof entity === 'string') {
        entity = {
            url: entity,
            thumbnail: entity
        }
    }

    return {
        url: entity.url,
        thumbnail: entity.thumbnail,
        data: entity.thumbnail
    }
}
