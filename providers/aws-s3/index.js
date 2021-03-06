const s3 = require('./s3')
const fs = require('fs')
const S3ReadableStream = require('s3-readable-stream')

const imageHelper = require('../../helpers/image')
const audioHelper = require('../../helpers/audio')
var mime = require('mime-types')

const uploadPart = async (partParams) => {
    var partNo = 1
    var uploaded = {
        Parts: []
    }

    for (var index = 0; index < partParams.length; index++) {
        let part = partParams[index]
        let data = null

        data = await s3.uploadPart(part)
        uploaded.Parts.push({
            ETag: data.ETag,
            PartNumber: partNo
        })
        partNo++
    }

    return uploaded
}

exports.config = (awsBucketConfig) => {
    const store = async (file) => {
        let fileName = file.name
        let fileBuffer = fs.readFileSync(file.path)
        let fileType = file.type

        let createUploadData = await s3.createMultipartUpload({
            Bucket: awsBucketConfig.bucketName,
            Key: fileName,
            ContentType: fileType
        })

        var partParams = []
        let initialPartNumber = 0
        let minPartSize = 1024 * 1024 * 5

        for (var rangeStart = 0; rangeStart < fileBuffer.length; rangeStart += minPartSize) {
            initialPartNumber++
            var end = Math.min(rangeStart + minPartSize, fileBuffer.length)
            partParams.push({
                Body: fileBuffer.slice(rangeStart, end),
                Bucket: awsBucketConfig.bucketName,
                Key: fileName,
                PartNumber: String(initialPartNumber),
                UploadId: createUploadData.UploadId
            })
        }

        console.log('part_params', partParams)

        let multipartUpload = await uploadPart(partParams)

        var doneParams = {
            Bucket: awsBucketConfig.bucketName,
            Key: fileName,
            MultipartUpload: multipartUpload,
            UploadId: createUploadData.UploadId
        }

        let completeUploadData = await s3.completeMultipartUpload(doneParams)
        let url = completeUploadData.Location

        let type = file.type.split('/')[0]

        let meta = {}

        if (type === 'audio') {
            meta.thumbnail = await audioHelper.meta(url)
        } else {
            meta.thumbnail = await imageHelper.meta(url)
        }

        return {
            url: url,
            thumbnail: meta.thumbnail || file.thumbnail,
            size: file.size,
            mimeType: mime.lookup(file.name),
            provider: 'aws-s3'
        }
    }

    const streamFile = async (params, target) => {
        return s3.readStream({
            Bucket: awsBucketConfig.bucketName,
            Key: params.key,
            Range: params.range
        }, target)
    }

    return {
        store: store,
        streamFile: streamFile
    }
}
