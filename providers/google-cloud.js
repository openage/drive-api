const Cloud = require('@google-cloud/storage')
const path = require('path')
const serviceKey = require('config').get('google-cloud')
// const serviceKey = path.join(__dirname, './keys.json')
const appRoot = require('app-root-path')
const fs = require('fs')

const { Storage } = Cloud

const storage = new Storage({
    credentials: serviceKey,
    projectId: 'telepain-md-stage',
})

const imageHelper = require('../helpers/image')
const audioHelper = require('../helpers/audio')
const videoHelper = require('../helpers/video')
var mime = require('mime-types')

const util = require('util')
// const gc = require('./config/')
// should be your bucket name

/**
 *
 * @param { File } object file object that will be uploaded
 * @description - This function does the following
 * - It uploads a file to the image bucket on Google Cloud
 * - It accepts an object as an argument with the
 *   "originalname" and "buffer" as keys
 */

const uploadImage = (file, config) => new Promise((resolve, reject) => {
    const bucket = storage.bucket(config.bucket)

    const fileName = path.basename(file.path);
    const cloudFile = bucket.file(fileName);

    bucket.upload(file.path, {})
        .then(() => cloudFile.makePublic())
        .then(() => { resolve(`https://storage.googleapis.com/${bucket.name}/${fileName}`) });
})

const move = async (oldPath, newPath) => {
    const copy = (cb) => {
        var readStream = fs.createReadStream(oldPath)
        var writeStream = fs.createWriteStream(newPath)

        readStream.on('error', cb)
        writeStream.on('error', cb)

        readStream.on('close', function () {
            fs.unlink(oldPath, cb)
        })

        readStream.pipe(writeStream)
    }

    return new Promise((resolve, reject) => {
        fs.rename(oldPath, newPath, function (err) {
            if (err) {
                if (err.code === 'EXDEV') {
                    copy(err => {
                        if (err) {
                            reject(err)
                        } else {
                            resolve()
                        }
                    })
                } else {
                    reject(err)
                }
            } else {
                resolve()
            }
        })
    })
}

const store = async (file, config) => {
    config = config || require('config').get('providers.file-store')

    let destDir = config.dir.startsWith('/') ? config.dir : path.join(appRoot.path, config.dir)

    let url = await uploadImage(file, config)

    let fileType = file.type.split('/')[0]

    let meta = {}

    if (fileType === 'audio') {
        meta.thumbnail = await audioHelper.meta(file.path)
    } else if (fileType === 'video') {
        let thumbnail = await videoHelper.meta(file.path, file.timemark || 0)
        let thumbnailDestination = `${destDir}/${thumbnail}`
        await move(`temp/${thumbnail}`, thumbnailDestination)
        meta.thumbnail = `${config.root}/${thumbnail}`
    } else {
        meta.thumbnail = await imageHelper.meta(file.path)
    }

    return {
        url: url,
        thumbnail: meta.thumbnail || file.thumbnail,
        size: file.size,
        mimeType: mime.lookup(file.name),
        provider: 'google-cloud'
    }
}

exports.config = (config) => {
    return {
        store: (file) => { return store(file, config) }
    }
}

exports.store = store
