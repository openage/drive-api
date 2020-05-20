const mm = require('music-metadata')
const btoa = require('btoa')

exports.meta = async (path) => {
    let metadata = await mm.parseFile(path, { native: false })

    let imageBuffer = null

    if (metadata && metadata.common && metadata.common.picture && metadata.common.picture.length) {
        imageBuffer = metadata.common.picture[0]
    }

    if (!imageBuffer) { return '' }

    let base64String = ''
    for (var i = 0; i < imageBuffer.data.length; i++) {
        base64String += String.fromCharCode(imageBuffer.data[i])
    }

    return 'data:' + imageBuffer.format + ';base64,' + btoa(base64String)
}
