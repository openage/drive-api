
var mime = require('mime-types')

const store = async (json, config) => {
    let meta = {}

    return {
        url: null,
        path: null,
        body: JSON.stringify(json),
        thumbnail: null, // TODO: generate image from the JSON
        size: 0, // TODO
        mimeType: mime.lookup('.json'),
        provider: 'json-store'
    }
}

exports.config = (config) => {
    return {
        store: (body) => { return store(body, config) }
    }
}

exports.store = store
