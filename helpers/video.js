var ffmpeg = require('fluent-ffmpeg');
const config = require('config')

exports.meta = async (path, timemark) => {

    return new Promise(function (resolve, reject) {

        let filename

        if (config.ffmpeg) {
            // ffmpeg.setFfprobePath(`${config.ffmpeg.path}ffprobe.exe`);
            ffmpeg.setFfmpegPath(`${config.ffmpeg.path}ffmpeg.exe`);
        }

        // ffmpeg.ffprobe(path, function (err, data) {
        //     console.log(err)
        // })
        ffmpeg(path)
            .on('filenames', function (filenames) {
                filename = filenames[0]
            })
            .on('end', function () {
                console.log("Sc taken")
                resolve(filename)
            })
            .on('error', function (error) {
                reject(error)
                console.log(error)
            })
            .screenshot({
                count: 1,
                folder: 'temp/',
                timemarks: [ Number(timemark) || 0 ],
                size: "320x240",
                filename: "thumb-%b.png"
            })
    })
}
