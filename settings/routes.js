'use strict'
var auth = require('../helpers/auth')
var apiRoutes = require('@open-age/express-api')
var fs = require('fs')
var loggerConfig = require('config').get('logger')
var appRoot = require('app-root-path')
const specs = require('../specs')
var multipart = require('connect-multiparty')
var multipartMiddleware = multipart()

module.exports.configure = (app, logger) => {
    logger.start('settings:routes:configure')

    let specsHandler = function (req, res) {
        fs.readFile('./public/specs.html', function (err, data) {
            if (err) {
                res.writeHead(404)
                res.end()
                return
            }
            res.contentType('text/html')
            res.send(data)
        })
    }

    app.get('/', specsHandler)

    app.get('/swagger', (req, res) => {
        res.writeHeader(200, {
            'Content-Type': 'text/html'
        })
        fs.readFile('./public/swagger.html', null, function (err, data) {
            if (err) {
                res.writeHead(404)
                res.end()
                return
            }
            res.write(data)
            res.end()
        })
    })

    app.get('/specs', specsHandler)

    app.get('/api/specs', function (req, res) {
        res.contentType('application/json')
        res.send(specs.get())
    })

    app.get('/logs', function (req, res) {
        var filePath = appRoot + '/' + loggerConfig.file.filename

        fs.readFile(filePath, function (err, data) {
            if (err) {
                res.writeHead(404)
                res.end()
                return
            }
            res.contentType('application/json')
            res.send(data)
        })
    })

    var api = apiRoutes(app)
    api.model('files')
        .register([{
            action: 'GET',
            method: 'search',
            filter: auth.requiresRoleKey
        }, {
            action: 'GET',
            method: 'getById',
            url: '/:id',
            filter: auth.requiresRoleKey
        }, {
            action: 'POST',
            method: 'create',
            filter: [multipartMiddleware, auth.requiresRoleKey]
        }, {
            action: 'PUT',
            method: 'update',
            url: '/:id',
            filter: auth.requiresRoleKey
        }, {
            action: 'DELETE',
            method: 'remove',
            url: '/:id',
            filter: auth.requiresRoleKey
        }, {
            action: 'GET',
            method: 'streams',
            url: '/:id/streams',
            filter: auth.requiresRoleKey
        }])

    api.model({
        root: ':entityType/:entityId/files',
        controller: 'files'
    }).register([{
        action: 'POST',
        method: 'create',
        filter: [multipartMiddleware, auth.requiresRoleKey]
    }, {
        action: 'POST',
        method: 'create',
        url: '/:name',
        filter: [multipartMiddleware, auth.requiresRoleKey]
    }, {
        action: 'GET',
        method: 'get',
        url: '/:name',
        filter: [multipartMiddleware, auth.requiresRoleKey]
    }, {
        action: 'GET',
        method: 'search',
        filter: auth.requiresRoleKey
    }, {
        action: 'PUT',
        method: 'update',
        url: '/:id',
        filter: auth.requiresRoleKey
    }])

    api.model({ root: 'entityFiles', controller: 'entity-files' }).register([{
        action: 'POST',
        method: 'create',
        filter: auth.requiresRoleKey
    }])

    // api.model('streams')
    //     .register([{
    //         action: 'GET',
    //         method: 'get',
    //         url: '/:id'
    //     }])

    api.model('folders')
        .register([{
            action: 'POST',
            method: 'bulkRemove',
            url: '/deletes',
            filter: auth.requiresRoleKey
        }, {
            action: 'POST',
            method: 'create',
            filter: auth.requiresRoleKey
        }, {
            action: 'GET',
            method: 'search',
            filter: auth.requiresRoleKey
        }, {
            url: '/:id',
            action: 'POST',
            method: 'create',
            filter: auth.requiresRoleKey
        }, {
            action: 'GET',
            method: 'get',
            url: '/:id',
            filter: auth.requiresRoleKey
        }, {
            action: 'PUT',
            method: 'update',
            url: '/:id',
            filter: auth.requiresRoleKey
        }, {
            action: 'DELETE',
            method: 'remove',
            url: '/:id',
            filter: auth.requiresRoleKey
        }])
}
