const jimp = require('jimp')

exports.meta = async (url) => {
    if (!url) {
        return null
    }

    const item = await jimp.read(url)
    if (!item) {
        return null
    }

    return new Promise((resolve, reject) => {
        item.resize(15, 15) // resize
            .quality(50) // set JPEG quality
            .getBase64(jimp.MIME_JPEG, function (err, base64, src) {
                if (err) {
                    return reject(err)
                }
                return resolve(base64)
            })
    })
}
