const folders = require('config').get('folders')
const appRoot = require('app-root-path')
const path = require('path')
const fs = require('fs')

exports.ensureDir = path => {
    if (fs.existsSync(path)) {
        return
    }

    let parts = path.split('/')

    let parent = parts.slice(0, parts.length - 1).join('/')

    this.ensureDir(parent)

    fs.mkdirSync(path)
}

exports.temp = () => {
    let dir = folders.temp

    if (!dir) {
        dir = `${appRoot}/temp`
    }

    if (!dir.startsWith('/')) {
        dir = `${appRoot}/${dir}`
    }

    dir = path.resolve(dir)

    this.ensureDir(dir)

    return dir
}
