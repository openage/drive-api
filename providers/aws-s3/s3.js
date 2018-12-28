'use strict'
let awsBucketConfig = require('config').get('providers.aws-s3')
let AWS = require('aws-sdk')

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

exports.completeMultipartUpload = completeMultipartUpload
exports.uploadPart = uploadPart
exports.createMultipartUpload = createMultipartUpload
