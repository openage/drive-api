'use strict'

let fs = require('fs')
const client = new (require('node-rest-client-promise')).Client()
const logger = require('@open-age/logger')('streams')

exports.get = async (req, res) => {

    // let log = req.context.logger.start('api/streams/get')

    // let document = await db.file.findById(req.params.id)

    // if (!document) {
    //     throw new Error(`No Such Document of Id ${req.params.id} found`)
    // }

    // let provider = require(`../providers/${document.store}`)

    // let file = await require('../services/files').stream(req.params.id, { logger: logger })

    // console.log(file)

    const path = 'data/sample.mp4'
    const stat = fs.statSync(path)
    const fileSize = stat.size
    const range = req.headers.range
    if (range) {
        const parts = range.replace(/bytes=/, "").split("-")
        const start = parseInt(parts[0], 10)
        const end = parts[1]
            ? parseInt(parts[1], 10)
            : fileSize - 1
        const chunksize = (end - start) + 1
        const file = fs.createReadStream(path, { start, end })
        const head = {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': 'video/mp4',
        }
        res.writeHead(206, head);
        file.pipe(res);
    } else {
        const head = {
            'Content-Length': fileSize,
            'Content-Type': 'audio/mp3'
        }
        res.writeHead(200, head)
        // const url = new URL('https://aquasocial.s3.ap-southeast-1.amazonaws.com/00+Akkad_Bakkad_-_Badshah_-_128Kbps_-_www.DjPunjab.Com.mp3')
        return fs.createReadStream(path).pipe(res)
    }

    // return client.getPromise('https://aquasocial.s3.ap-southeast-1.amazonaws.com/00+Akkad_Bakkad_-_Badshah_-_128Kbps_-_www.DjPunjab.Com.mp3').then((file) => {
    //     console.log(file)

    //     return s3.getObject({
    //         Bucket: 'aquasocial',
    //         Key: 'alan_walker_-_fade-RingtonesHub-884.mp3',
    //         Range: 
    // }).pipe(res)
    // })
    //     .catch((err) => {
    //         console.log(err)
    //     })

}
