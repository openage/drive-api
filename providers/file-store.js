const fs = require('fs')
const appRoot = require('app-root-path')
const uuid = require('uuid/v1')

const path = require('path')

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

    let parts = file.name.split('.')

    let name = parts[0]
    let ext = parts[1]

    let destDir = config.dir.startsWith('/') ? config.dir : path.join(appRoot.path, config.dir)

    let fileName = `${name}-${uuid()}.${ext}`

    let destination = `${destDir}/${fileName}`
    let url = `${config.root}/${fileName}`

    await move(file.path, destination)

    return { url: url, path: destination }
}

exports.config = (config) => {
    return {
        store: (file) => { return store(file, config) }
    }
}

exports.store = store
