'use strict'
let awsBucketConfig = require('config').get('providers.aws-s3')
let AWS = require('aws-sdk')
const S3ReadableStream = require('s3-readable-stream')

AWS.config.update({
    accessKeyId: awsBucketConfig.accessKeyId,
    secretAccessKey: awsBucketConfig.secretAccessKey
})

let s3 = new AWS.S3()

const completeMultipartUpload = (doneParams) => {
    return new Promise((resolve, reject) => {
        s3.completeMultipartUpload(doneParams, function (err, data) {
            if (err) {
                reject(err)
            } else {
                resolve(data)
            }
        })
    })
}

const uploadPart = (part) => {
    return new Promise((resolve, reject) => {
        s3.uploadPart(part, function (err, data) {
            if (err) {
                reject(err)
            } else {
                resolve(data)
            }
        })
    })
}

const createMultipartUpload = (param) => {
    return new Promise((resolve, reject) => {
        s3.createMultipartUpload(param, function (err, data) {
            if (err) {
                reject(err)
            } else {
                resolve(data)
            }
        })
    })
}

const readStream = async (params, target) => {
    const s3Client = new AWS.S3({
        accessKeyId: awsBucketConfig.accessKeyId,
        secretAccessKey: awsBucketConfig.secretAccessKey
    })
    const stream = new S3ReadableStream(s3Client, params)

    stream.on('error', (err) => {
        throw new Error(err)
    })

    await stream.pipe(target)

    target.on('close', stream.destroy)
}

exports.completeMultipartUpload = completeMultipartUpload
exports.uploadPart = uploadPart
exports.createMultipartUpload = createMultipartUpload
exports.readStream = readStream
