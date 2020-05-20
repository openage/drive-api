
var mime = require('mime-types')

const store = async (body, config) => {
    // config = config || require('config').get('providers.html-store')

    let meta = {}

    return {
        url: null,
        path: null,
        body: body,
        thumbnail: null, // TODO: generate image from the html
        size: 0, // TODO
        mimeType: mime.lookup('.html'),
        provider: 'html-store'
    }
}

exports.config = (config) => {
    return {
        store: (body) => { return store(body, config) }
    }
}

exports.store = store
